from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from disclosure_generator import generate_disclosures_from_requirements
from pdf_utils import extract_text_from_pdf, find_missing_disclosures
# from dotenv import load_dotenv
import json
import shutil
import os

# load_dotenv()


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
def get_generated_disclosures(filename: str):
    output_path = os.path.join("output", f"{filename}.json")
    if not os.path.exists(output_path):
        return {"status": "error", "message": "File not found"}
    
    with open(output_path, encoding="utf-8") as f:
        return json.load(f)
        
UPLOAD_DIR = "uploaded_reports"
OUTPUT_DIR = "output"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.post("/upload-report")
async def upload_report(report: UploadFile = File(...)):
    try:
        # === Save uploaded file ===
        report_path = os.path.join(UPLOAD_DIR, report.filename)
        with open(report_path, "wb") as f:
            f.write(await report.read())
        print(f"✅ Saved uploaded report: {report.filename}")

        # === Step 1: Extract text from the PDF ===
        report_text = extract_text_from_pdf(report_path)
        print("📄 Extracted text from uploaded report.")

        # === Step 2: Load Basel III regulatory requirements ===
        with open("../json/a2_differences.json", "r", encoding="utf-8") as f:
            requirements = json.load(f)
        print(f"📘 Loaded {len(requirements)} disclosure requirements.")

        # === Step 3: Determine missing disclosures ===
        missing_requirements = find_missing_disclosures(report_text, requirements)
        print(f"❗ Found {len(missing_requirements)} missing disclosures.")

        # === Step 4: Generate readable disclosures via LLM ===
        generated_data = generate_disclosures_from_requirements(missing_requirements)
        print(f"🤖 Generated structured disclosures for UI display.")

        # === Step 5: Save output as JSON for frontend use ===
        print("Report filename type:", type(report.filename))
        print("Report filename value:", report.filename)

        output_path = os.path.join(OUTPUT_DIR, f"{report.filename}.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(generated_data, f, indent=2)
        print(f"💾 Saved output to {output_path}")

        return {"status": "success", "filename": report.filename}

    except Exception as e:
        print(f"❌ Error during processing: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/available-reports")
def list_available_reports():
    files = os.listdir("output")
    report_files = [f.replace(".json", "") for f in files if f.endswith(".json")]
    return {"reports": sorted(report_files)}

@app.post("/check-compliance")
async def check_compliance(report_name: str = Form(...)):
    output_path = os.path.join("output", f"{report_name}.json")
    if not os.path.exists(output_path):
        return {"status": "error", "message": "Report not found."}

    with open(output_path, encoding="utf-8") as f:
        return json.load(f)
