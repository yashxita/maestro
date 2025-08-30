import os
from typing import Iterator
import requests
import re

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY must be set")

def generate_audio_gemini(text: str, voice: str = "host", speed: float = 1.0) -> Iterator[bytes]:
    """
    Generate audio line by line.
    If line starts with 'Host:' → Host voice
    If line starts with 'Guest:' → Guest voice
    Keeps exact order of the script.
    """
    try:
        # Split into dialogue segments (preserve order)
        segments = split_dialogue_line_by_line(text)

        if not segments:
            raise RuntimeError("No dialogue segments found")

        audio_segments = []
        for seg in segments:
            audio_data = generate_single_voice_audio_fast(seg, speed)
            if audio_data:
                audio_segments.append(audio_data)
                print(f"[DEBUG] Added {seg['voice']} segment ({len(audio_data)} bytes)")

        if not audio_segments:
            raise RuntimeError("No audio generated")

        combined_audio = b"".join(audio_segments)
        print(f"[DEBUG] Final combined audio: {len(combined_audio)} bytes, {len(audio_segments)} segments")

        return iter([combined_audio])

    except Exception as e:
        raise RuntimeError(f"Audio generation failed: {str(e)}")

def split_dialogue_line_by_line(text: str) -> list:
    """Split strictly line by line with Host/Guest detection"""
    segments = []

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        if line.lower().startswith("host:"):
            content = line[len("host:"):].strip()
            if content:
                segments.append({"speaker": "host", "text": content, "voice": "host"})
        elif line.lower().startswith("guest:"):
            content = line[len("guest:"):].strip()
            if content:
                segments.append({"speaker": "guest", "text": content, "voice": "guest"})
        else:
            # Default to host if no speaker label
            segments.append({"speaker": "host", "text": line, "voice": "host"})

    print(f"[DEBUG] Parsed {len(segments)} line-by-line segments")
    return segments

def generate_single_voice_audio_fast(segment: dict, speed: float) -> bytes:
    """Generate audio for one segment (Host=Brian, Guest=Amy)"""
    try:
        text = segment["text"]
        voice_type = segment["voice"]

        print(f"[DEBUG] Generating {voice_type} voice for: {text[:60]}...")

        if voice_type == "host":
            voice_name = "Brian"  # Male
        else:
            voice_name = "Amy"    # Female

        # --- Primary API: StreamElements ---
        url = "https://api.streamelements.com/kappa/v2/speech"
        params = {"voice": voice_name, "text": text}
        response = requests.get(url, params=params, timeout=15)

        if response.status_code == 200 and len(response.content) > 100:
            return response.content

        # --- Fallback: ResponsiveVoice ---
        fallback_url = "https://responsivevoice.org/responsivevoice/getvoice.php"
        voice_mapping = {"Brian": "UK English Male", "Amy": "US English Female"}
        fallback_params = {
            "t": text,
            "tl": "en",
            "sv": voice_mapping[voice_name],
            "pitch": 0.5,
            "rate": speed,
            "vol": 1,
        }

        fallback_response = requests.get(fallback_url, params=fallback_params, timeout=15)

        if fallback_response.status_code == 200 and len(fallback_response.content) > 100:
            return fallback_response.content

        print(f"[DEBUG] Failed to generate {voice_name} audio")
        return b""

    except Exception as e:
        print(f"[DEBUG] Error in segment {segment.get('voice')}: {str(e)}")
        return b""
