import fitz  # PyMuPDF
import os
import json
import re

def extract_text_from_pdf(pdf_path: str) -> str:
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    text = ""
    with fitz.open(pdf_path) as doc:
        for page in doc:
            text += page.get_text()

    return text.strip()

def find_missing_disclosures(extracted_text: str, regulations: list) -> list:
    missing = []
    for item in regulations:
        title = item.get("requirement_title", "")
        description = item.get("description", "")

        if title.lower() not in extracted_text.lower() and description.lower() not in extracted_text.lower():
            missing.append(item)

    return missing
