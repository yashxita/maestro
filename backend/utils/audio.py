from gtts import gTTS
from pydub import AudioSegment
import io

def text_to_speech_duo(script: str) -> bytes:
    """
    Convert podcast script into MP3 with two different voices.
    Host = English (US), Guest = English (UK)
    """
    podcast = AudioSegment.silent(duration=500)

    for line in script.splitlines():
        if not line.strip():
            continue

        if line.startswith("Host:"):
            text = line.replace("Host:", "").strip()
            tts = gTTS(text=text, lang="en", tld="com")  # US accent
        elif line.startswith("Guest:"):
            text = line.replace("Guest:", "").strip()
            tts = gTTS(text=text, lang="en", tld="co.uk")  # UK accent
        else:
            continue

        buf = io.BytesIO()
        tts.write_to_fp(buf)
        buf.seek(0)
        audio = AudioSegment.from_file(buf, format="mp3")
        podcast += audio + AudioSegment.silent(duration=300)

    out_buf = io.BytesIO()
    podcast.export(out_buf, format="mp3")
    return out_buf.getvalue()
