import numpy as np
import io
import soundfile as sf

def analyze_rms(file_bytes: bytes) -> float:
    f = io.BytesIO(file_bytes)
    data, sr = sf.read(f)
    if data.ndim > 1:
        data = np.mean(data, axis=1)
    rms = np.sqrt(np.mean(np.square(data)))
    score = float(rms) * 1000
    return score
