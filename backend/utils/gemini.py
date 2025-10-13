import google.generativeai as genai
import os
import json
from typing import Optional

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


def generate_podcast_script(text: str) -> str:
    """Generate a podcast script from extracted text using Gemini."""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
Convert the following text into an engaging podcast script.  
Make it conversational, informative, and suitable for audio narration.  
Add natural transitions, explanations for complex concepts, and maintain an engaging tone throughout.  

Important:  
- Only include dialogue lines (e.g., Host:, Guest:).  
- Do NOT include any stage directions like [intro music], [sound effect], or narration outside dialogue.  

Text to convert:
{text}

Please format as a natural podcast script with:  
- Engaging introduction by the Host  
- Clear explanations of key concepts  
- Smooth transitions between topics  
- Conversational tone (like a dialogue between Host and Guest)  
- Compelling conclusion with a closing remark
"""

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"Error generating podcast script: {e}")
        return f"Welcome to today's podcast. Let me share some insights from the document: {text[:500]}..."


def generate_quiz(text: str, count: int = 5) -> list:
    """Generate structured quiz questions from text using Gemini."""
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
Create exactly {count} multiple-choice quiz questions based on the following text.  
Return ONLY a valid JSON array with this exact structure:
[
  {{
    "id": 1,
    "question": "What is the main topic discussed?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why this is correct"
  }}
]

Rules:
- correctAnswer should be the index (0-3) of the correct option  
- Each question should test understanding of key concepts  
- Options should be plausible but only one correct  
- Keep questions clear and concise  

Text:
{text[:3000]}
"""

        response = model.generate_content(prompt)
        quiz_text = response.text.strip()

        # Clean JSON output
        if quiz_text.startswith("\`\`\`"):
            quiz_text = quiz_text.strip("`")
            if "json" in quiz_text:
                quiz_text = quiz_text.replace("json", "", 1).strip()

        if "[" in quiz_text and "]" in quiz_text:
            quiz_text = quiz_text[quiz_text.find("["): quiz_text.rfind("]") + 1]

        quiz_data = json.loads(quiz_text)

        if isinstance(quiz_data, list) and len(quiz_data) == count:
            return quiz_data

        raise ValueError("Invalid quiz format")

    except Exception as e:
        print(f"Error generating quiz: {e}")
        return [{
            "id": 1,
            "question": "What type of content was analyzed?",
            "options": ["Document", "Video", "Audio", "Image"],
            "correctAnswer": 0,
            "explanation": "The system analyzed document content to generate this quiz.",
        }]


def generate_chat_response(message: str, context: Optional[str] = None) -> str:
    """Generate a conversational response using Gemini."""
    try:
        model = genai.GenerativeModel("gemini-2.0-flash-exp")

        system_prompt = """You are a helpful AI assistant for a PDF quiz and podcast generation app.

Your role:
- Guide users through uploading PDFs
- Explain how to create quizzes and podcasts from their documents
- Answer questions about the app's features
- Be friendly, concise, and helpful

Key features to mention when relevant:
- Users can upload PDF or PPTX files
- Generate interactive quizzes with multiple-choice questions
- Create engaging podcast scripts with host and guest dialogue
- Convert podcast scripts to audio with different voices

Keep responses brief (2-3 sentences) unless the user asks for detailed explanations."""

        if context:
            prompt = f"{system_prompt}\n\nContext: {context}\n\nUser: {message}\n\nAssistant:"
        else:
            prompt = f"{system_prompt}\n\nUser: {message}\n\nAssistant:"

        response = model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        print(f"Error generating chat response: {e}")
        return "I'm here to help you create quizzes and podcasts from your documents. You can upload a PDF or PPTX file to get started!"
