from sqlalchemy.orm import Session
from models import User, UploadedFile, Podcast, Quiz, QuizQuestion, UserSession, Chat, Message
from typing import List, Optional
import json
import hashlib
import bcrypt

# ========== USER OPERATIONS ==========

def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt directly with SHA256 pre-hashing to handle any password length"""
    # Pre-hash with SHA256 to handle passwords longer than 72 bytes
    sha256_hash = hashlib.sha256(password.encode('utf-8')).hexdigest()
    # Use bcrypt directly
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(sha256_hash.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Pre-hash with SHA256 (same as during hashing)
    sha256_hash = hashlib.sha256(plain_password.encode('utf-8')).hexdigest()
    # Verify with bcrypt directly
    return bcrypt.checkpw(sha256_hash.encode('utf-8'), hashed_password.encode('utf-8'))

def create_user(db: Session, email: str, password: str, name: Optional[str] = None):
    """Create a new user"""
    hashed_password = get_password_hash(password)
    db_user = User(
        email=email,
        name=name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_user_by_email(db: Session, email: str):
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    """Get user by ID"""
    return db.query(User).filter(User.id == user_id).first()


def authenticate_user(db: Session, email: str, password: str):
    """Authenticate user with email and password"""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def update_last_login(db: Session, user_id: int):
    """Update user's last login timestamp"""
    from sqlalchemy.sql import func
    user = get_user_by_id(db, user_id)
    if user:
        user.last_login = func.now()
        db.commit()
        db.refresh(user)
    return user


# ========== UPLOADED FILES ==========

