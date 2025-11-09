from fastapi import FastAPI, File, UploadFile
from utils import analyze_rms

app = FastAPI()

@app.post('/analyze')
async def analyze(file: UploadFile = File(...)):
    contents = await file.read()
    volume = analyze_rms(contents)
    return { "volume": volume }
