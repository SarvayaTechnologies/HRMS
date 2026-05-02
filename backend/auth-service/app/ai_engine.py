import os
import asyncio
from google import genai
from google.genai import errors as genai_errors
import json


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Model chain: primary → fallbacks (tried in order)
MODELS = [
    "models/gemini-3.1-flash-lite",
    "models/gemini-2.5-flash",
    "models/gemini-2.0-flash",
    "models/gemini-1.5-flash",
]
MAX_RETRIES = 2
BASE_DELAY = 2  # seconds


def _call_gemini(contents: str, model: str = None):
    """
    Call the Gemini API with automatic retry + exponential backoff,
    then fall through to backup models if the primary is overloaded.
    """
    models_to_try = [model] if model else MODELS

    last_exc = None
    for current_model in models_to_try:
        for attempt in range(MAX_RETRIES):
            try:
                response = client.models.generate_content(
                    model=current_model,
                    contents=contents,
                )
                return response
            except genai_errors.ServerError as exc:
                last_exc = exc
                wait = BASE_DELAY * (2 ** attempt)
                print(
                    f"[ai_engine] {current_model} ServerError (attempt {attempt + 1}/{MAX_RETRIES}): "
                    f"{exc}  — retrying in {wait}s"
                )
                import time; time.sleep(wait)
            except genai_errors.APIError as exc:
                # Non-retryable (400/401/404) — but model might not exist, try next
                if exc.code == 404:
                    print(f"[ai_engine] Model {current_model} not found, trying next...")
                    break
                raise exc
        print(f"[ai_engine] Model {current_model} exhausted retries, trying next fallback...")

    # All models + retries exhausted
    raise last_exc  # type: ignore[misc]


async def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/webm"):
    """
    Transcribe audio using Gemini's multimodal capabilities.
    Works with audio from MediaRecorder (webm/opus, ogg, wav, mp4).
    """
    import base64
    
    prompt = "Transcribe this audio accurately. Return ONLY the spoken text, nothing else. If you cannot hear any speech, return an empty string."
    
    try:
        b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
        
        response = client.models.generate_content(
            model=MODELS[0],  # Use primary model
            contents=[
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": b64_audio
                            }
                        }
                    ]
                }
            ]
        )
        return response.text.strip()
    except Exception as e:
        print(f"[ai_engine] transcribe_audio failed: {e}")
        # Try with fallback model
        try:
            b64_audio = base64.b64encode(audio_bytes).decode("utf-8")
            response = client.models.generate_content(
                model=MODELS[1],
                contents=[
                    {
                        "parts": [
                            {"text": prompt},
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": b64_audio
                                }
                            }
                        ]
                    }
                ]
            )
            return response.text.strip()
        except Exception as e2:
            print(f"[ai_engine] transcribe_audio fallback also failed: {e2}")
            return ""


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
    
    response = _call_gemini(prompt)

    text_response = response.text.replace('```json', '').replace('```', '').strip()
    return json.loads(text_response)

async def get_ai_response(prompt: str):
    response = _call_gemini(prompt)
    return response.text

async def evaluate_internal_candidate(raw_text, job_desc):
    try:
        prompt = f"""
        You are an expert internal recruiter AI. Analyze the following employee resume text against the provided job description.
        Return a VALID JSON object indicating their match.
        
        Job Description:
        {job_desc}

        Resume Text:
        {raw_text}
        
        Extract:
        1. "score": a number from 0 to 100 representing how well the candidate matches the requirements.
        2. "reasoning": 1-2 sentences explaining why they got this score.
        3. "status": either "qualified_for_interview" (if score >= 70) or "rejected_by_parser" (if score < 70).

        Return ONLY the JSON object:
        """
        
        response = _call_gemini(prompt[:32000])

        text_response = response.text.strip()
        print(f"DEBUG: Raw AI response: {text_response}")
        
        # Robust JSON extraction: Find first { and last }
        try:
            start_idx = text_response.find('{')
            end_idx = text_response.rfind('}') + 1
            if start_idx != -1 and end_idx > 0:
                json_str = text_response[start_idx:end_idx]
                data = json.loads(json_str)
                return data
            else:
                raise ValueError("No JSON object found in response")
        except Exception as json_err:
            print(f"DEBUG: JSON Parse failed: {json_err}")
            # Fallback for when AI returns text but not JSON
            return {
                "score": 60, 
                "reasoning": "AI returned text instead of JSON, extracted best guess.",
                "status": "qualified_for_interview" if "qualified" in text_response.lower() else "rejected_by_parser"
            }
    except Exception as e:
        print(f"DEBUG: evaluate_internal_candidate failed: {str(e)}")
        # If it's a real model failure (e.g. 500 from Google), re-raise to main.py
        raise e

