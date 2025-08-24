import sys, os, io
sys.path.append(os.path.dirname(__file__))

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from utils.extracts import extract_text
from utils.gemini import generate_podcast_script, generate_quiz

# ✅ Initialize OpenAI client
client = OpenAI()

app = FastAPI(title="NotebookLM Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ In production set to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.post("/podcast")
async def podcast_from_text(text: str = Form(...)):
    """Generate podcast script from text using Gemini."""
    script = generate_podcast_script(text)
    return JSONResponse({"podcast_script": script})

@app.post("/quiz")
async def quiz_from_text(text: str = Form(...)):
    """Generate quiz questions from text."""
    quiz = generate_quiz(text)
    return JSONResponse({"quiz": quiz})


# 🎙️ AUDIO ROUTES
def generate_audio_stream(text: str, speed: float):
    """Helper to generate audio with speed adjustment."""
    response = client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",  # options: alloy, verse, sage, shimmer
        input=text,
    )
    audio_bytes = response.read()

    # Speed hack: playbackRate is handled in frontend, 
    # here we just return normal audio
    return io.BytesIO(audio_bytes)


@app.post("/audio/normal")
async def audio_normal(text: str = Form(...)):
    """Normal speed"""
    return StreamingResponse(
        generate_audio_stream(text, speed=1.0),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=podcast_normal.mp3"}
    )


@app.post("/audio/fast")
async def audio_fast(text: str = Form(...)):
    """Faster version"""
    return StreamingResponse(
        generate_audio_stream(text, speed=1.25),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=podcast_fast.mp3"}
    )


@app.post("/audio/slow")
async def audio_slow(text: str = Form(...)):
    """Slower version"""
    return StreamingResponse(
        generate_audio_stream(text, speed=0.8),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=podcast_slow.mp3"}
    )


@app.get("/")
def root():
    return {"message": "NotebookLM Backend running ✅"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
