import numpy as np
import soundfile as sf
import io

def analyze_rms(contents):
    audio, sr = sf.read(io.BytesIO(contents))
    rms = np.sqrt(np.mean(audio**2))
    return round(float(rms), 4)