async def generate_interview_questions(job_title, job_desc):
    """Generate 10 interview questions as a JSON array based on role and description."""
    prompt = f"""
    You are an expert technical interviewer. Generate exactly 10 interview questions for the following role.
    The questions should progressively increase in difficulty and cover different aspects of the role.
    
    Role: {job_title}
    Job Description: {job_desc}
    
    Mix the following question types:
    - 2 behavioral/situational questions
    - 3 technical knowledge questions  
    - 2 problem-solving questions
    - 2 role-specific scenario questions
    - 1 culture-fit question
    
    Return ONLY a valid JSON array of exactly 10 strings (the questions), no explanation.
    Example format: ["Question 1?", "Question 2?", ...]
    """
    
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        # Extract JSON array
        start = text.find('[')
        end = text.rfind(']') + 1
        if start != -1 and end > 0:
            questions = json.loads(text[start:end])
            if isinstance(questions, list) and len(questions) >= 5:
                return questions[:10]
        raise ValueError("Could not parse questions array")
    except Exception as e:
        print(f"[ai_engine] generate_interview_questions failed: {e}")
        # Fallback questions so the interview isn't blocked
        return [
            f"Tell us about your experience relevant to the {job_title} role.",
            "Describe a challenging project you worked on and how you handled it.",
            "How do you prioritize tasks when working on multiple deadlines?",
            "What technical skills do you consider your strongest?",
            "Describe a time you had to learn a new technology quickly.",
            "How do you handle disagreements with team members?",
            "Walk us through your problem-solving approach.",
            "What makes you interested in this internal opportunity?",
            "How do you stay current with industry trends?",
            "Where do you see your career heading in the next 2-3 years?"
        ]


async def evaluate_interview_performance(job_title, job_desc, qa_pairs):
    """
    Evaluate the candidate's full interview performance.
    qa_pairs: list of {"question": str, "answer": str}
    Returns a structured evaluation dict.
    """
    qa_text = "\n".join([
        f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}\n"
        for i, qa in enumerate(qa_pairs)
    ])
    
    prompt = f"""
    You are an expert HR evaluator. A candidate has just completed an AI interview for the following role.
    
    Role: {job_title}
    Job Description: {job_desc}
    
    Interview Transcript:
    {qa_text}
    
    Evaluate the candidate and return a VALID JSON object with:
    1. "overall_score": a number from 0 to 100
    2. "recommendation": either "Recommended" or "Not Recommended"
    3. "summary": a 3-4 sentence overall assessment
    4. "strengths": a list of 3 key strengths demonstrated
    5. "weaknesses": a list of 2-3 areas for improvement
    6. "question_scores": a list of objects, one per question, each with "question_number" (int), "score" (0-10), and "feedback" (1 sentence)
    
    Return ONLY the JSON object:
    """
    
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse evaluation JSON")
    except Exception as e:
        print(f"[ai_engine] evaluate_interview_performance failed: {e}")
        return {
            "overall_score": 0,
            "recommendation": "Not Recommended",
            "summary": "AI evaluation was unable to complete due to a system error. Please review manually.",
            "strengths": [],
            "weaknesses": ["Evaluation could not be completed"],
            "question_scores": []
        }

async def analyze_leave_impact(leave_data: dict, team_data: str):
    prompt = f"""
    You are an expert HR AI analyzing the impact of an employee's leave request.
    
    Leave Data:
    {json.dumps(leave_data)}
    
    Team Context (other leaves, milestones, etc.):
    {team_data}
    
    Return a VALID JSON object with:
    1. "ai_impact_score": Float (0-10, where 10 is very high negative impact)
    2. "ai_milestone_conflict": String (describe any conflicts or "None")
    3. "ai_succession_backup": String (suggest a role or name for backup based on the context, or "None")
    
    Return ONLY the JSON object.
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse leave impact JSON")
    except Exception as e:
        print(f"[ai_engine] analyze_leave_impact failed: {e}")
        return {
            "ai_impact_score": 0.0,
            "ai_milestone_conflict": "None",
            "ai_succession_backup": "None"
        }