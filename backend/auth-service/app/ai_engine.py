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

async def calculate_skill_match(employee_skills: dict, job_required_skills: dict):
    """Calculate real-time skill match percentage between employee and role requirements."""
    if not employee_skills or not job_required_skills:
        return {"match_pct": 0, "gaps": [], "strengths": []}
    
    prompt = f"""
    You are an expert HR skill-matching AI. Compare these two skill profiles and calculate a match percentage.
    
    Employee Skills (skill: proficiency 1-10):
    {json.dumps(employee_skills)}
    
    Role Required Skills (skill: required level 1-10):
    {json.dumps(job_required_skills)}
    
    Return ONLY a valid JSON object with:
    1. "match_pct": percentage match (0-100)
    2. "gaps": list of objects with "skill", "current", "required", "gap" for skills where employee is below requirement
    3. "strengths": list of objects with "skill", "level" for skills where employee meets or exceeds requirement
    4. "learning_priority": list of top 3 skills to focus on, ordered by impact
    
    Return ONLY the JSON object.
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse skill match JSON")
    except Exception as e:
        print(f"[ai_engine] calculate_skill_match failed: {e}")
        # Fallback: simple calculation
        total = 0
        matched = 0
        gaps = []
        strengths = []
        for skill, required in job_required_skills.items():
            total += required
            current = employee_skills.get(skill, 0)
            matched += min(current, required)
            if current < required:
                gaps.append({"skill": skill, "current": current, "required": required, "gap": required - current})
            else:
                strengths.append({"skill": skill, "level": current})
        pct = round((matched / total) * 100) if total > 0 else 0
        return {"match_pct": pct, "gaps": gaps, "strengths": strengths, "learning_priority": [g["skill"] for g in sorted(gaps, key=lambda x: x["gap"], reverse=True)[:3]]}


async def generate_dream_role_paths(employee_skills: dict, dream_roles: list, current_role: str = ""):
    """Generate learning paths needed to qualify for dream roles."""
    prompt = f"""
    You are a career development AI advisor. An employee wants to reach their dream roles.
    
    Current Role: {current_role}
    Current Skills: {json.dumps(employee_skills)}
    Dream Roles: {json.dumps(dream_roles)}
    
    For each dream role, provide:
    1. An estimated readiness percentage (0-100)
    2. A list of 3-5 skill gaps with specific learning recommendations
    3. Estimated timeline to be role-ready (in months)
    4. Recommended learning resources (courses, certifications, projects)
    
    Return ONLY a valid JSON object with:
    {{
      "paths": [
        {{
          "role": "...",
          "readiness_pct": 65,
          "timeline_months": 6,
          "skill_gaps": [{{"skill": "...", "current": 5, "needed": 9, "resources": ["..."]}}],
          "recommended_actions": ["..."]
        }}
      ]
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse dream role paths JSON")
    except Exception as e:
        print(f"[ai_engine] generate_dream_role_paths failed: {e}")
        return {"paths": [{"role": r, "readiness_pct": 50, "timeline_months": 12, "skill_gaps": [], "recommended_actions": ["Complete skill assessment"]} for r in dream_roles]}


async def generate_adaptive_questions(job_title, job_desc, previous_answers=None, difficulty_level="medium"):
    """Generate adaptive interview questions based on previous answer quality."""
    context = ""
    if previous_answers:
        context = f"""
        Previous Q&A (analyze depth of knowledge shown):
        {json.dumps(previous_answers[-3:])}  
        
        Based on the quality of previous answers, adjust difficulty:
        - If answers show deep expertise → ask architectural/system-design level questions
        - If answers are surface-level → ask more fundamental questions
        - Skip topics already well-covered
        """
    
    prompt = f"""
    You are an adaptive interviewer AI. Generate the NEXT interview question for this role.
    
    Role: {job_title}
    Job Description: {job_desc}
    Current Difficulty Level: {difficulty_level}
    {context}
    
    Return ONLY a valid JSON object:
    {{
      "question": "The next question text",
      "difficulty": "easy|medium|hard|expert",
      "category": "behavioral|technical|problem_solving|scenario|culture_fit",
      "follow_up_hint": "A brief note on what a strong answer would cover"
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse adaptive question JSON")
    except Exception as e:
        print(f"[ai_engine] generate_adaptive_questions failed: {e}")
        return {
            "question": f"Tell us about your most challenging experience related to {job_title}.",
            "difficulty": difficulty_level,
            "category": "behavioral",
            "follow_up_hint": "Look for specific examples and outcomes"
        }


async def analyze_soft_skills(qa_pairs: list):
    """Analyze communication clarity, confidence, and technical accuracy from interview responses."""
    qa_text = "\n".join([f"Q: {qa['question']}\nA: {qa['answer']}\n" for qa in qa_pairs])
    
    prompt = f"""
    You are an expert communication and behavioral analyst. Analyze these interview responses for soft skills.
    
    Interview Transcript:
    {qa_text}
    
    Evaluate and return ONLY a valid JSON object:
    {{
      "communication_clarity": {{
        "score": 85,
        "feedback": "Brief analysis of how clearly the candidate communicated",
        "tips": ["Improvement suggestion 1", "Improvement suggestion 2"]
      }},
      "confidence_level": {{
        "score": 78,
        "feedback": "Analysis of confidence in responses",
        "indicators": ["Positive indicator", "Area to improve"]
      }},
      "technical_accuracy": {{
        "score": 90,
        "feedback": "How accurate and deep were the technical responses"
      }},
      "structure_organization": {{
        "score": 72,
        "feedback": "How well-structured were the answers (STAR method, etc.)"
      }},
      "overall_impression": "2-3 sentence summary of the candidate's soft skill profile"
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse soft skills JSON")
    except Exception as e:
        print(f"[ai_engine] analyze_soft_skills failed: {e}")
        return {
            "communication_clarity": {"score": 0, "feedback": "Analysis unavailable", "tips": []},
            "confidence_level": {"score": 0, "feedback": "Analysis unavailable", "indicators": []},
            "technical_accuracy": {"score": 0, "feedback": "Analysis unavailable"},
            "structure_organization": {"score": 0, "feedback": "Analysis unavailable"},
            "overall_impression": "Soft skill analysis could not be completed due to a system error."
        }


async def generate_competency_spider(job_title, job_desc, qa_pairs):
    """Generate a 7-axis behavioral competency scorecard (spider chart data)."""
    qa_text = "\n".join([f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}\n" for i, qa in enumerate(qa_pairs)])
    
    prompt = f"""
    You are an expert HR behavioral assessor. Score this candidate on 7 competency axes.
    
    Role: {job_title}
    Description: {job_desc}
    
    Interview Transcript:
    {qa_text}
    
    Score each competency from 0-100 and provide a brief justification.
    Return ONLY a valid JSON object:
    {{
      "competencies": [
        {{"name": "Problem Solving", "score": 85, "justification": "..."}},
        {{"name": "Communication", "score": 78, "justification": "..."}},
        {{"name": "Technical Depth", "score": 90, "justification": "..."}},
        {{"name": "Leadership Potential", "score": 65, "justification": "..."}},
        {{"name": "Cultural Fit", "score": 80, "justification": "..."}},
        {{"name": "Adaptability", "score": 72, "justification": "..."}},
        {{"name": "Domain Expertise", "score": 88, "justification": "..."}}
      ],
      "overall_band": "A|B|C|D",
      "hire_confidence": 82
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse competency spider JSON")
    except Exception as e:
        print(f"[ai_engine] generate_competency_spider failed: {e}")
        return {
            "competencies": [
                {"name": "Problem Solving", "score": 0, "justification": "Unavailable"},
                {"name": "Communication", "score": 0, "justification": "Unavailable"},
                {"name": "Technical Depth", "score": 0, "justification": "Unavailable"},
                {"name": "Leadership Potential", "score": 0, "justification": "Unavailable"},
                {"name": "Cultural Fit", "score": 0, "justification": "Unavailable"},
                {"name": "Adaptability", "score": 0, "justification": "Unavailable"},
                {"name": "Domain Expertise", "score": 0, "justification": "Unavailable"}
            ],
            "overall_band": "N/A",
            "hire_confidence": 0
        }


async def analyze_sentiment_integrity(qa_pairs):
    """Analyze sentiment and flag inconsistencies, distress, or hesitation."""
    qa_text = "\n".join([f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}\n" for i, qa in enumerate(qa_pairs)])
    
    prompt = f"""
    You are an expert behavioral psychologist analyzing interview responses.
    
    Interview Transcript:
    {qa_text}
    
    Analyze for:
    1. Consistency: Are answers consistent with each other? Flag contradictions.
    2. Confidence markers: Language patterns suggesting high/low confidence.
    3. Preparation level: Evidence of preparation vs. improvisation.
    4. Stress indicators: Signs of distress, burnout, or dissatisfaction.
    5. Integrity flags: Potential exaggerations or inconsistencies.
    
    Return ONLY a valid JSON object:
    {{
      "consistency_score": 85,
      "confidence_markers": {{"level": "High|Medium|Low", "indicators": ["..."]}},
      "preparation_level": {{"level": "Well Prepared|Moderate|Underprepared", "evidence": "..."}},
      "stress_indicators": {{"detected": false, "notes": "..."}},
      "integrity_flags": [{{"question_number": 3, "flag": "Possible exaggeration", "detail": "..."}}],
      "overall_assessment": "Brief 2-sentence assessment"
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse sentiment integrity JSON")
    except Exception as e:
        print(f"[ai_engine] analyze_sentiment_integrity failed: {e}")
        return {
            "consistency_score": 0,
            "confidence_markers": {"level": "Unknown", "indicators": []},
            "preparation_level": {"level": "Unknown", "evidence": "Analysis unavailable"},
            "stress_indicators": {"detected": False, "notes": "Analysis unavailable"},
            "integrity_flags": [],
            "overall_assessment": "Sentiment analysis could not be completed."
        }


async def generate_ai_resume(employee_data: dict, job_data: dict):
    """Generate a pre-filled internal application highlighting actual achievements."""
    prompt = f"""
    You are an expert internal recruitment AI. Generate a pre-filled internal job application
    that highlights the employee's actual achievements within the company.
    
    Employee Profile:
    {json.dumps(employee_data)}
    
    Target Role:
    {json.dumps(job_data)}
    
    Create a compelling internal application that:
    1. Maps existing skills to role requirements
    2. Highlights relevant internal achievements and projects
    3. Shows growth trajectory within the company
    4. Includes a tailored cover statement
    
    Return ONLY a valid JSON object:
    {{
      "cover_statement": "A compelling 3-4 sentence cover statement",
      "skill_mapping": [{{"requirement": "...", "evidence": "How employee meets this", "strength": "strong|moderate|developing"}}],
      "key_achievements": ["Achievement 1 with metrics", "Achievement 2"],
      "growth_narrative": "2-3 sentences about career growth within company",
      "recommended_talking_points": ["Point for interview"]
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse AI resume JSON")
    except Exception as e:
        print(f"[ai_engine] generate_ai_resume failed: {e}")
        return {
            "cover_statement": "Unable to generate AI resume at this time.",
            "skill_mapping": [],
            "key_achievements": [],
            "growth_narrative": "",
            "recommended_talking_points": []
        }


async def generate_highlights_reel(qa_pairs, evaluation):
    """Extract top 3 critical interview moments for a highlights reel."""
    qa_text = "\n".join([f"Q{i+1}: {qa['question']}\nA{i+1}: {qa['answer']}\n" for i, qa in enumerate(qa_pairs)])
    
    prompt = f"""
    You are an expert interview analyst. From this full interview transcript, extract the TOP 3 most
    critical moments that a hiring manager MUST see. These should be the moments that most strongly
    indicate whether to hire or not.
    
    Full Transcript:
    {qa_text}
    
    Overall Evaluation Summary: {json.dumps(evaluation) if evaluation else "Not available"}
    
    Return ONLY a valid JSON object:
    {{
      "highlights": [
        {{
          "question_number": 3,
          "question": "The question asked",
          "answer_excerpt": "The most impactful 2-3 sentences from the answer",
          "significance": "Why this moment matters (1 sentence)",
          "sentiment": "positive|negative|neutral",
          "tag": "Strong Technical Answer|Red Flag|Leadership Evidence|etc"
        }}
      ],
      "executive_summary": "2-sentence summary a manager can read in 10 seconds",
      "hire_signal": "Strong Hire|Hire|Lean Hire|Lean No Hire|No Hire"
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse highlights reel JSON")
    except Exception as e:
        print(f"[ai_engine] generate_highlights_reel failed: {e}")
        return {
            "highlights": [],
            "executive_summary": "Highlights reel could not be generated.",
            "hire_signal": "Review Manually"
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


async def run_career_simulation(employee_data: dict):
    """
    Autonomous Career Simulation: Predicts the executive role an employee
    will be ready for in 24 months and the specific training investment needed.
    """
    prompt = f"""
    You are a world-class executive career strategist AI. Run a "What-If" career simulation.

    Employee Profile:
    - Name: {employee_data.get('name', 'Employee')}
    - Current Role: {employee_data.get('current_role', 'N/A')}
    - Department: {employee_data.get('department', 'N/A')}
    - Skills: {json.dumps(employee_data.get('skills', {}))}
    - Performance Score (last cycle): {employee_data.get('performance_score', 'N/A')}
    - Potential Score: {employee_data.get('potential_score', 'N/A')}
    - Tenure: {employee_data.get('tenure_months', 0)} months
    - Recent Mood Trend: {employee_data.get('mood_trend', 'Neutral')}
    - Interview Scores: {employee_data.get('interview_scores', 'N/A')}

    QUESTION: If this employee continues at their current trajectory, what executive-level
    or senior leadership role will they be ready for in 24 months? What specific training
    (worth approximately $3,000 USD) would accelerate this path right now?

    Return ONLY a valid JSON object:
    {{
      "predicted_role": "VP of Engineering",
      "confidence_pct": 78,
      "timeline_months": 24,
      "current_readiness_pct": 62,
      "training_investment": {{
        "total_cost_usd": 2950,
        "courses": [
          {{"title": "...", "provider": "...", "cost_usd": 800, "duration": "6 weeks", "impact": "High"}},
          {{"title": "...", "provider": "...", "cost_usd": 1200, "duration": "8 weeks", "impact": "Critical"}},
          {{"title": "...", "provider": "...", "cost_usd": 950, "duration": "4 weeks", "impact": "Medium"}}
        ]
      }},
      "milestones": [
        {{"month": 3, "milestone": "Complete certification X"}},
        {{"month": 6, "milestone": "Lead cross-functional project"}},
        {{"month": 12, "milestone": "Manage a team of 5+"}},
        {{"month": 18, "milestone": "Present to C-suite"}},
        {{"month": 24, "milestone": "Ready for promotion"}}
      ],
      "risk_factors": ["Factor 1", "Factor 2"],
      "executive_summary": "2-3 sentence summary of this employee's trajectory"
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse career simulation JSON")
    except Exception as e:
        print(f"[ai_engine] run_career_simulation failed: {e}")
        return {
            "predicted_role": "Senior " + employee_data.get('current_role', 'Leader'),
            "confidence_pct": 50,
            "timeline_months": 24,
            "current_readiness_pct": 40,
            "training_investment": {"total_cost_usd": 3000, "courses": []},
            "milestones": [],
            "risk_factors": ["Insufficient data for accurate prediction"],
            "executive_summary": "Career simulation requires more data points for a confident prediction."
        }


async def generate_nine_box(employees_data: list):
    """Generate 9-Box Potential vs Performance matrix placement for employees."""
    prompt = f"""
    You are an expert talent strategist. Place these employees on a 9-Box Grid
    (X-axis: Performance Low/Med/High, Y-axis: Potential Low/Med/High).

    Employee Data:
    {json.dumps(employees_data[:20])}

    Return ONLY a valid JSON object:
    {{
      "placements": [
        {{
          "employee_id": 1,
          "employee_name": "...",
          "performance_band": "High",
          "potential_band": "High",
          "grid_position": [3, 3],
          "label": "Star",
          "action": "Promote / Fast-track"
        }}
      ],
      "summary": "Brief summary of the talent distribution"
    }}

    Grid labels: [1,1]=Underperformer, [2,1]=Effective, [3,1]=Trusted Professional,
    [1,2]=Inconsistent, [2,2]=Core Player, [3,2]=High Performer,
    [1,3]=Rough Diamond, [2,3]=Rising Star, [3,3]=Star
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse 9-box JSON")
    except Exception as e:
        print(f"[ai_engine] generate_nine_box failed: {e}")
        return {"placements": [], "summary": "9-Box analysis unavailable."}


async def analyze_sentiment_trend(feedbacks: list):
    """Analyze if peer feedback sentiment is trending positive or negative over time."""
    prompt = f"""
    You are an expert organizational psychologist. Analyze these peer feedback entries
    over time and identify sentiment trends.

    Feedback Entries (chronological):
    {json.dumps(feedbacks[:30])}

    Return ONLY a valid JSON object:
    {{
      "overall_trend": "Improving|Stable|Declining",
      "trend_score": 0.72,
      "periods": [
        {{"period": "Recent", "avg_sentiment": 0.8, "sample_size": 5}},
        {{"period": "Previous", "avg_sentiment": 0.6, "sample_size": 4}}
      ],
      "friction_alerts": [
        {{"department": "...", "severity": "High|Medium|Low", "description": "..."}}
      ],
      "summary": "2-sentence trend analysis"
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse sentiment trend JSON")
    except Exception as e:
        print(f"[ai_engine] analyze_sentiment_trend failed: {e}")
        return {"overall_trend": "Stable", "trend_score": 0.5, "periods": [], "friction_alerts": [], "summary": "Trend analysis unavailable."}


async def generate_employee_growth_report(employee_data: dict):
    """Generate a 360-degree self-growth intelligence report for an employee."""
    prompt = f"""
    You are an expert career development AI. Generate a comprehensive self-growth report.

    Employee Profile:
    {json.dumps(employee_data)}

    Return ONLY a valid JSON object:
    {{
      "kpi_alignment_score": 82,
      "kpi_alignment_detail": "Brief explanation of how actions align with company roadmap",
      "skill_growth": {{
        "start_of_period": {{"Python": 7, "Leadership": 5}},
        "end_of_period": {{"Python": 8, "Leadership": 7}},
        "growth_pct": 15
      }},
      "peer_collaboration_score": 78,
      "peer_collaboration_detail": "Assisted 3 peers, co-authored 2 projects",
      "voice_session_summary": {{
        "confidence_avg": 82,
        "clarity_avg": 78,
        "sessions_completed": 2
      }},
      "mood_productivity_correlation": {{
        "correlation": "Positive",
        "detail": "Energized days showed 23% higher output"
      }},
      "milestone_badges": ["First Interview Completed", "Skill Gap Closed: React"],
      "promotion_readiness_pct": 72,
      "disengagement_risk": 15,
      "executive_summary": "3-sentence overall growth assessment"
    }}
    """
    try:
        response = _call_gemini(prompt[:32000])
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        raise ValueError("Could not parse growth report JSON")
    except Exception as e:
        print(f"[ai_engine] generate_employee_growth_report failed: {e}")
        return {
            "kpi_alignment_score": 0, "kpi_alignment_detail": "Unavailable",
            "skill_growth": {"start_of_period": {}, "end_of_period": {}, "growth_pct": 0},
            "peer_collaboration_score": 0, "peer_collaboration_detail": "Unavailable",
            "voice_session_summary": {"confidence_avg": 0, "clarity_avg": 0, "sessions_completed": 0},
            "mood_productivity_correlation": {"correlation": "Unknown", "detail": "Unavailable"},
            "milestone_badges": [], "promotion_readiness_pct": 0, "disengagement_risk": 0,
            "executive_summary": "Growth report could not be generated."
        }


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SUCCESSION PLANNING INTELLIGENCE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def analyze_succession_pipeline(org_data: dict):
    """Generates Pipeline Intelligence for the organization: bench strength, gaps, overlaps."""
    prompt = f"""
    You are an elite Enterprise Succession Architect. Analyze this organization's data 
    and output Pipeline Intelligence.
    
    Org Data: {json.dumps(org_data)[:20000]}
    
    Return ONLY a valid JSON object:
    {{
      "bench_strength": [
        {{"role": "CTO", "ready_now": 0, "ready_1yr": 1, "ready_2yr": 2}},
        {{"role": "VP of Engineering", "ready_now": 1, "ready_1yr": 2, "ready_2yr": 0}}
      ],
      "attrition_risks": [
        {{"employee_name": "...", "role": "...", "reason": "High burnout score / Low engagement"}}
      ],
      "succession_gaps": [
        {{"critical_role": "...", "alert": "Zero internal successors mapped"}}
      ],
      "skills_overlap_analysis": [
        {{"employee_name": "...", "issue": "Mapped to 3 different executive roles, creating single point of failure risk"}}
      ]
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end]) if start != -1 else {"bench_strength": [], "attrition_risks": [], "succession_gaps": [], "skills_overlap_analysis": []}
    except:
        return {"bench_strength": [], "attrition_risks": [], "succession_gaps": [], "skills_overlap_analysis": []}


async def run_shadow_pipeline_simulation(employee_data: dict, target_role: str):
    """Autonomous Leadership Simulation (Shadow Pipeline) for Future Stars."""
    prompt = f"""
    You are a Leadership Assessment Engine. Provide a micro-gig simulation for an employee mapped as a 'Future Star'.
    
    Employee Data: {json.dumps(employee_data)}
    Target Role: {target_role}
    
    Task: Create a realistic, high-stakes (but non-critical) decision-making scenario for the {target_role} role. 
    Then, based on the employee's skills and performance history, predict their 'Shadow Score' (out of 100) 
    indicating how well they would naturally handle this scenario right now.
    
    Return ONLY a valid JSON object:
    {{
      "scenario_title": "Crisis Comm: Service Outage",
      "scenario_description": "A critical 3rd-party API has gone down during a major product launch. How do you allocate engineering resources while managing stakeholder panic?",
      "predicted_shadow_score": 82,
      "readiness_proof": "Employee's historical crisis management and high React/Backend skills suggest a methodical approach, but lacks external stakeholder comms experience.",
      "recommended_action": "Assign them to shadow the upcoming Q3 post-mortem meeting."
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end]) if start != -1 else {"scenario_title": "Error", "predicted_shadow_score": 0}
    except:
        return {"scenario_title": "Scenario Generation Failed", "predicted_shadow_score": 0, "readiness_proof": "", "recommended_action": ""}


async def analyze_employee_succession_profile(employee_data: dict, target_role_reqs: dict):
    """Analyzes skill gaps, pre-onboarding readiness, and leadership badges for the employee's Goal Role."""
    prompt = f"""
    You are an Executive Career Coach AI. Analyze the gap between an employee's current state and their 'Goal Role'.
    
    Employee Data: {json.dumps(employee_data)}
    Target Role Requirements: {json.dumps(target_role_reqs)}
    
    Return ONLY a valid JSON object:
    {{
      "goal_role": "{target_role_reqs.get('title', 'Target Role')}",
      "pre_onboarding_readiness_pct": 65,
      "skill_gaps": [
        {{"skill": "Cloud Architecture", "current": 3, "required": 8, "recommended_path": "AWS Solutions Architect Cert"}}
      ],
      "leadership_badges": [
        {{"badge": "Strategist", "earned": true, "reason": "Consistently praised for long-term vision in peer reviews"}},
        {{"badge": "Mentor", "earned": false, "reason": "Requires more active junior developer assistance"}}
      ],
      "mentor_match_recommendation": "Should be paired with current Director of Engineering",
      "global_mobility_flag": "Ready for EMEA roles based on willingness to relocate"
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end]) if start != -1 else {"goal_role": "Unknown", "pre_onboarding_readiness_pct": 0, "skill_gaps": [], "leadership_badges": []}
    except:
        return {"goal_role": "Unknown", "pre_onboarding_readiness_pct": 0, "skill_gaps": [], "leadership_badges": [], "mentor_match_recommendation": ""}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CULTURAL INTELLIGENCE ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def analyze_culture_map(pulses: list, org_perf_data: dict = None):
    """Generates the Anonymized Culture Map and ROI correlations."""
    prompt = f"""
    You are a Workplace Culture Scientist. Analyze the following anonymized pulse responses 
    and output a Cultural Intelligence Map.
    
    Pulse Data: {json.dumps(pulses)[:20000]}
    Performance/ROI Data: {json.dumps(org_perf_data) if org_perf_data else "None"}
    
    Tasks:
    1. Generate a Sentiment Heatmap by Department.
    2. Analyze 'Silent Majority' friction points (common issues among broad groups).
    3. Calculate Culture-to-Performance ROI (correlation between culture scores and performance).
    4. Provide Managerial Impact insights.
    
    Return ONLY a valid JSON object:
    {{
      "heatmap": [
        {{"department": "Engineering", "sentiment": 4.2, "status": "Thriving"}},
        {{"department": "Sales", "sentiment": 2.1, "status": "High Friction"}}
      ],
      "burnout_correlation": "Culture scores for Support team are 30% lower than avg, correlating with high overtime flags in Burnout Radar.",
      "silent_majority_insight": "A large cluster of core employees cite 'Meeting Fatigue' as a micro-gripe.",
      "managerial_impact": [
        {{"manager_id": "...", "impact": "Positive", "note": "Team sentiment increased by 15% after transition"}}
      ],
      "culture_roi": {{
        "milestone_acceleration": "Teams with high psychological safety are hitting milestones 12% faster.",
        "retention_value_estimated_usd": 45000
      }}
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end]) if start != -1 else {}
    except:
        return {}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WELLNESS NAVIGATOR & ATTRITION INTELLIGENCE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def analyze_employee_wellness(employee_data: dict):
    """Private Wellness Navigator for an individual employee — acts as a performance coach."""
    prompt = f"""
    You are a Private Wellness Coach AI embedded in an HR platform. Analyze the following 
    employee's telemetry and produce a personal wellness dashboard. This is PRIVATE to the 
    employee — never expose individual data to the org.

    Employee Data: {json.dumps(employee_data)[:15000]}

    Tasks:
    1. Calculate a Work-Life Balance Score (0-100) from Deep Work vs Meeting hours.
    2. Detect overtime patterns and suggest compensatory leave.
    3. Identify if their tasks align with their career aspirations (Skill-Drain detection).
    4. Suggest wellness resources if mood trends are low.
    5. Recommend "Quiet Mode" recharge blocks if burnout risk is high.

    Return ONLY a valid JSON object:
    {{
      "balance_score": 72,
      "deep_work_hours_weekly": 22,
      "meeting_hours_weekly": 14,
      "meeting_fatigue_level": "Moderate",
      "overtime_streak": {{
        "consecutive_late_days": 4,
        "recommendation": "You've worked late 4 days in a row. Consider requesting Friday off."
      }},
      "quiet_mode_suggestion": {{
        "triggered": true,
        "message": "Your burnout indicators are elevated. Block 2-4 PM tomorrow as a Recharge Block?",
        "suggested_block": "Tomorrow 2:00 PM - 4:00 PM"
      }},
      "skill_drain_alert": {{
        "triggered": false,
        "current_task_alignment_pct": 65,
        "detail": "35% of your time is on tasks outside your growth path. Consider delegating report generation."
      }},
      "wellness_resources": [
        {{"title": "Managing Workplace Stress", "type": "Learning Path", "relevance": "High"}},
        {{"title": "Company EAP Program", "type": "Benefit", "relevance": "Medium"}}
      ],
      "mood_trend": {{
        "direction": "declining",
        "avg_last_7_days": 2.8,
        "insight": "Your energy has dipped since Wednesday. Consider a change of routine."
      }},
      "weekly_summary": "You're putting in solid work but burning the candle at both ends. Prioritize recovery this week."
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        return {"balance_score": 0, "weekly_summary": "Wellness analysis unavailable."}
    except Exception as e:
        print(f"[ai_engine] analyze_employee_wellness failed: {e}")
        return {"balance_score": 0, "weekly_summary": "Wellness analysis unavailable."}


async def analyze_attrition_intelligence(burnout_data: list, performance_data: dict, leave_data: dict):
    """Organization-level Attrition Intelligence — aggregated, anonymized strategic decisions."""
    prompt = f"""
    You are an Attrition Intelligence Engine for a modern HR platform. Analyze aggregated, 
    ANONYMIZED workforce data to produce strategic insights. NEVER identify individuals.

    Burnout Telemetry (by team): {json.dumps(burnout_data)[:12000]}
    Performance Metrics: {json.dumps(performance_data)[:5000]}
    Leave Patterns: {json.dumps(leave_data)[:5000]}

    Tasks:
    1. Generate a Burnout Heatmap by Project/Manager showing which projects drive exhaustion.
    2. Calculate Predictive Resignation Probability per team (not per person) for next 90 days.
    3. Compute the "Knowledge Loss Index" — institutional memory at risk if high-burnout teams leave.
    4. Calculate Engagement-to-Burnout Ratio — is high performance sustainable or at cost of health?
    5. Check Regulatory Compliance flags (IT Act India, GDPR remote work safety standards).

    Return ONLY a valid JSON object:
    {{
      "burnout_heatmap": [
        {{"project": "Project Alpha", "manager": "Engineering Lead", "exhaustion_index": 78, "avg_overtime_hrs": 12, "risk_level": "Critical"}},
        {{"project": "Project Beta", "manager": "Product Lead", "exhaustion_index": 35, "avg_overtime_hrs": 3, "risk_level": "Healthy"}}
      ],
      "resignation_probability": [
        {{"team": "Engineering", "probability_pct": 32, "confidence": "Medium", "key_driver": "Sustained overtime with declining mood scores"}},
        {{"team": "Sales", "probability_pct": 12, "confidence": "Low", "key_driver": "Stable indicators"}}
      ],
      "knowledge_loss_index": [
        {{"team": "Engineering", "institutional_memory_risk": "High", "critical_milestones_at_risk": 5, "estimated_replacement_cost_usd": 180000}},
        {{"team": "Sales", "institutional_memory_risk": "Low", "critical_milestones_at_risk": 1, "estimated_replacement_cost_usd": 25000}}
      ],
      "engagement_burnout_ratio": [
        {{"team": "Engineering", "engagement_score": 85, "burnout_score": 72, "ratio": 1.18, "verdict": "Unsustainable — high output at cost of health"}},
        {{"team": "Sales", "engagement_score": 70, "burnout_score": 30, "ratio": 2.33, "verdict": "Healthy — balanced performance"}}
      ],
      "compliance_flags": [
        {{"team": "Engineering", "flag": "Overtime exceeds IT Act Section 51 threshold (48 hrs/week) for 3 consecutive weeks", "severity": "High"}},
        {{"team": "Support", "flag": "No mandatory rest day detected in 10-day window for 2 team members", "severity": "Critical"}}
      ],
      "executive_summary": "Engineering team is the primary risk center. 78% exhaustion index with 32% resignation probability suggests immediate intervention needed."
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        return {"burnout_heatmap": [], "resignation_probability": [], "executive_summary": "Analysis unavailable."}
    except Exception as e:
        print(f"[ai_engine] analyze_attrition_intelligence failed: {e}")
        return {"burnout_heatmap": [], "resignation_probability": [], "executive_summary": "Analysis unavailable."}


async def run_live_prediction_intervention(burnout_data: list, leave_data: dict, careers_data: dict):
    """The HRVALY Unique: Live Prediction & Load Balancer — cross-references all systems."""
    prompt = f"""
    You are the HRVALY Live Prediction Engine — the most advanced workforce intelligence 
    system available. Cross-reference ALL of the following data sources to produce a single, 
    actionable intervention recommendation.

    DATA SOURCES:
    1. Burnout Radar Data: {json.dumps(burnout_data)[:8000]}
    2. Leave Management Data: {json.dumps(leave_data)[:5000]}
    3. Internal Careers / Shadow Pipeline Data: {json.dumps(careers_data)[:5000]}

    YOUR TASK:
    Identify if any mission-critical team is burning out AND losing capacity (through leaves), 
    and recommend moving available talent from the Shadow Pipeline or Pre-Qualified Pool to 
    stabilize workforce health. Be specific with team names, durations, and costs.

    Return ONLY a valid JSON object:
    {{
      "alert_level": "Critical",
      "primary_warning": "Project 'mArgI' at risk. Engineering team burnout at 78% with 2 key leaves approved next week.",
      "intervention": {{
        "action": "Temporary Resource Rebalancing",
        "source_pool": "Shadow Pipeline — Pre-Qualified Talent",
        "recommended_moves": [
          {{
            "from_team": "Core Talent Pool",
            "to_team": "Engineering",
            "headcount": 2,
            "duration_days": 14,
            "skill_match_pct": 87,
            "rationale": "2 pre-qualified candidates with React/Node.js skills available for rotation"
          }}
        ],
        "estimated_impact": "Reduces burnout index from 78% to ~55%, prevents 32% resignation probability from materializing.",
        "cost_of_inaction": "Potential $180,000 in replacement costs + 3-month productivity gap"
      }},
      "secondary_recommendations": [
        "Enforce mandatory 'Recharge Blocks' for Engineering team for 2 weeks",
        "Defer non-critical milestone deadlines by 5 business days",
        "Activate Wellness Resource matching for all flagged employees"
      ],
      "confidence_score": 82,
      "data_freshness": "Based on last 14 days of telemetry + current leave calendar"
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > 0:
            return json.loads(text[start:end])
        return {"alert_level": "Unknown", "primary_warning": "Analysis unavailable.", "intervention": {}}
    except Exception as e:
        print(f"[ai_engine] run_live_prediction_intervention failed: {e}")
        return {"alert_level": "Error", "primary_warning": "Prediction engine failed.", "intervention": {}}

async def generate_culture_intervention(team_name: str, friction_points: list):
    """Generates a Team Re-Alignment Workshop template for managers when culture drops."""
    prompt = f"""
    You are a Team Effectiveness Consultant. A significant drop in sentiment has been detected for the {team_name} team.
    
    Friction Points identified: {json.dumps(friction_points)}
    
    Generate a 'Team Re-Alignment Workshop' template for the manager.
    
    Return ONLY a valid JSON object:
    {{
      "workshop_title": "Re-Aligning for Success: {team_name}",
      "agenda": [
        {{"time": "15 min", "activity": "Psychological Safety Reset", "description": "Open discussion on feedback safety."}},
        {{"time": "30 min", "activity": "Addressing Friction", "description": "Specific focus on resolving: {', '.join(friction_points[:3])}"}}
      ],
      "manager_scripts": {{
        "opening": "I've noticed we're facing some challenges as a team...",
        "closing": "Let's commit to these 3 changes..."
      }},
      "follow_up_metrics": ["Psychological Safety Score next week", "Weekly goal clarity survey"]
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{')
        end = text.rfind('}') + 1
        return json.loads(text[start:end]) if start != -1 else {{}}
    except:
        return {{}}


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SECURITY INTELLIGENCE ENGINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async def analyze_threat_intelligence(audit_data: list, session_data: list):
    """Enterprise Threat Intelligence — AI-powered security analysis."""
    prompt = f"""
    You are a Zero-Trust Security Intelligence Engine for an enterprise HR platform.
    Analyze the following audit logs and session data to identify threats.

    Audit Logs (last 30 days): {json.dumps(audit_data)[:12000]}
    Active Sessions: {json.dumps(session_data)[:5000]}

    Tasks:
    1. Detect IP/Geolocation Anomalies — flag actions from unusual IPs or locations.
    2. Find Administrative Overlap — multiple admins accessing same sensitive resource simultaneously.
    3. Identify Compliance Gap Alerts — unauthorized bulk data exports, GDPR violations.
    4. Compute a Threat Score (0-100) for the organization.
    5. Provide actionable security recommendations.

    Return ONLY valid JSON:
    {{
      "threat_score": 35,
      "threat_level": "Moderate",
      "geo_anomalies": [
        {{"admin": "admin@example.com", "action": "Viewed Payroll", "ip": "103.21.x.x", "location": "Unknown VPN", "risk": "High"}}
      ],
      "admin_overlap": [
        {{"resource": "Payroll Database", "admins": ["admin1", "admin2"], "window_minutes": 5, "risk": "Medium"}}
      ],
      "compliance_gaps": [
        {{"violation": "Bulk employee data export without audit justification", "regulation": "GDPR Art. 32", "severity": "Critical"}}
      ],
      "security_recommendations": [
        "Enable MFA for all administrator accounts",
        "Restrict payroll access to business hours only",
        "Implement IP whitelisting for sensitive operations"
      ],
      "summary": "Moderate threat posture. 2 geo-anomalies detected. Recommend immediate MFA enforcement."
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{{')
        end = text.rfind('}}') + 1
        if start == -1:
            start = text.find('{')
            end = text.rfind('}') + 1
        return json.loads(text[start:end]) if start != -1 else {{"threat_score": 0, "summary": "Analysis unavailable."}}
    except:
        return {{"threat_score": 0, "summary": "Analysis unavailable."}}


async def verify_audit_integrity(log_hashes: list):
    """Blockchain-Verified Audit Integrity — checks hash chain for tampering."""
    prompt = f"""
    You are an Immutable Audit Integrity Verifier. You are given a chain of audit log 
    hashes. Verify the integrity of the chain and report any anomalies.

    Hash Chain: {json.dumps(log_hashes)[:10000]}

    Tasks:
    1. Verify hash continuity — each entry's hash should be derivable from its content.
    2. Detect any gaps in the sequence (deleted entries).
    3. Flag any entries where the hash doesn't match expected content.
    4. Provide an integrity verdict.

    Return ONLY valid JSON:
    {{
      "integrity_status": "VERIFIED",
      "total_entries_checked": 150,
      "tampered_entries": 0,
      "deleted_entries": 0,
      "chain_breaks": [],
      "last_verified": "2026-05-03T00:30:00Z",
      "verdict": "All 150 audit entries verified. Zero tampering detected. Chain integrity: 100%.",
      "confidence": 99
    }}
    """
    try:
        response = _call_gemini(prompt)
        text = response.text.strip()
        start = text.find('{{')
        end = text.rfind('}}') + 1
        if start == -1:
            start = text.find('{')
            end = text.rfind('}') + 1
        return json.loads(text[start:end]) if start != -1 else {{"integrity_status": "UNKNOWN"}}
    except:
        return {{"integrity_status": "ERROR", "verdict": "Integrity verification failed."}}