"""
Migration script to add user_id column to uploaded_files table
Run this once to update your existing database schema
"""
import os
import sys
from sqlalchemy import text

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database import engine

def migrate():
    """Add user_id column to uploaded_files table"""
    with engine.connect() as conn:
        try:
            # Check if column already exists
            result = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='uploaded_files' AND column_name='user_id'
            """))
            
            if result.fetchone():
                print("✅ user_id column already exists in uploaded_files table")
                return
            
            # Add user_id column
            conn.execute(text("""
                ALTER TABLE uploaded_files 
                ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
            """))
            conn.commit()
            
            print("✅ Successfully added user_id column to uploaded_files table")
            
        except Exception as e:
            print(f"❌ Migration failed: {str(e)}")
            conn.rollback()
            raise

if __name__ == "__main__":
    print("Running migration to add user_id to uploaded_files...")
    migrate()
    print("Migration complete!")
