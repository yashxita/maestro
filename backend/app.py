import sys, os, io, base64
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Import database and models
from database import engine, get_db, Base
from models import User, UploadedFile, Podcast, Quiz, QuizQuestion, Chat, Message
import crud
from auth import create_access_token, get_current_user, get_current_user_optional

from utils.extracts import extract_text
from utils.gemini import generate_podcast_script, generate_quiz
from audio import generate_audio_gemini as generate_audio
import s3_utils

app = FastAPI(title="NotebookLM Backend", version="1.0.0")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Specific origins from environment variable
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")

# ---------- MODELS ----------
class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "host"
    speed: Optional[float] = 1.0

class SignupRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str


# ---------- AUTHENTICATION ROUTES ----------

@app.post("/signup")
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account"""
    # Check if user already exists
    existing_user = crud.get_user_by_email(db, req.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = crud.create_user(db, email=req.email, password=req.password, name=req.name)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at.isoformat()
        },
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    # Authenticate user
    user = crud.authenticate_user(db, email=req.email, password=req.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )
    
    # Update last login
    crud.update_last_login(db, user.id)
    
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "last_login": user.last_login.isoformat() if user.last_login else None
        },
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user information"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "created_at": current_user.created_at.isoformat(),
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None
    }


# ---------- ROUTES ----------

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {"status": "healthy", "message": "NotebookLM Backend API"}


@app.get("/files")
def get_all_files(skip: int = 0, limit: int = 100, 
                  current_user: Optional[User] = Depends(get_current_user_optional),
                  db: Session = Depends(get_db)):
    """Get all uploaded files (filtered by user if authenticated)"""
    files = crud.get_all_uploaded_files(db, skip=skip, limit=limit)
    
    # Filter by user if authenticated
    if current_user:
        files = [f for f in files if f.user_id == current_user.id]
    
    return {"files": [
        {
            "id": f.id,
            "filename": f.filename,
            "file_type": f.file_type,
            "file_size": f.file_size,
            "upload_date": f.upload_date.isoformat(),
            "text_preview": f.text_preview
        }
        for f in files
    ]}


@app.get("/files/{file_id}")
def get_file_details(file_id: int, db: Session = Depends(get_db)):
    """Get specific file details with full text"""
    file = crud.get_uploaded_file(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    return {
        "id": file.id,
        "filename": file.filename,
        "file_type": file.file_type,
        "file_size": file.file_size,
        "upload_date": file.upload_date.isoformat(),
        "extracted_text": file.extracted_text,
        "text_preview": file.text_preview
    }


@app.delete("/files/{file_id}")
def delete_file(file_id: int, db: Session = Depends(get_db)):
    """Delete a file and all related data"""
    success = crud.delete_uploaded_file(db, file_id)
    if not success:
        raise HTTPException(status_code=404, detail="File not found")
    return {"message": "File deleted successfully"}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...), 
                     current_user: Optional[User] = Depends(get_current_user_optional),
                     db: Session = Depends(get_db)):
    """Upload a PDF or PPTX, extract text, generate podcast, and save to S3."""
    try:
        contents = await file.read()
        
        import hashlib
        file_hash = hashlib.md5(contents).hexdigest()
        s3_file_key = f"files/{file_hash}_{file.filename}"
        
        if s3_utils.file_exists(s3_file_key):
            # File exists, check database for existing record
            existing_file = crud.get_file_by_s3_key(db, s3_file_key)
            if existing_file:
                # Check if podcast exists for this file
                existing_podcast = crud.get_existing_podcast_with_audio(db, existing_file.id, "host", 1.0)
                
                if existing_podcast:
                    # Return cached file and podcast data
                    return JSONResponse({
                        "file_id": existing_file.id,
                        "filename": existing_file.filename,
                        "text_preview": existing_file.text_preview,
                        "full_text": existing_file.extracted_text,
                        "podcast_script": existing_podcast.script,
                        "cached": True
                    })
        
        tmp_path = f"/tmp/{file.filename}"
        with open(tmp_path, "wb") as f:
            f.write(contents)

        # Extract text
        text = extract_text(tmp_path)
        if not text:
            os.remove(tmp_path)
            raise HTTPException(status_code=400, detail="No text extracted")

        file_type = os.path.splitext(file.filename)[1].lower().replace(".", "")
        content_type = "application/pdf" if file_type == "pdf" else "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        s3_file_url = s3_utils.upload_file(tmp_path, s3_file_key, content_type=content_type)

        # Save file to database with S3 key
        user_id = current_user.id if current_user else None
        db_file = crud.create_uploaded_file(
            db=db,
            filename=file.filename,
            file_type=file_type,
            file_size=len(contents),
            extracted_text=text,
            s3_key=s3_file_key,
            user_id=user_id
        )

        podcast_script = generate_podcast_script(text)
        
        try:
            audio_stream = generate_audio(podcast_script, voice="host", speed=1.0)
            audio_bytes = b"".join(audio_stream)
            audio_fileobj = io.BytesIO(audio_bytes)
            
            # Upload podcast audio to S3
            s3_audio_key = f"podcast_{file_hash}_host_speed1.0.mp3"
            audio_url = s3_utils.upload_fileobj(audio_fileobj, s3_audio_key, content_type="audio/mpeg")
            
            # Save podcast to database with audio URL
            crud.create_podcast(
                db=db,
                file_id=db_file.id,
                script=podcast_script,
                voice_type="host",
                speed=1.0,
                audio_url=audio_url
            )
        except Exception as e:
            print(f"Failed to generate/upload podcast audio: {e}")
            # Continue without podcast audio

        # Clean up temp file
        os.remove(tmp_path)

        return JSONResponse({
            "file_id": db_file.id,
            "filename": db_file.filename,
            "text_preview": db_file.text_preview,
            "full_text": db_file.extracted_text,
            "podcast_script": podcast_script,
            "cached": False
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----- PODCAST -----
@app.post("/podcast")
async def podcast_from_text(req: TTSRequest, db: Session = Depends(get_db)):
    """Generate podcast script from text using Gemini and save to database."""
    script = generate_podcast_script(req.text)
    
    # Optionally save to database if file_id is provided
    # For now, just return the script
    return JSONResponse({"podcast_script": script})


@app.post("/files/{file_id}/podcast")
async def create_podcast_for_file(file_id: int, voice: str = "host", speed: float = 1.0, 
                                  db: Session = Depends(get_db)):
    """Generate and save podcast for a specific file, or return existing cached version"""
    # Get file
    file = crud.get_uploaded_file(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    existing_podcast = crud.get_existing_podcast_with_audio(db, file_id, voice, speed)
    if existing_podcast:
        return JSONResponse({
            "podcast_id": existing_podcast.id,
            "file_id": existing_podcast.file_id,
            "script": existing_podcast.script,
            "audio_url": existing_podcast.audio_url,
            "voice_type": existing_podcast.voice_type,
            "speed": existing_podcast.speed,
            "cached": True,
            "created_at": existing_podcast.created_at.isoformat()
        })
    
    # Generate script
    script = generate_podcast_script(file.extracted_text)
    
    try:
        audio_stream = generate_audio(script, voice=voice, speed=speed)
        
        # Convert iterator to bytes
        audio_bytes = b"".join(audio_stream)
        audio_fileobj = io.BytesIO(audio_bytes)
        
        # Upload to S3
        voice_label = "male_host" if voice == "host" else "female_guest"
        s3_key = f"podcast_{file_id}_{voice_label}_speed{speed}.mp3"
        audio_url = s3_utils.upload_fileobj(audio_fileobj, s3_key, content_type="audio/mpeg")
        
        # Save to database with audio URL
        podcast = crud.create_podcast(
            db=db,
            file_id=file_id,
            script=script,
            voice_type=voice,
            speed=speed,
            audio_url=audio_url
        )
        
        return JSONResponse({
            "podcast_id": podcast.id,
            "file_id": podcast.file_id,
            "script": podcast.script,
            "audio_url": podcast.audio_url,
            "voice_type": podcast.voice_type,
            "speed": podcast.speed,
            "cached": False,
            "created_at": podcast.created_at.isoformat()
        })
    except Exception as e:
        # If audio generation/upload fails, still save the script
        podcast = crud.create_podcast(
            db=db,
            file_id=file_id,
            script=script,
            voice_type=voice,
            speed=speed
        )
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")


@app.post("/podcasts/{podcast_id}/generate-audio")
async def generate_audio_for_podcast(podcast_id: int, db: Session = Depends(get_db)):
    """Generate and upload audio for an existing podcast script"""
    podcast = crud.get_podcast(db, podcast_id)
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")
    
    # If audio already exists, return it
    if podcast.audio_url:
        return JSONResponse({
            "podcast_id": podcast.id,
            "audio_url": podcast.audio_url,
            "message": "Audio already exists"
        })
    
    try:
        # Generate audio from script
        audio_stream = generate_audio(podcast.script, voice=podcast.voice_type, speed=podcast.speed)
        
        # Convert stream to bytes
        audio_bytes = b"".join(audio_stream)
        audio_fileobj = io.BytesIO(audio_bytes)
        
        # Upload to S3
        voice_label = "male_host" if podcast.voice_type == "host" else "female_guest"
        s3_key = f"podcast_{podcast.file_id}_{voice_label}_speed{podcast.speed}_{podcast.id}.mp3"
        audio_url = s3_utils.upload_fileobj(audio_fileobj, s3_key, content_type="audio/mpeg")
        
        # Update podcast with audio URL
        podcast = crud.update_podcast_audio_url(db, podcast_id, audio_url)
        
        return JSONResponse({
            "podcast_id": podcast.id,
            "audio_url": podcast.audio_url,
            "message": "Audio generated and uploaded successfully"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")


@app.get("/files/{file_id}/podcasts")
def get_file_podcasts(file_id: int, db: Session = Depends(get_db)):
    """Get all podcasts for a file"""
    podcasts = crud.get_podcasts_by_file(db, file_id)
    return {"podcasts": [
        {
            "id": p.id,
            "script": p.script,
            "audio_url": p.audio_url,
            "voice_type": p.voice_type,
            "speed": p.speed,
            "created_at": p.created_at.isoformat()
        }
        for p in podcasts
    ]}


# ----- QUIZ -----
@app.post("/generate-quiz")
async def generate_quiz_endpoint(req: dict, db: Session = Depends(get_db)):
    """Generate structured quiz questions from text."""
    try:
        text = req.get("text")
        count = int(req.get("count", 5))
        quiz_questions = generate_quiz(text, count)
        return JSONResponse({"success": True, "quiz": quiz_questions})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/files/{file_id}/quiz")
async def create_quiz_for_file(file_id: int, count: int = 5, db: Session = Depends(get_db)):
    """Generate and save quiz for a specific file"""
    # Get file
    file = crud.get_uploaded_file(db, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Generate quiz
    quiz_questions = generate_quiz(file.extracted_text, count)
    
    # Save to database
    quiz = crud.create_quiz_with_questions(
        db=db,
        file_id=file_id,
        questions_data=quiz_questions
    )
    
    # Get questions
    questions = crud.get_quiz_questions(db, quiz.id)
    
    return JSONResponse({
        "quiz_id": quiz.id,
        "file_id": quiz.file_id,
        "question_count": quiz.question_count,
        "questions": [
            {
                "id": q.question_number,
                "question": q.question_text,
                "options": q.options,
                "correctAnswer": q.correct_answer,
                "explanation": q.explanation
            }
            for q in questions
        ],
        "created_at": quiz.created_at.isoformat()
    })


@app.get("/files/{file_id}/quizzes")
def get_file_quizzes(file_id: int, db: Session = Depends(get_db)):
    """Get all quizzes for a file"""
    quizzes = crud.get_quizzes_by_file(db, file_id)
    result = []
    
    for quiz in quizzes:
        questions = crud.get_quiz_questions(db, quiz.id)
        result.append({
            "id": quiz.id,
            "question_count": quiz.question_count,
            "created_at": quiz.created_at.isoformat(),
            "questions": [
                {
                    "id": q.question_number,
                    "question": q.question_text,
                    "options": q.options,
                    "correctAnswer": q.correct_answer,
                    "explanation": q.explanation
                }
                for q in questions
            ]
        })
    
    return {"quizzes": result}


@app.post("/quiz")
async def quiz_from_text(req: TTSRequest):
    """Generate quiz questions from text (legacy endpoint)"""
    quiz = generate_quiz(req.text)
    return JSONResponse({"quiz": quiz})


# ----- AUDIO -----
@app.post("/audio/generate")
async def generate_audio_endpoint(req: TTSRequest, db: Session = Depends(get_db)):
    """Generate audio with host (male) or guest (female) voice, with S3 caching"""
    try:
        if req.voice not in ["host", "guest"]:
            req.voice = "host"
        
        file_id = None
        actual_text = req.text
        if req.text.startswith("file_id:"):
            parts = req.text.split(":", 2)
            if len(parts) == 3:
                try:
                    file_id = int(parts[1])
                    actual_text = parts[2]
                except ValueError:
                    pass
        
        if file_id:
            existing_podcast = crud.get_existing_podcast_with_audio(db, file_id, req.voice, req.speed)
            if existing_podcast and existing_podcast.audio_url:
                try:
                    # Extract S3 key from URL
                    s3_key = existing_podcast.audio_url.split('/')[-1]
                    audio_data = s3_utils.download_fileobj(s3_key)
                    return StreamingResponse(
                        io.BytesIO(audio_data),
                        media_type="audio/mpeg",
                        headers={"Content-Disposition": f"inline; filename=podcast_cached.mp3"}
                    )
                except Exception as e:
                    print(f"Failed to stream from S3: {e}, regenerating...")
        
        audio_stream = generate_audio(actual_text, voice=req.voice, speed=req.speed)
        
        if file_id:
            try:
                # Convert stream to bytes
                audio_bytes = b"".join(audio_stream)
                
                # Create TWO separate BytesIO objects to avoid closure issues
                audio_for_s3 = io.BytesIO(audio_bytes)
                audio_for_response = io.BytesIO(audio_bytes)
                
                # Upload to S3 (this may close audio_for_s3)
                voice_label = "male_host" if req.voice == "host" else "female_guest"
                s3_key = f"podcast_{file_id}_{voice_label}_speed{req.speed}.mp3"
                audio_url = s3_utils.upload_fileobj(audio_for_s3, s3_key, content_type="audio/mpeg")
                
                # Save to database
                crud.create_podcast(
                    db=db,
                    file_id=file_id,
                    script=actual_text[:1000],
                    voice_type=req.voice,
                    speed=req.speed,
                    audio_url=audio_url
                )
                
                # Return the separate BytesIO object for response
                return StreamingResponse(
                    audio_for_response,
                    media_type="audio/mpeg",
                    headers={"Content-Disposition": f"inline; filename=podcast_{voice_label}.mp3"}
                )
            except Exception as e:
                print(f"Failed to cache audio: {e}, returning generated audio anyway")
                # If caching fails, regenerate and return without caching
                audio_stream = generate_audio(actual_text, voice=req.voice, speed=req.speed)
        
        # Return streaming audio (no caching)
        voice_label = "male_host" if req.voice == "host" else "female_guest"
        filename = f"podcast_{voice_label}.mp3"
        
        return StreamingResponse(
            audio_stream,
            media_type="audio/mpeg",
            headers={"Content-Disposition": f"inline; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio generation failed: {str(e)}")


@app.post("/audio/normal")
async def audio_normal(req: TTSRequest):
    req.speed = 1.0
    return await generate_audio_endpoint(req)


@app.post("/audio/fast")
async def audio_fast(req: TTSRequest):
    req.speed = 1.25
    return await generate_audio_endpoint(req)


@app.post("/audio/slow")
async def audio_slow(req: TTSRequest):
    req.speed = 0.8
    return await generate_audio_endpoint(req)


# ----- CHATS -----
@app.get("/chats")
async def get_user_chats_endpoint(current_user: User = Depends(get_current_user), 
                                  db: Session = Depends(get_db)):
    """Get all chats for the current user"""
    chats = crud.get_user_chats(db, current_user.id)
    return {"chats": [
        {
            "id": chat.id,
            "title": chat.title,
            "file_id": chat.file_id,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "message_count": len(chat.messages)
        }
        for chat in chats
    ]}


@app.get("/chats/{chat_id}")
async def get_chat_endpoint(chat_id: int, current_user: User = Depends(get_current_user),
                            db: Session = Depends(get_db)):
    """Get specific chat with all messages"""
    chat = crud.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Verify ownership
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this chat")
    
    # Manually serialize to avoid circular reference
    messages = crud.get_chat_messages(db, chat_id)
    return {
        "id": chat.id,
        "title": chat.title,
        "file_id": chat.file_id,
        "created_at": chat.created_at.isoformat(),
        "updated_at": chat.updated_at.isoformat(),
        "messages": [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "file_name": msg.file_name,
                "file_size": msg.file_size,
                "metadata": msg.message_metadata,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }


@app.post("/chats")
async def create_chat_endpoint(req: dict = None,
                               current_user: User = Depends(get_current_user),
                               db: Session = Depends(get_db)):
    """Create a new chat"""
    if req is None:
        req = {}
    
    title = req.get("title", "New Chat")
    file_id = req.get("file_id")
    
    chat = crud.create_chat(db, user_id=current_user.id, title=title, file_id=file_id)
    return {
        "chat": {
            "id": chat.id,
            "title": chat.title,
            "file_id": chat.file_id,
            "created_at": chat.created_at.isoformat()
        }
    }


@app.post("/chats/{chat_id}/messages")
async def add_message_endpoint(chat_id: int, req: dict, 
                               current_user: User = Depends(get_current_user),
                               db: Session = Depends(get_db)):
    """Add a message to a chat"""
    # Verify chat exists and user owns it
    chat = crud.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    message = crud.create_message(
        db=db,
        chat_id=chat_id,
        role=req.get("role", "user"),
        content=req.get("content"),
        file_name=req.get("file_name"),
        file_size=req.get("file_size"),
        message_metadata=req.get("metadata")
    )
    
    return {
        "id": message.id,
        "chat_id": message.chat_id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at.isoformat()
    }


@app.delete("/chats/{chat_id}")
async def delete_chat_endpoint(chat_id: int, current_user: User = Depends(get_current_user),
                               db: Session = Depends(get_db)):
    """Delete a chat"""
    chat = crud.get_chat(db, chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    crud.delete_chat(db, chat_id)
    return {"message": "Chat deleted successfully"}


# ---------- START SERVER ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
