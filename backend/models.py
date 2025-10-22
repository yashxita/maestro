from sqlalchemy import Column, Integer, String, Text, DateTime, Float, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    """Store user account information"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))
    
    # Relationships
    files = relationship("UploadedFile", back_populates="user", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class Chat(Base):
    """Store chat sessions"""
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500))  # Auto-generated from first message
    file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chats")
    file = relationship("UploadedFile")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Chat(id={self.id}, user_id={self.user_id}, title='{self.title}')>"


class Message(Base):
    """Store individual chat messages"""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # 'user', 'bot', 'file', 'system'
    content = Column(Text)
    file_name = Column(String(500))  # For file messages
    file_size = Column(Integer)  # For file messages
    message_metadata = Column(JSON)  # For storing additional data (quiz, podcast, etc.)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, chat_id={self.chat_id}, role='{self.role}')>"


class UploadedFile(Base):
    """Store information about uploaded PDF/PPTX files"""
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf or pptx
    file_size = Column(Integer)  # in bytes
    s3_key = Column(String(500))  # S3 object key if using S3
    extracted_text = Column(Text)
    text_preview = Column(Text)  # First 1000 chars
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="files")
    podcasts = relationship("Podcast", back_populates="file", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="file", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UploadedFile(id={self.id}, filename='{self.filename}')>"


class Podcast(Base):
    """Store generated podcast scripts"""
    __tablename__ = "podcasts"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="CASCADE"))
    script = Column(Text, nullable=False)
    audio_url = Column(String(500))  # S3 URL if audio is stored
    voice_type = Column(String(20))  # host or guest
    speed = Column(Float, default=1.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    file = relationship("UploadedFile", back_populates="podcasts")

    def __repr__(self):
        return f"<Podcast(id={self.id}, file_id={self.file_id})>"


class Quiz(Base):
    """Store generated quizzes"""
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    file_id = Column(Integer, ForeignKey("uploaded_files.id", ondelete="CASCADE"))
    question_count = Column(Integer, default=5)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    file = relationship("UploadedFile", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Quiz(id={self.id}, file_id={self.file_id})>"


class QuizQuestion(Base):
    """Store individual quiz questions"""
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    question_number = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # Array of 4 options
    correct_answer = Column(Integer, nullable=False)  # Index 0-3
    explanation = Column(Text)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")

    def __repr__(self):
        return f"<QuizQuestion(id={self.id}, quiz_id={self.quiz_id})>"


class UserSession(Base):
    """Track user sessions and activity"""
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, index=True)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_activity = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<UserSession(id={self.id}, session_id='{self.session_id}')>"
