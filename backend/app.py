import sys, os, io, base64
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv()
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

from utils.extracts import extract_text
from utils.gemini import generate_podcast_script, generate_quiz, generate_chat_response
from audio import generate_audio_gemini as generate_audio   # ✅ now using Gemini TTS

# ✅ Load Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("⚠️ GEMINI_API_KEY not found in environment. Please set it in your .env")

app = FastAPI(title="NotebookLM Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- MODELS ----------
class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = "host"  # Only "host" or "guest"
    speed: Optional[float] = 1.0

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


# ---------- ROUTES ----------

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a PDF or PPTX, extract text, and return preview."""
    try:
        contents = await file.read()
        tmp_path = f"/tmp/{file.filename}"
        with open(tmp_path, "wb") as f:
            f.write(contents)

        text = extract_text(tmp_path)
        if not text:
            raise HTTPException(status_code=400, detail="No text extracted")

        return JSONResponse({"text_preview": text[:1000], "full_text": text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----- PODCAST -----
@app.post("/podcast")
async def podcast_from_text(req: TTSRequest):
    """Generate podcast script from text using Gemini."""
    script = generate_podcast_script(req.text)
    return JSONResponse({"podcast_script": script})


# ----- QUIZ -----
@app.post("/generate-quiz")
async def generate_quiz_endpoint(req: dict):
    """Generate structured quiz questions from text."""
    try:
        text = req.get("text")
        count = int(req.get("count", 5))  # default to 5
        quiz_questions = generate_quiz(text, count)
        return JSONResponse({"success": True, "quiz": quiz_questions})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


@app.post("/quiz")
async def quiz_from_text(req: TTSRequest):
    """Generate quiz questions from text."""
    quiz = generate_quiz(req.text)
    return JSONResponse({"quiz": quiz})

# ----- AUDIO -----
@app.post("/audio/generate")
async def generate_audio_endpoint(req: TTSRequest):
    """Generate audio with host (male) or guest (female) voice"""
    try:
        # Validate voice selection
        if req.voice not in ["host", "guest"]:
            req.voice = "host"  # Default to host
            
        audio_stream = generate_audio(req.text, voice=req.voice, speed=req.speed)
        
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

# ----- CHAT -----
@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    """Handle conversational chat messages using Gemini."""
    try:
        response = generate_chat_response(req.message, req.context)
        return JSONResponse({"success": True, "response": response})
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)


# ---------- START SERVER ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",          # file_name:app_instance
        host="0.0.0.0",
        port=8000,
        reload=True
    )
