from fastapi import FastAPI, File, UploadFile
from faster_whisper import WhisperModel
from pydub import AudioSegment
import io
import numpy as np

app = FastAPI(title="Baby Bounce Audio API")

# Load Whisper model once (CPU-only)
model = WhisperModel("tiny", device="cpu", compute_type="int8")


def audio_to_samples(audio_bytes: bytes, target_frame_rate: int = 16000) -> np.ndarray:
    """
    Convert uploaded audio bytes to mono numpy float32 samples normalized between -1 and 1
    """
    audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
    audio = audio.set_channels(1).set_frame_rate(target_frame_rate)
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32) / 32768.0
    return samples


def compute_rms(samples: np.ndarray) -> float:
    """
    Compute normalized RMS (volume) from audio samples
    """
    rms = np.sqrt(np.mean(samples ** 2))
    return float(rms)


@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    samples = audio_to_samples(contents)
    volume = compute_rms(samples)
    return {"volume": volume}


@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    contents = await file.read()
    samples = audio_to_samples(contents)

    # Transcribe audio using faster-whisper
    segments, _ = model.transcribe(samples)
    text = " ".join(seg.text.strip() for seg in segments if seg.text.strip())

    return {"text": text}
