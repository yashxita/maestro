"""
Database initialization script
Run this to create all tables in your RDS database
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import engine, Base
from models import UploadedFile, Podcast, Quiz, QuizQuestion, UserSession

def init_database():
    """Create all database tables"""
    print("Creating database tables...")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        print("\nCreated tables:")
        print("  - uploaded_files")
        print("  - podcasts")
        print("  - quizzes")
        print("  - quiz_questions")
        print("  - user_sessions")
        
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    init_database()
