import json
import os
import traceback
import re
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq  # Or your chosen LLM client
from tqdm import tqdm

# === Load missing A2 items that Axis Bank is missing ===
with open("json/a2_axis_missing.json", "r", encoding="utf-8") as f:
    missing_data = json.load(f)

# === Set up LLM ===
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),  # Or paste your key directly here for local testing
    model_name="llama3-8b-8192"
)

# === Prompt Template ===
prompt_template = PromptTemplate.from_template("""
You're a Basel III expert.

Given the following new regulatory disclosure requirement, explain **why this is important** for banks and stakeholders.

### REQUIREMENT
Title: {requirement_title}
Category: {category}
Description: {description}

### FORMAT:
Respond using a valid raw JSON structure with the following keys:
- requirement_title
- category
- is_present_in_axis: false
- importance_summary: 2-3 sentence explanation of its significance
- generated_disclosure:
  - section_title: concise heading
  - narrative: 3-5 sentence explanation or template
  - suggested_metrics: 3-5 metrics
  - visualization_hint: (e.g., "table", "bar chart", "list")

Return only valid JSON. Do not wrap in triple backticks.
""")

# === Generate Disclosures ===
generated_disclosures = []

for i, item in tqdm(enumerate(missing_data), total=len(missing_data)):
    try:
        prompt = prompt_template.format(
            requirement_title=item.get("requirement_title", ""),
            category=item.get("category", ""),
            description=item.get("description", "")
        )

        result = llm.invoke(prompt)

        print(f"\n[Item {i}] Raw Output:\n{result.content.strip()}\n")

        if not result.content.strip():
            raise ValueError("❌ Empty response from LLM.")

        # === 🔧 Extract the JSON portion between ``` blocks if it exists
        match = re.search(r"```(?:json)?(.*?)```", result.content.strip(), re.DOTALL)
        if match:
            json_str = match.group(1).strip()
        else:
            # Fallback: Use the whole content (if no ``` found)
            json_str = result.content.strip()

        # === ✂️ Clean up common JSON-breaking symbols
        json_str = json_str.replace("|", "")  # remove markdown pipes
        json_str = re.sub(r"\n+", "\n", json_str)  # collapse excess newlines

        parsed = json.loads(json_str)

        generated_disclosures.append({
            "requirement_title": item.get("requirement_title"),
            "generated": parsed
        })

    except Exception as e:
        print(f"[❌ Error on item {i}] {e}")
        traceback.print_exc()
        generated_disclosures.append({
            "requirement_title": item.get("requirement_title"),
            "error": str(e),
            "raw_output": result.content if 'result' in locals() else "N/A"
        })

# === Save Output ===
output_path = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(output_path, exist_ok=True)

with open(os.path.join(output_path, "generated_axis_disclosures.json"), "w", encoding="utf-8") as f:
    json.dump(generated_disclosures, f, indent=2)

print("✅ Saved all generated disclosures to output/generated_axis_disclosures.json")
