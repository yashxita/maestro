import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

# ✅ Use direct key for now (since you're on free tier & testing locally)
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ⚡ Use flash to avoid quota exhaustion
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_podcast_script(text: str) -> str:
    prompt = f"""
    Convert the following content into a conversational podcast script between two speakers:
    
    - Speaker 1 is the Host - Named John
    - Speaker 2 is the Guest - Named Alice
    - Introduce them in the beginning only that John is the host and Alice is the guest
    - Keep it conversational and engaging
    - No background sounds, music, or stage directions
    - Only plain dialogue in this format:
      Host: ...
      Guest: ...
    
    Content:
    {text[:20000]}
    """
    resp = model.generate_content(prompt)
    return resp.text if hasattr(resp, "text") else str(resp)


def generate_quiz(text: str) -> list:
    prompt = f"""
    Generate 5 quiz questions (mix of MCQ and fill-in-the-blank) from the following text:
    {text[:15000]}
    """
    resp = model.generate_content(prompt)
    output = resp.text if hasattr(resp, "text") else str(resp)
    return [q for q in output.split("\n") if q.strip()]