def create_uploaded_file(db: Session, filename: str, file_type: str, file_size: int, 
                         extracted_text: str, s3_key: Optional[str] = None, user_id: Optional[int] = None):
    """Create a new uploaded file record"""
    text_preview = extracted_text[:1000] if extracted_text else ""
    
    db_file = UploadedFile(
        filename=filename,
        file_type=file_type,
        file_size=file_size,
        s3_key=s3_key,
        extracted_text=extracted_text,
        text_preview=text_preview,
        user_id=user_id
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def get_uploaded_file(db: Session, file_id: int):
    """Get uploaded file by ID"""
    return db.query(UploadedFile).filter(UploadedFile.id == file_id).first()


def get_all_uploaded_files(db: Session, skip: int = 0, limit: int = 100):
    """Get all uploaded files with pagination"""
    return db.query(UploadedFile).offset(skip).limit(limit).all()


def delete_uploaded_file(db: Session, file_id: int):
    """Delete uploaded file and all related data"""
    db_file = db.query(UploadedFile).filter(UploadedFile.id == file_id).first()
    if db_file:
        db.delete(db_file)
        db.commit()
        return True
    return False


def get_file_by_hash(db: Session, file_hash: str):
    """Get uploaded file by content hash"""
    return db.query(UploadedFile).filter(UploadedFile.s3_key.contains(file_hash)).first()


def get_file_by_s3_key(db: Session, s3_key: str):
    """Get uploaded file by S3 key"""
    return db.query(UploadedFile).filter(UploadedFile.s3_key == s3_key).first()


# ========== PODCASTS ==========

def create_podcast(db: Session, file_id: int, script: str, voice_type: str = "host", 
                   speed: float = 1.0, audio_url: Optional[str] = None):
    """Create a new podcast record"""
    db_podcast = Podcast(
        file_id=file_id,
        script=script,
        voice_type=voice_type,
        speed=speed,
        audio_url=audio_url
    )
    db.add(db_podcast)
    db.commit()
    db.refresh(db_podcast)
    return db_podcast


def get_existing_podcast_with_audio(db: Session, file_id: int, voice_type: str = "host", speed: float = 1.0):
    """Get existing podcast for a file with matching voice and speed that has audio URL"""
    return db.query(Podcast).filter(
        Podcast.file_id == file_id,
        Podcast.voice_type == voice_type,
        Podcast.speed == speed,
        Podcast.audio_url.isnot(None)
    ).first()


def get_podcast(db: Session, podcast_id: int):
    """Get podcast by ID"""
    return db.query(Podcast).filter(Podcast.id == podcast_id).first()


def get_podcasts_by_file(db: Session, file_id: int):
    """Get all podcasts for a specific file"""
    return db.query(Podcast).filter(Podcast.file_id == file_id).all()


def update_podcast_audio_url(db: Session, podcast_id: int, audio_url: str):
    """Update podcast with S3 audio URL"""
    podcast = get_podcast(db, podcast_id)
    if podcast:
        podcast.audio_url = audio_url
        db.commit()
        db.refresh(podcast)
    return podcast


# ========== QUIZZES ==========

def create_quiz_with_questions(db: Session, file_id: int, questions_data: List[dict]):
    """Create a quiz with all its questions"""
    # Create quiz
    db_quiz = Quiz(
        file_id=file_id,
        question_count=len(questions_data)
    )
    db.add(db_quiz)
    db.flush()  # Get quiz ID without committing
    
    # Create questions
    for q_data in questions_data:
        db_question = QuizQuestion(
            quiz_id=db_quiz.id,
            question_number=q_data.get("id", 0),
            question_text=q_data["question"],
            options=q_data["options"],
            correct_answer=q_data["correctAnswer"],
            explanation=q_data.get("explanation", "")
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_quiz)
    return db_quiz


def get_quiz(db: Session, quiz_id: int):
    """Get quiz by ID with all questions"""
    return db.query(Quiz).filter(Quiz.id == quiz_id).first()


def get_quizzes_by_file(db: Session, file_id: int):
    """Get all quizzes for a specific file"""
    return db.query(Quiz).filter(Quiz.file_id == file_id).all()


def get_quiz_questions(db: Session, quiz_id: int):
    """Get all questions for a quiz"""
    return db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()


# ========== USER SESSIONS ==========

def create_user_session(db: Session, session_id: str, ip_address: str, user_agent: str):
    """Create a new user session"""
    db_session = UserSession(
        session_id=session_id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def get_user_session(db: Session, session_id: str):
    """Get user session by session ID"""
    return db.query(UserSession).filter(UserSession.session_id == session_id).first()


# ========== CHATS ==========

def create_chat(db: Session, user_id: int, title: Optional[str] = None, file_id: Optional[int] = None):
    """Create a new chat session"""
    db_chat = Chat(
        user_id=user_id,
        title=title or "New Chat",
        file_id=file_id
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)
    return db_chat


def get_chat(db: Session, chat_id: int):
    """Get chat by ID with messages"""
    return db.query(Chat).filter(Chat.id == chat_id).first()


def get_user_chats(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """Get all chats for a user"""
    return db.query(Chat).filter(Chat.user_id == user_id).order_by(Chat.updated_at.desc()).offset(skip).limit(limit).all()


def update_chat_title(db: Session, chat_id: int, title: str):
    """Update chat title"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if chat:
        chat.title = title
        db.commit()
        db.refresh(chat)
    return chat


def delete_chat(db: Session, chat_id: int):
    """Delete a chat and all its messages"""
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if chat:
        db.delete(chat)
        db.commit()
        return True
    return False


# ========== MESSAGES ==========

def create_message(db: Session, chat_id: int, role: str, content: Optional[str] = None, 
                   file_name: Optional[str] = None, file_size: Optional[int] = None,
                   message_metadata: Optional[dict] = None):
    """Create a new message in a chat"""
    db_message = Message(
        chat_id=chat_id,
        role=role,
        content=content,
        file_name=file_name,
        file_size=file_size,
        message_metadata=message_metadata
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    chat = db.query(Chat).filter(Chat.id == chat_id).first()
    if chat and chat.title == "New Chat":
        messages = db.query(Message).filter(Message.chat_id == chat_id).all()
        if len(messages) <= 2 and role == "user" and content:
            # Generate title from first user message
            title = generate_chat_title(content, file_name)
            chat.title = title
            db.commit()
    
    return db_message


def get_chat_messages(db: Session, chat_id: int):
    """Get all messages for a chat"""
    return db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at).all()


def generate_chat_title(content: str, file_name: Optional[str] = None) -> str:
    """Generate a meaningful chat title from content"""
    if file_name:
        # If there's a file, use the filename as base
        base_name = file_name.rsplit('.', 1)[0]
        return f"Chat about {base_name}"[:50]
    
    if content:
        # Use first 50 characters of content
        title = content.strip()[:50]
        if len(content) > 50:
            title += "..."
        return title
    
    return "New Chat"
