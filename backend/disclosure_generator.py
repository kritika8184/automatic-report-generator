import json
import os
import traceback
import re
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq  # Or your chosen LLM client
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

# === Set up LLM ===
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
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
- importance_summary: 2-3 sentence explanation of its significance
- generated_disclosure:
  - section_title: concise heading
  - narrative: 3-5 sentence explanation or template
  - suggested_metrics: 3-5 metrics
  - visualization_hint: (e.g., "table", "bar chart", "list")

Return only valid JSON. Do not wrap in triple backticks.
""")

# === Main LLM Logic ===
def generate_disclosures_from_requirements(missing_data: list) -> list:
    generated_disclosures = []

    for i, item in tqdm(enumerate(missing_data), total=len(missing_data)):
        try:
            prompt = prompt_template.format(
                requirement_title=item.get("requirement_title", ""),
                category=item.get("category", ""),
                description=item.get("description", "")
            )

            result = llm.invoke(prompt)

            print(f"\n[Item {i}] Raw Output:\n{result.content.strip()}\n", flush=True)

            if not result.content.strip():
                raise ValueError("❌ Empty response from LLM.")

            # === 🔧 Extract the JSON portion between ``` blocks if it exists
            # match = re.search(r"```(?:json)?(.*?)```", result.content.strip(), re.DOTALL)
            # if match:
            #     json_str = match.group(1).strip()
            # else:
            #     json_str = result.content.strip()

            # # === ✂️ Clean up common JSON-breaking symbols
            # json_str = json_str.replace("|", "")  # remove markdown pipes
            # json_str = re.sub(r"\n+", "\n", json_str)  # collapse excess newlines

            # parsed = json.loads(json_str)

            # Attempt to extract JSON block
            content = result.content.strip()

            # Remove any leading non-JSON text like "Here is the JSON response:"
            json_start = content.find("{")
            content = content[json_start:] if json_start != -1 else content

            # Try to close brackets if missing (very basic fallback)
            # if content.count("{") > content.count("}"):
            #     content += "}" * (content.count("{") - content.count("}"))

            # Try parsing
            try:
                # parsed = json.loads(content)
                parsed= safe_json_parse(content, i)
                if parsed is None:
                    continue
            except json.JSONDecodeError as e:
                raise ValueError(f"Malformed JSON: {e.msg}\nRaw content:\n{content}")

            if parsed is not None: 
                generated_disclosures.append({
                    "requirement_title": item.get("requirement_title"),
                    "generated": parsed
                })
            else:
                generated_disclosure.append({
                    "requirement_title": item.get("requirement_title"),
                    "error": "Failed to parse JSON",
                    "raw_output": content
                })

        except Exception as e:
            print(f"[❌ Error on item {i}] {e}", flush=True)
            traceback.print_exc()
            generated_disclosures.append({
                "requirement_title": item.get("requirement_title"),
                "error": str(e),
                "raw_output": result.content if 'result' in locals() else "N/A"
            })

    return generated_disclosures

def safe_json_parse(json_str: str, item_idx: int) -> dict:
    try:
        # Remove helper phrases like “Here is the JSON response:”
        json_str = re.sub(r"(?i)^here is.*?({)", r"\1", json_str.strip(), flags=re.DOTALL)

        # Attempt to parse directly
        return json.loads(json_str)

    except json.JSONDecodeError as e:
        print(f"[❌ JSON Parse Error on item {item_idx}] {e}")
        print("Raw Output:\n", json_str)

        # Optional: try to fix common trailing comma issues
        json_str = re.sub(r",\s*}", "}", json_str)
        json_str = re.sub(r",\s*]", "]", json_str)

        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e2:
            print(f"[❌ Retry Failed on item {item_idx}] {e2}")
            return None
