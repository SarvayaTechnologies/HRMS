import os
from google import genai
import json


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

async def analyze_resume_with_ai(raw_text):
    prompt = f"""
    You are an expert HR AI. Analyze the following resume text and return a VALID JSON object.
    
    Extract:
    1. Candidate Name
    2. Primary Skills (list)
    3. Experience Level (Junior, Mid, Senior, Lead)
    4. A 'Skill Graph' mapping skills to proficiency (1-10)
    5. Summary (2 sentences max)

    Resume Text:
    {raw_text}
    
    Return ONLY the JSON object:
    """
    
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt
    )

    text_response = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(text_response)

async def get_ai_response(prompt: str):
    response = client.models.generate_content(
        model='gemini-1.5-flash',
        contents=prompt
    )
    return response.text