from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

# Enable CORS so frontend (React) can fetch from this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8888"],  # Change to your React app URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Basel III Disclosure API is running."}

@app.get("/generated-disclosures")
def get_generated_disclosures():
    file_path = os.path.join(os.path.dirname(__file__), "output", "generated_axis_disclosures.json")
    with open(file_path, encoding="utf-8") as f:
        return json.load(f)

UPLOAD_DIR = "uploaded_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-report")
async def upload_report(report: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, report.filename)
    with open(file_location, "wb") as f:
        f.write(await report.read())
    return {"filename": report.filename, "status": "uploaded"}