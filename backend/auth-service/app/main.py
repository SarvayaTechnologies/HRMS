import os
import httpx
import json
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from .parser import extract_text_from_file
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database ,auth
from .ai_engine import analyze_resume_with_ai, get_ai_response, evaluate_internal_candidate, calculate_skill_match, generate_dream_role_paths, generate_adaptive_questions, analyze_soft_skills, generate_competency_spider, analyze_sentiment_integrity, generate_ai_resume, generate_highlights_reel
from geopy.distance import geodesic
from .payroll_logic import calculate_monthly_pay, calculate_monthly_payroll, build_salary_structure, detect_anomalies
from .utils import log_action
import uuid
import calendar
from sqlalchemy.orm import joinedload
from datetime import datetime, date, timedelta


models.Base.metadata.create_all(bind=database.engine)

# Auto-migrate: add any missing columns (idempotent)
from sqlalchemy import text as _text
_migration_columns = [
    ("internal_job_applications", "interview_answers", "TEXT"),
    ("internal_job_applications", "interview_evaluation", "TEXT"),
    ("internal_job_applications", "interview_result", "VARCHAR"),
    # Onboarding fields on users table
    ("users", "onboarding_completed", "BOOLEAN DEFAULT FALSE"),
    ("users", "employee_code", "VARCHAR"),
    ("users", "job_title", "VARCHAR"),
    ("users", "department", "VARCHAR"),
    ("users", "date_of_joining", "DATE"),
    ("users", "reporting_manager", "VARCHAR"),
    ("users", "employment_type", "VARCHAR"),
    ("users", "work_location", "VARCHAR"),
    ("users", "pan_number", "VARCHAR"),
    ("users", "aadhaar_number", "VARCHAR"),
    ("users", "bank_account", "VARCHAR"),
    ("users", "bank_ifsc", "VARCHAR"),
    ("users", "phone_number", "VARCHAR"),
    ("users", "emergency_contact_name", "VARCHAR"),
    ("users", "emergency_contact_phone", "VARCHAR"),
    ("users", "personal_email", "VARCHAR"),
    # Skill-Gap Mobility fields
    ("users", "skills_profile", "TEXT"),
    ("users", "dream_roles", "TEXT"),
    ("users", "career_aspiration_note", "TEXT"),
    # Advanced Internal Job fields
    ("internal_jobs", "required_skills", "TEXT"),
    ("internal_jobs", "experience_level", "VARCHAR"),
    ("internal_jobs", "job_type", "VARCHAR DEFAULT 'full_time'"),
    ("internal_jobs", "gig_duration", "VARCHAR"),
    ("internal_jobs", "gig_department", "VARCHAR"),
    # Advanced Application fields
    ("internal_job_applications", "skill_match_pct", "FLOAT"),
    ("internal_job_applications", "competency_scores", "TEXT"),
    ("internal_job_applications", "sentiment_analysis", "TEXT"),
    ("internal_job_applications", "soft_skill_feedback", "TEXT"),
    ("internal_job_applications", "interview_highlights", "TEXT"),
    ("internal_job_applications", "interview_mode", "VARCHAR DEFAULT 'scored'"),
    ("internal_job_applications", "is_prequalified", "BOOLEAN DEFAULT FALSE"),
    ("internal_job_applications", "prequalified_at", "TIMESTAMP"),
    ("internal_job_applications", "ai_resume_data", "TEXT"),
    # Grievance fields
    ("grievance_cases", "org_id", "INTEGER"),
    ("grievance_cases", "reporter_id", "INTEGER"),
    ("grievance_cases", "first_occurred", "DATE"),
    ("grievance_cases", "last_occurred", "DATE"),
    ("grievance_cases", "impact", "VARCHAR"),
    ("grievance_cases", "desired_resolution", "VARCHAR"),
    ("grievance_cases", "evidence_files", "VARCHAR"),
    ("grievance_cases", "anonymous_chat_key", "VARCHAR"),
    ("grievance_cases", "sentiment_label", "VARCHAR"),
    ("grievance_cases", "department", "VARCHAR"),
    ("grievance_cases", "deadline", "VARCHAR"),
]
with database.engine.connect() as _conn:
    for _table, _col, _type in _migration_columns:
        try:
            _conn.execute(_text(f"ALTER TABLE {_table} ADD COLUMN {_col} {_type}"))
            _conn.commit()
        except Exception:
            _conn.rollback()

app = FastAPI(title="HRValy - Auth Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def role_required(required_roles):
    def decorator(current_user: models.User = Depends(auth.get_current_user)):
        roles = required_roles if isinstance(required_roles, list) else [required_roles]
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient Permissions")
        return current_user
    return decorator


@app.get("/")
def read_root():
    return {
        "status": "HRValy Auth Service Online",
        "version": "1.0.0",
        "services": ["Auth", "User Management"]
    }

@app.get("/dev/models")
def list_gemini_models():
    try:
        from google import genai
        import os
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        models = []
        for m in client.models.list():
            models.append(m.name)
        return {"models": models}
    except Exception as e:
        return {"error": str(e)}

@app.get("/dev/repair")

def repair_db(db: Session = Depends(database.get_db)):
    from sqlalchemy import text
    try:
        db.execute(text("DROP TABLE IF EXISTS internal_job_applications CASCADE;"))
        db.execute(text("DROP TABLE IF EXISTS internal_jobs CASCADE;"))
        db.commit()
        models.Base.metadata.create_all(bind=database.engine)
        return {"status": "success. Tables recreated."}
    except Exception as e:
        return {"error": str(e)}

@app.get("/db-test")
def test_db(db: Session =Depends(database.get_db)):
    try:

        db.execute("SELECT 1")
        return {"status" : "Connected to neon database"}
    except Exception as e :
        return {"status" : "Error" , "details": str(e)}

@app.post("/auth/signup")
async def signup(data: dict, db: Session = Depends(database.get_db)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == data['email']).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pwd = auth.get_password_hash(data['password'])
    new_user = models.User(
        email=data['email'],
        full_name=data.get('full_name', data['email'].split('@')[0]),
        hashed_password=hashed_pwd,
        role="admin" # Default first user as admin for dev convenience
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.email, "role": new_user.role, "org_id": new_user.organization_id})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": new_user.email, "role": new_user.role}}

@app.post("/auth/login")
async def login(data: dict, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data['email']).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not auth.verify_password(data['password'], user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "org_id": user.organization_id})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "role": user.role}}

@app.get("/login/google")
async def login_google():
    """Redirects the user to the official Google OAuth 2.0 Consent Screen."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    redirect_uri = "http://localhost:8001/auth/callback"
    scope = "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
    
    google_url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={client_id}&response_type=code&scope={scope}&"
        f"redirect_uri={redirect_uri}&prompt=select_account"
    )
    return RedirectResponse(url=google_url)

@app.get("/auth/callback")
async def auth_callback(code: str, db: Session = Depends(database.get_db)):
    """Handles the code Google sends back, gets user info, and saves to Neon DB."""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = "http://localhost:8001/auth/callback"
    
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
       
        token_res = await client.post(token_url, data=token_data)
        token_res_json = token_res.json()
        
        if "error" in token_res_json:
            raise HTTPException(status_code=400, detail=token_res_json.get("error_description", "OAuth error"))
            
        access_token = token_res_json.get("access_token")
        
      
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        user_res = await client.get(user_info_url, headers={"Authorization": f"Bearer {access_token}"})
        user_info = user_res.json()
        
    temp_email = user_info.get("email")
    temp_name = user_info.get("name")

    user = db.query(models.User).filter(models.User.email == temp_email).first()
    if not user:
        user = models.User(email=temp_email, full_name=temp_name)
        db.add(user)
        db.commit()
        db.refresh(user)

    token = auth.create_access_token(data={"sub": user.email, "role": user.role, "org_id": user.organization_id})
    
    return RedirectResponse(url=f"http://localhost:3000/login?token={token}")

@app.post("/talent/parse-resume")
async def parse_resume(file: UploadFile =File(...)):
    content = await file.read()
    raw_text = extract_text_from_file(content, file.filename)
    
    structured_data = await analyze_resume_with_ai(raw_text)
    return {
        "filename": file.filename,
        "raw_text_preview": structured_data,
        "status": "Success"
     }

@app.post("/talent/generate-interview")
async def generate_questions(candidate_data: dict):
    skills = ", ".join(candidate_data.get("skills", []))
    prompt = f"Based on these skills: {skills}, generate 5 challenging interview questions. Return as a JSON list of strings."
    
    raw_response = await get_ai_response(prompt)
    questions = json.loads(raw_response.replace('```json', '').replace('```', '').strip())
    return {"questions": questions}

@app.post("/talent/evaluate-answer")
async def evaluate_answer(data: dict):
    question = data.get("question")
    transcript = data.get("transcript")
    
    prompt = f"Question: {question}\nCandidate Answer: {transcript}\nScore this answer out of 10 and give 1 sentence of feedback. Return JSON: {{'score': 8, 'feedback': '...'}}"
    
 
    raw_response = await get_ai_response(prompt)
    evaluation = json.loads(raw_response.replace('```json', '').replace('```', '').strip())
    return evaluation

@app.get("/hr/employees")
async def get_all_employees(db: Session = Depends(database.get_db)):
    employees = db.query(models.Employee).all()
    return employees

@app.post("/hr/onboard")
async def onboard_employee(data: dict, db: Session = Depends(database.get_db)):
    """Convert a candidate to an employee."""
    new_emp = models.Employee(
        user_id=data['user_id'],
        org_id=1, # Default for now
        employee_id=f"EMP-{data['user_id']}",
        department=data['department'],
        designation=data['designation'],
        joining_date=datetime.now().date()
    )
    db.add(new_emp)
    db.commit()
    return {"message": "Employee onboarded successfully"}

# Attendance logic moved to the end of the file for full approval system support.

@app.post("/leave/request")
async def apply_leave(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=400, detail="Only employees can apply for leave")
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        # Auto-create basic employee record if missing
        employee = models.Employee(
            user_id=current_user.id,
            org_id=current_user.organization_id,
            employee_id=f"EMP-{current_user.id}",
            department="Default",
            designation="Staff"
        )
        db.add(employee)
        db.commit()
        db.refresh(employee)
        
    from . import ai_engine
    
    # Gather contextual data for AI analysis
    # In a real app, we'd fetch actual project milestones and other team leaves here.
    # For now, we'll provide a descriptive summary of the context.
    team_context = f"Employee in department {employee.department}. Analyzing potential conflicts for {data['leave_type']} between {data['start_date']} and {data['end_date']}."
    
    impact_analysis = await ai_engine.analyze_leave_impact(data, team_context)

    new_leave = models.LeaveRequest(
        employee_id=employee.id,
        leave_type=data['leave_type'],
        start_date=datetime.strptime(data['start_date'], "%Y-%m-%d").date(),
        end_date=datetime.strptime(data['end_date'], "%Y-%m-%d").date(),
        reason=data['reason'],
        status="pending",
        handover_link=data.get('handover_link'),
        point_of_person_id=data.get('point_of_person_id'),
        wellness_check_requested=data.get('wellness_check_requested', False),
        ai_impact_score=impact_analysis.get('ai_impact_score'),
        ai_milestone_conflict=impact_analysis.get('ai_milestone_conflict'),
        ai_succession_backup=impact_analysis.get('ai_succession_backup')
    )
    db.add(new_leave)
    db.commit()
    return {"message": "Leave request submitted successfully", "impact": impact_analysis}

@app.get("/leave/my-requests")
async def my_leaves(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=400, detail="Only employees can view their leaves")
    
    employee = db.query(models.Employee).filter(models.Employee.user_id == current_user.id).first()
    if not employee:
        return []
        
    records = db.query(models.LeaveRequest).filter(models.LeaveRequest.employee_id == employee.id).order_by(models.LeaveRequest.id.desc()).all()
    return [{"id": r.id, "leave_type": r.leave_type, "start_date": r.start_date.isoformat() if r.start_date else None, "end_date": r.end_date.isoformat() if r.end_date else None, "status": r.status} for r in records]

@app.get("/org/leave/all")
async def all_org_leaves(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view leave requests")
    
    # Get all employees in the org
    employees = db.query(models.Employee).filter(models.Employee.org_id == current_user.organization_id).all()
    emp_ids = [e.id for e in employees]
    
    if not emp_ids:
        return []
        
    records = db.query(models.LeaveRequest).filter(models.LeaveRequest.employee_id.in_(emp_ids)).order_by(models.LeaveRequest.id.desc()).all()
    
    result = []
    for r in records:
        emp = db.query(models.Employee).filter(models.Employee.id == r.employee_id).first()
        user = db.query(models.User).filter(models.User.id == emp.user_id).first() if emp else None
        
        result.append({
            "id": r.id,
            "employee_name": user.full_name if user else "Unknown",
            "leave_type": r.leave_type,
            "start_date": r.start_date.isoformat() if r.start_date else None,
            "end_date": r.end_date.isoformat() if r.end_date else None,
            "reason": r.reason,
            "status": r.status,
            "handover_link": r.handover_link,
            "wellness_check_requested": r.wellness_check_requested,
            "ai_impact_score": r.ai_impact_score,
            "ai_milestone_conflict": r.ai_milestone_conflict,
            "ai_succession_backup": r.ai_succession_backup
        })
    return result

@app.post("/org/leave/{leave_id}/{action}")
async def action_leave(leave_id: int, action: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can approve/reject leaves")
    if action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
        
    record = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    record.status = action + "d" # approved or rejected
    
    if action == "approve":
        # Smart Silence Mode: Update Attendance/User status
        # In this implementation, we'll assume the most recent attendance entry or a status field
        employee = db.query(models.Employee).filter(models.Employee.id == record.employee_id).first()
        if employee:
            user = db.query(models.User).filter(models.User.id == employee.user_id).first()
            if user:
                # Mocking status update - you might want a dedicated status column
                print(f"[Smart Silence] User {user.full_name} is now OUT OF OFFICE. Muting pings.")
                
            # Trigger Auto-Delegation notification to Point of Person
            if record.point_of_person_id:
                pop = db.query(models.User).filter(models.User.id == record.point_of_person_id).first()
                if pop:
                    print(f"[Auto-Delegate] Notifying {pop.full_name} about delegation from {user.full_name if user else 'Employee'}")
                    print(f"Handover Notes: {record.reason}. Document: {record.handover_link}")

    db.commit()
    return {"status": "success", "message": f"Leave {record.status}"}

@app.get("/payroll/generate/{employee_id}")
async def generate_payroll(
    employee_id: int,
    request: Request, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
   
    salary_info = db.query(models.SalaryStructure).filter(models.SalaryStructure.employee_id == employee_id).first()
    
    if not salary_info:
      
        base_salary = 5000.0
    else:
        base_salary = salary_info.base_salary

    
    unpaid_days = 2
    total_days = 30
    

    
    result = calculate_monthly_pay(base_salary, total_days, unpaid_days)
    log_action(
        db, 
        user_id=current_user.id, 
        action="GENERATE_PAYROLL", 
        target_id=employee_id,
        ip=request.client.host
    )
    
    # Get employee info
    emp_user = db.query(models.User).filter(models.User.id == employee_id).first()
    
    return {
        "employee_id": employee_id,
        "employee_name": emp_user.full_name if emp_user else "Unknown",
        "month": datetime.utcnow().strftime("%B %Y"),
        "base_salary": base_salary,
        "total_days": total_days,
        "unpaid_days": unpaid_days,
        "calculations": result
    }

@app.get("/payroll/org-summary")
async def payroll_org_summary(
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Generate enterprise payroll summary for all employees in the org."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="No organization found")
    
    employees = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role == "employee"
    ).all()
    
    payroll_list = []
    total_gross = 0
    total_deductions = 0
    total_net = 0
    total_epf_employer = 0
    
    # Calculate current month date range for LOP/Attendance
    today = datetime.utcnow()
    _, last_day = calendar.monthrange(today.year, today.month)
    first_date = date(today.year, today.month, 1)
    last_date = date(today.year, today.month, last_day)
    total_days = last_day
    
    for emp in employees:
        # Salary Structure
        salary_info = db.query(models.SalaryStructure).filter(models.SalaryStructure.employee_id == emp.id).first()
        base_salary = salary_info.base_salary if salary_info else 50000.0  # Assume 50k base if not set
        annual_ctc = base_salary * 12
        
        # ── Smart Presence Integration: Calculate from real attendance ──
        month_attendance = db.query(models.Attendance).filter(
            models.Attendance.user_id == emp.id,
            models.Attendance.date >= first_date,
            models.Attendance.date <= last_date,
            models.Attendance.status == "approved"
        ).all()
        
        # Count distinct approved attendance days
        attended_dates = set()
        travel_allowance_days = 0
        overtime_count = 0
        for att in month_attendance:
            if att.date:
                attended_dates.add(att.date)
            # Travel Allowance: days at Client Site
            if att.work_mode == "Client Site":
                travel_allowance_days += 1
            # Overtime: count records flagged as overtime
            if att.overtime_flag:
                overtime_count += 1
        
        # LOP = working days in month - days attended (capped at 0 min)
        # Assume 22 standard working days per month
        standard_working_days = 22
        lop_days = max(standard_working_days - len(attended_dates), 0)
        # Cap LOP so net pay doesn't go negative for new employees with no attendance data
        if len(attended_dates) == 0:
            lop_days = 0  # No attendance records yet — assume full month
        
        # Overtime hours estimate: 2 hrs per overtime-flagged day
        overtime_hours = overtime_count * 2
        
        # Performance Bonus (Mocked integration with Performance Intelligence)
        performance_bonus = (emp.id % 5) * 2000  # Fake bonus
        
        # Calculate with Smart Presence data!
        result = calculate_monthly_payroll(
            annual_ctc=annual_ctc,
            total_days_in_month=total_days,
            lop_days=lop_days,
            tax_regime="new",  # Can be pulled from user tax declarations table
            performance_bonus=performance_bonus,
            month_name=today.strftime("%B %Y"),
            travel_allowance_days=travel_allowance_days,
            overtime_hours=overtime_hours,
        )
        
        payroll_entry = {
            "id": emp.id,
            "name": emp.full_name or emp.email.split("@")[0],
            "email": emp.email,
            "department": emp.department or "—",
            "job_title": emp.job_title or "Employee",
            
            # Key figures
            "annual_ctc": annual_ctc,
            "gross": result["earnings"]["gross"],
            "deductions": result["deductions"]["total"],
            "net": result["net_pay"],
            "epf_employee": result["deductions"]["epf_employee"],
            "tds": result["deductions"]["tds"],
            "professional_tax": result["deductions"]["professional_tax"],
            "lop_days": lop_days,
            "lop_deduction": result["deductions"]["lop_deduction"],
            "travel_allowance": result["earnings"].get("travel_allowance", 0),
            "overtime_pay": result["earnings"].get("overtime_pay", 0),
            "performance_bonus": performance_bonus,
            "total_rewards": result["net_pay"] + result["employer"]["epf_employer"], # Includes employer contributions
            "net_pay": result["net_pay"],
            "earnings": result["earnings"],
            "deductions_breakdown": result["deductions"],
            "employer": result["employer"]
        }
        
        payroll_list.append(payroll_entry)
        
        total_gross += result["earnings"]["gross"]
        total_deductions += result["deductions"]["total"]
        total_net += result["net_pay"]
        total_epf_employer += result["employer"]["epf_employer"]
        
    # Run Anomaly Detection
    anomalies = detect_anomalies(payroll_list, threshold_pct=40)
    
    return {
        "month": today.strftime("%B %Y"),
        "employee_count": len(payroll_list),
        "total_gross": round(total_gross, 2),
        "total_deductions": round(total_deductions, 2),
        "total_net": round(total_net, 2),
        "total_epf_employer": round(total_epf_employer, 2),
        "employees": payroll_list,
        "anomalies": anomalies,
        "compliance_status": "Verified" if not anomalies else "Review Required"
    }

@app.post("/performance/analyze")
async def analyze_performance(data: dict, db: Session = Depends(database.get_db)):
    feedback = data.get("feedback")
    
    prompt = f"""
    Analyze this employee feedback: "{feedback}"
    1. Summarize key strengths (3 points).
    2. Identify 1 area for improvement.
    3. Give a Sentiment Score (0.0 very negative to 1.0 very positive).
    Return ONLY JSON: {{'summary': '...', 'sentiment': 0.85}}
    """
    
    raw_ai_res = await get_ai_response(prompt)
    analysis = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
  
    return {
        "employee_id": data.get("employee_id"),
        "analysis": analysis
    }

@app.get("/rewards/equity-analysis/{role}")
async def analyze_pay_equity(role: str, db: Session = Depends(database.get_db)):
    
    salaries = [
        {"id": 1, "name": "Emp A", "salary": 5000, "level": "L2", "tenure": "2yrs"},
        {"id": 2, "name": "Emp B", "salary": 4200, "level": "L2", "tenure": "3yrs"},
        {"id": 3, "name": "Emp C", "salary": 5100, "level": "L2", "tenure": "1yr"},
    ]
    
    
    prompt = f"""
    Analyze these salaries for the role '{role}': {json.dumps(salaries)}
    Identify any employee who is underpaid relative to their level and tenure.
    Suggest a 'Fair Market Adjustment'.
    Return ONLY JSON: {{'analysis': '...', 'outliers': [...]}}
    """
    
    raw_ai_res = await get_ai_response(prompt)
    analysis = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    return analysis

@app.get("/succession/analyze/{employee_id}")
async def analyze_succession(employee_id: int, db: Session = Depends(database.get_db)):
    
    prompt = f"""
    Employee ID {employee_id} has:
    - Sentiment Score: 0.4 (Decreasing)
    - Salary Gap: 12% below market
    - Performance: High
    
    Predict if they are a 'Flight Risk'. 
    Categorize them into a 9-Box Grid (X: Performance 1-3, Y: Potential 1-3).
    Return ONLY JSON: {{'flight_risk': true, 'grid_pos': [3, 2], 'reasoning': '...'}}
    """
    
    raw_ai_res = await get_ai_response(prompt)
    analysis = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    return analysis

@app.get("/learning/skill-gap/{employee_id}")
async def analyze_skill_gap(employee_id: int, db: Session = Depends(database.get_db)):
    
    current_skills = {"Python": 7, "React": 5, "FastAPI": 4}
    target_role_skills = {"Python": 9, "React": 8, "FastAPI": 8, "Docker": 7}
    
    prompt = f"""
    Compare Current: {current_skills} vs Target: {target_role_skills}.
    Identify the 3 biggest 'Gaps'. 
    For each gap, explain WHY it matters for a promotion.
    Return ONLY JSON: {{'gaps': [{{'skill': 'React', 'diff': 3, 'reason': '...'}}, ...]}}
    """
    
    raw_ai_res = await get_ai_response(prompt)
    gap_analysis = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    return gap_analysis

@app.post("/learning/generate-roadmap")
async def generate_roadmap(data: dict):
    skill = data.get("skill")
    current_level = data.get("current_level")
    target_level = data.get("target_level")
    
    prompt = f"""
    Create a 30-day technical learning roadmap for an employee to move from level {current_level} to {target_level} in {skill}.
    Divide it into 4 weeks. 
    For each week, provide:
    1. A focus topic.
    2. A specific 'Hands-on Project' task.
    3. The type of resource to look for (e.g., 'Advanced FastAPI Middleware docs').
    Return ONLY JSON: {{'roadmap': [{{'week': 1, 'topic': '...', 'project': '...', 'resource': '...'}}, ...]}}
    """
    
    raw_ai_res = await get_ai_response(prompt)
    roadmap = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    return roadmap

@app.get("/mobility/match-jobs/{employee_id}")
async def match_internal_jobs(employee_id: int, db: Session = Depends(database.get_db)):
   
    user_skills = {"Python": 8, "FastAPI": 7, "Docker": 6}
    jobs = [
        {"title": "Lead Backend", "req": {"Python": 9, "FastAPI": 9, "Docker": 8}},
        {"title": "Senior Engineer", "req": {"Python": 8, "FastAPI": 7, "Docker": 5}}
    ]
    
    prompt = f"""
    Compare User Skills: {user_skills} with these Jobs: {jobs}.
    Calculate a 'Match Percentage' for each job.
    Identify 'Missing Skills' for the top match.
    Return ONLY JSON: [{{'job': '...', 'match_pct': 85, 'gap': '...'}}, ...]
    """
    
    raw_ai_res = await get_ai_response(prompt)
    matches = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    return matches

@app.get("/culture/vibe-check/{dept}")
async def department_vibe_check(dept: str, db: Session = Depends(database.get_db)):
    
    responses = [
        "I feel the deadlines are getting a bit tight lately.",
        "Team spirit is high, but we need better documentation tools.",
        "Management communication has been unclear this week."
    ]
    
    prompt = f"""
    Analyze these anonymous employee comments for the {dept} department: {responses}
    1. Identify the 'Collective Mood' (1 word).
    2. List the 'Top Concern'.
    3. Suggest a 'Manager Action Item'.
    Return ONLY JSON: {{'mood': 'Stressed', 'concern': 'Deadlines', 'action': '...'}}
    """
    
    raw_ai_res = await get_ai_response(prompt)
    culture_analysis = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    return culture_analysis


# Old /culture/report-grievance endpoint removed — superseded by Smart Presence version below

@app.get("/culture/predict-hotspots")
async def predict_hotspots(
    user: models.User = Depends(role_required("admin")), 
    db: Session = Depends(database.get_db)
):
    stats = [
        {"dept": "Engineering", "overtime_hrs": 45, "sentiment": 0.4, "vacation_balance": "high"},
        {"dept": "Sales", "overtime_hrs": 12, "sentiment": 0.8, "vacation_balance": "low"},
        {"dept": "Product", "overtime_hrs": 25, "sentiment": 0.6, "vacation_balance": "med"}
    ]
    
    prompt = f"""
    Analyze these departmental stats: {json.dumps(stats)}
    Which department is at highest risk of BURNOUT? 
    Give a 'Risk Score' (0-100) and a 1-sentence 'Prevention Strategy'.
    Return ONLY JSON: {{'hotspots': [{{'dept': '...', 'score': 85, 'strategy': '...'}}, ...]}}
    """
    
    raw_ai_res = await get_ai_response(prompt)
    prediction = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    return prediction  

@app.get("/hr/employees")
async def get_all_employees(db: Session = Depends(database.get_db)):
    
    return db.query(models.Employee).options(joinedload(models.Employee.user)).all()

@app.post("/auth/setup-org")
async def setup_organization(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Check if org name is taken
    existing_org = db.query(models.Organization).filter(models.Organization.name == data['org_name']).first()
    if existing_org:
        raise HTTPException(status_code=400, detail="Organization name already taken")

    # Create new organization
    new_org = models.Organization(name=data['org_name'], subscription_plan="free")
    db.add(new_org)
    db.commit()
    db.refresh(new_org)

    # Link the current user to this new organization and make them admin
    current_user.organization_id = new_org.id
    current_user.role = "admin"
    db.commit()
    db.refresh(current_user)

    # Issue a new token with the updated org_id and role
    access_token = auth.create_access_token(data={"sub": current_user.email, "role": current_user.role, "org_id": current_user.organization_id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "org_id": new_org.id,
        "user": {"email": current_user.email, "role": current_user.role}
    }

@app.post("/org/add-employee")
async def add_employee(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Org admin adds an employee by email. Creates a User with role='employee' and links to org."""
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(status_code=403, detail="Only organization admins can add employees")
    
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="You must belong to an organization first")
    
    emp_email = data.get("email")
    emp_name = data.get("full_name", emp_email.split("@")[0])
    
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == emp_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="This email is already registered")
    
    # Create user with employee role, no password yet
    new_user = models.User(
        email=emp_email,
        full_name=emp_name,
        hashed_password=None,
        role="employee",
        organization_id=current_user.organization_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Also create the Employee record
    new_emp = models.Employee(
        user_id=new_user.id,
        org_id=current_user.organization_id,
        employee_id=f"EMP-{new_user.id}",
        department=data.get("department", "Default"),
        designation=data.get("designation", "Staff")
    )
    db.add(new_emp)
    db.commit()
    
    return {"message": f"Employee {emp_email} added successfully", "employee_id": new_user.id}

@app.post("/auth/employee-setup")
async def employee_setup_password(data: dict, db: Session = Depends(database.get_db)):
    """Employee sets their password for first-time login. Only works if they were pre-added by org admin."""
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found. Your organization must add you first.")
    
    if user.role != "employee":
        raise HTTPException(status_code=400, detail="This endpoint is for employees only")
    
    if user.hashed_password:
        raise HTTPException(status_code=400, detail="Password already set. Please use the login form.")
    
    user.hashed_password = auth.get_password_hash(password)
    db.commit()
    db.refresh(user)
    
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role, "org_id": user.organization_id})
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email, "role": user.role}}

@app.get("/employee/onboarding-status")
async def get_onboarding_status(current_user: models.User = Depends(auth.get_current_user)):
    """Check if employee has completed onboarding."""
    return {
        "onboarding_completed": current_user.onboarding_completed or False,
        "full_name": current_user.full_name,
        "email": current_user.email,
    }

@app.post("/employee/onboarding")
async def submit_onboarding(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Employee submits their onboarding form."""
    if current_user.role != "employee":
        raise HTTPException(status_code=403, detail="Only employees can submit onboarding")
    
    # Update all onboarding fields
    current_user.employee_code = data.get("employee_code", "").strip() or None
    current_user.job_title = data.get("job_title", "").strip() or None
    current_user.department = data.get("department", "").strip() or None
    current_user.reporting_manager = data.get("reporting_manager", "").strip() or None
    current_user.employment_type = data.get("employment_type", "").strip() or None
    current_user.work_location = data.get("work_location", "").strip() or None
    current_user.pan_number = data.get("pan_number", "").strip() or None
    current_user.aadhaar_number = data.get("aadhaar_number", "").strip() or None
    current_user.bank_account = data.get("bank_account", "").strip() or None
    current_user.bank_ifsc = data.get("bank_ifsc", "").strip() or None
    current_user.phone_number = data.get("phone_number", "").strip() or None
    current_user.emergency_contact_name = data.get("emergency_contact_name", "").strip() or None
    current_user.emergency_contact_phone = data.get("emergency_contact_phone", "").strip() or None
    current_user.personal_email = data.get("personal_email", "").strip() or None
    
    # Parse date_of_joining
    doj = data.get("date_of_joining", "").strip()
    if doj:
        try:
            current_user.date_of_joining = datetime.strptime(doj, "%Y-%m-%d").date()
        except ValueError:
            pass
    
    current_user.onboarding_completed = True
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Onboarding completed successfully"}

@app.get("/employee/onboarding-data")
async def get_onboarding_data(current_user: models.User = Depends(auth.get_current_user)):
    """Get employee's own onboarding data (for pre-filling the form)."""
    return {
        "employee_code": current_user.employee_code or "",
        "job_title": current_user.job_title or "",
        "department": current_user.department or "",
        "date_of_joining": str(current_user.date_of_joining) if current_user.date_of_joining else "",
        "reporting_manager": current_user.reporting_manager or "",
        "employment_type": current_user.employment_type or "",
        "work_location": current_user.work_location or "",
        "pan_number": current_user.pan_number or "",
        "aadhaar_number": current_user.aadhaar_number or "",
        "bank_account": current_user.bank_account or "",
        "bank_ifsc": current_user.bank_ifsc or "",
        "phone_number": current_user.phone_number or "",
        "emergency_contact_name": current_user.emergency_contact_name or "",
        "emergency_contact_phone": current_user.emergency_contact_phone or "",
        "personal_email": current_user.personal_email or "",
        "onboarding_completed": current_user.onboarding_completed or False,
    }

@app.get("/org/employees")
async def list_org_employees(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """List all employees in the current user's organization with onboarding details."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    employees = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role == "employee"
    ).all()
    
    return [{
        "id": e.id,
        "email": e.email,
        "full_name": e.full_name,
        "has_password": e.hashed_password is not None,
        "onboarding_completed": e.onboarding_completed or False,
        "employee_code": e.employee_code,
        "job_title": e.job_title,
        "department": e.department,
        "date_of_joining": str(e.date_of_joining) if e.date_of_joining else None,
        "reporting_manager": e.reporting_manager,
        "employment_type": e.employment_type,
        "work_location": e.work_location,
        "pan_number": e.pan_number,
        "aadhaar_number": e.aadhaar_number,
        "bank_account": e.bank_account,
        "bank_ifsc": e.bank_ifsc,
        "phone_number": e.phone_number,
        "emergency_contact_name": e.emergency_contact_name,
        "emergency_contact_phone": e.emergency_contact_phone,
        "personal_email": e.personal_email,
    } for e in employees]

from pydantic import BaseModel

class AttendancePunchBase(BaseModel):
    lat: float = None
    lon: float = None
    work_mode: str = "Office"
    device_id: str = None
    mood: str = None
    daily_goal: str = None
    is_offline_sync: bool = False

@app.post("/attendance/punch")
async def punch_attendance(
    data: AttendancePunchBase,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(status_code=400, detail="Only employees can punch attendance")
        
    from datetime import datetime, date
    today = datetime.utcnow().date()
    
    # Check if already punched in today
    existing = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.date == today
    ).first()
    
    if existing:
        if not existing.check_out:
            existing.check_out = datetime.utcnow()
            db.commit()
            return {"status": "Checked Out", "record_id": existing.id}
        else:
            raise HTTPException(status_code=400, detail="Already completed attendance for today")
            
    # Anomaly Detection: Impossible Travel
    anomaly_flag = None
    yesterday = today - __import__('datetime').timedelta(days=1)
    prev_att = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.date == yesterday
    ).first()
    
    if prev_att and prev_att.latitude and prev_att.longitude and data.lat and data.lon:
        # Simple heuristic: If distance is too large, flag it
        dist = ((prev_att.latitude - data.lat)**2 + (prev_att.longitude - data.lon)**2)**0.5
        if dist > 5.0: # Roughly 500km depending on latitude
            anomaly_flag = "Impossible Travel Detected"

    # LOP Calculation (If after 10 AM, flag as late)
    now_hour = datetime.utcnow().hour
    overtime_flag = False # Will be updated on checkout

    new_att = models.Attendance(
        user_id=current_user.id,
        check_in=datetime.utcnow(),
        latitude=data.lat,
        longitude=data.lon,
        status="approved" if not anomaly_flag else "flagged",
        date=today,
        work_mode=data.work_mode,
        device_id=data.device_id,
        mood=data.mood,
        daily_goal=data.daily_goal,
        is_offline_sync=data.is_offline_sync,
        anomaly_flag=anomaly_flag,
        overtime_flag=overtime_flag
    )
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    
    message = "Punch-in recorded successfully."
    if anomaly_flag:
        message += " " + anomaly_flag
        
    return {"status": "Checked In", "record_id": new_att.id, "message": message}



@app.get("/attendance/my-records")
async def my_attendance(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    records = db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id).order_by(models.Attendance.date.desc()).all()
    return [{
        "id": r.id, 
        "check_in": r.check_in, 
        "check_out": r.check_out, 
        "status": r.status, 
        "date": r.date.strftime("%Y-%m-%d") if r.date else None,
        "work_mode": r.work_mode,
        "mood": r.mood,
        "daily_goal": r.daily_goal,
        "anomaly_flag": r.anomaly_flag
    } for r in records]

@app.get("/org/attendance/pending")
async def pending_attendance(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view pending attendance")
    
    # Explicit onclause needed because Attendance has 2 FKs to users (user_id + approved_by)
    records = db.query(models.Attendance).join(
        models.User, models.Attendance.user_id == models.User.id
    ).filter(
        models.User.organization_id == current_user.organization_id,
        models.Attendance.status == "pending"
    ).all()
    
    # Fetch user info separately to avoid relationship issues
    result = []
    for r in records:
        emp = db.query(models.User).filter(models.User.id == r.user_id).first()
        result.append({
            "id": r.id, 
            "employee_name": emp.full_name if emp else "Unknown",
            "employee_email": emp.email if emp else "",
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "date": r.date.isoformat() if r.date else None
        })
    return result

@app.get("/org/attendance/all")
async def all_org_attendance(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view attendance records")

    records = db.query(models.Attendance).join(
        models.User, models.Attendance.user_id == models.User.id
    ).filter(
        models.User.organization_id == current_user.organization_id
    ).order_by(models.Attendance.date.desc()).all()

    result = []
    for r in records:
        emp = db.query(models.User).filter(models.User.id == r.user_id).first()
        res = {
            "id": r.id,
            "employee_name": emp.full_name if emp else "Unknown",
            "employee_email": emp.email if emp else "",
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "date": r.date.strftime("%Y-%m-%d") if r.date else None,
            "status": r.status,
            "work_mode": r.work_mode,
            "mood": r.mood,
            "daily_goal": r.daily_goal,
            "anomaly_flag": r.anomaly_flag,
            "overtime_flag": r.overtime_flag
        }
        result.append(res)
    return result

@app.post("/org/attendance/{record_id}/approve")
async def approve_attendance(record_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can approve attendance")
        
    record = db.query(models.Attendance).filter(models.Attendance.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    from datetime import datetime
    record.status = "approved"
    record.approved_by = current_user.id
    record.approved_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Attendance approved"}

@app.post("/org/attendance/{record_id}/reject")
async def reject_attendance(record_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can reject attendance")
        
    record = db.query(models.Attendance).filter(models.Attendance.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
        
    from datetime import datetime
    record.status = "rejected"
    record.approved_by = current_user.id
    record.approved_at = datetime.utcnow()
    db.commit()
    return {"status": "success", "message": "Attendance rejected"}


# --- INTERNAL CAREERS ---

@app.post("/org/jobs")
async def create_internal_job(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can post internal jobs")
    
    new_job = models.InternalJob(
        org_id=current_user.organization_id,
        title=data.get("title", ""),
        department=data.get("department", ""),
        description=data.get("description", ""),
        location=data.get("location", ""),
        package=data.get("package", ""),
        attachment_url=data.get("attachment_url", ""),
        required_skills=json.dumps(data.get("required_skills", {})) if data.get("required_skills") else None,
        experience_level=data.get("experience_level", ""),
        job_type=data.get("job_type", "full_time"),
        status="open"
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return {"message": "Job posted successfully", "job_id": new_job.id}

@app.get("/org/jobs")
async def list_org_jobs(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view these jobs")
    
    jobs = db.query(models.InternalJob).filter(
        models.InternalJob.org_id == current_user.organization_id
    ).order_by(models.InternalJob.id.desc()).all()
    
    return [
        {
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "description": j.description,
            "location": j.location,
            "package": j.package,
            "attachment_url": j.attachment_url,
            "status": j.status,
            "posted_at": j.posted_at.isoformat() if j.posted_at else None,
            "required_skills": json.loads(j.required_skills) if j.required_skills else {},
            "experience_level": j.experience_level,
            "job_type": j.job_type or "full_time"
        } for j in jobs
    ]

@app.get("/employee/jobs")
async def list_employee_jobs(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role != "employee":
        raise HTTPException(status_code=400, detail="Only employees can view open roles")
        
    jobs = db.query(models.InternalJob).filter(
        models.InternalJob.org_id == current_user.organization_id,
        models.InternalJob.status == "open"
    ).order_by(models.InternalJob.id.desc()).all()
    
    return [
        {
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "description": j.description,
            "location": j.location,
            "package": j.package,
            "attachment_url": j.attachment_url,
            "job_type": j.job_type or "full_time",
            "required_skills": json.loads(j.required_skills) if j.required_skills else {},
            "experience_level": j.experience_level,
            "posted_at": j.posted_at.isoformat() if j.posted_at else None
        } for j in jobs
    ]

@app.post("/employee/jobs/{job_id}/apply")
async def apply_internal_job(
    job_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role != "employee":
        raise HTTPException(status_code=400, detail="Only employees can apply")
        
    job = db.query(models.InternalJob).filter(models.InternalJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    existing = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job.id,
        models.InternalJobApplication.employee_id == current_user.id
    ).first()
    if existing:
        if existing.status == "Error parsing resume":
            db.delete(existing)
            db.commit()
        else:
            raise HTTPException(status_code=400, detail="Already applied to this job")

    from .parser import extract_text_from_file
    content = await file.read()
    print(f"DEBUG: Read file {file.filename}, length={len(content)}")
    raw_text = extract_text_from_file(content, file.filename)
    print(f"DEBUG: Extracted text length={len(raw_text)}")
    
    if not raw_text:
        print("DEBUG: No text extracted from resume")
        # Create a record anyway but with error
        new_app = models.InternalJobApplication(
            job_id=job_id,
            employee_id=current_user.id,
            resume_url=file.filename,
            status="Error parsing resume",
            match_score=0
        )
        db.add(new_app)
        db.commit()
        return {"status": "Error parsing resume"}

    try:
        print("DEBUG: Starting AI evaluation...")
        from .ai_engine import evaluate_internal_candidate
        evaluation = await evaluate_internal_candidate(raw_text, f"Title: {job.title}\nDesc: {job.description}\nPackage: {job.package}\nLocation: {job.location}")
        print(f"DEBUG: AI Eval Result: {evaluation}")
        new_app = models.InternalJobApplication(
            job_id=job_id,
            employee_id=current_user.id,
            resume_url=file.filename,
            status=evaluation.get("status", "Qualified"),
            match_score=evaluation.get("score", 0),
            ai_reasoning=evaluation.get("reasoning", "")
        )
        db.add(new_app)
        db.commit()
        return evaluation
    except Exception as e:
        print(f"DEBUG: AI Eval Endpoint Exception: {e}")
        new_app = models.InternalJobApplication(
            job_id=job_id,
            employee_id=current_user.id,
            resume_url=file.filename,
            status="Error parsing resume",
            match_score=0
        )
        db.add(new_app)
        db.commit()
        return {"error": str(e), "status": "Error parsing resume"}

@app.get("/employee/jobs/{job_id}/application")
async def get_my_application(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    app_record = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job_id,
        models.InternalJobApplication.employee_id == current_user.id
    ).first()
    
    if not app_record:
        return {"applied": False}
    
    return {
        "applied": True,
        "status": app_record.status,
        "match_score": app_record.match_score,
        "applied_at": app_record.applied_at.isoformat() if app_record.applied_at else None
    }

@app.get("/org/jobs/{job_id}/applications")
async def get_job_applications(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view these")
        
    apps = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job_id
    ).order_by(models.InternalJobApplication.id.desc()).all()
    
    results = []
    for a in apps:
        emp = db.query(models.User).filter(models.User.id == a.employee_id).first()
        results.append({
            "id": a.id,
            "employee_id": a.employee_id,
            "employee_name": emp.full_name if emp else "Unknown",
            "resume_url": a.resume_url,
            "status": a.status,
            "match_score": a.match_score,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None
        })
    return results

@app.post("/employee/jobs/{job_id}/start-interview")
async def start_internal_interview(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    app_record = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job_id,
        models.InternalJobApplication.employee_id == current_user.id
    ).first()
    
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app_record.status = "AI Interview In Progress"
    db.commit()
    return {"status": app_record.status}

@app.get("/employee/pending-interviews")
async def get_pending_interviews(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    apps = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.employee_id == current_user.id,
        models.InternalJobApplication.status.in_(["Qualified for AI Interview", "qualified_for_interview", "AI Interview In Progress"])
    ).all()
    
    results = []
    for a in apps:
        job = db.query(models.InternalJob).filter(models.InternalJob.id == a.job_id).first()
        if job:
            results.append({
                "application_id": a.id,
                "job_id": job.id,
                "job_title": job.title,
                "job_description": job.description,
                "status": a.status
            })
    return results

@app.post("/employee/transcribe-audio")
async def transcribe_audio_endpoint(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    """Transcribe audio for browsers that don't support Web Speech API."""
    audio_bytes = await file.read()
    if len(audio_bytes) < 100:
        return {"text": ""}
    
    # Determine mime type from the uploaded file
    mime_type = file.content_type or "audio/webm"
    
    from .ai_engine import transcribe_audio
    text = await transcribe_audio(audio_bytes, mime_type)
    return {"text": text}

@app.get("/employee/interview/{job_id}/generate-questions")
async def get_interview_questions(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    job = db.query(models.InternalJob).filter(models.InternalJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Mark interview as in progress
    app_record = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job_id,
        models.InternalJobApplication.employee_id == current_user.id
    ).first()
    if app_record:
        app_record.status = "AI Interview In Progress"
        db.commit()
        
    from .ai_engine import generate_interview_questions
    questions = await generate_interview_questions(job.title, job.description)
    return {"questions": questions}

@app.post("/employee/jobs/{job_id}/adaptive-question")
async def get_adaptive_question(job_id: int, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    payload = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    answers = payload.get("previous_answers", [])
    
    job = db.query(models.InternalJob).filter(models.InternalJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    try:
        from .ai_engine import generate_adaptive_questions
        # determine difficulty based on how many questions asked so far
        difficulty = "medium"
        if len(answers) >= 2:
            difficulty = "hard"
        if len(answers) >= 4:
            difficulty = "expert"
            
        next_q = await generate_adaptive_questions(job.title, job.description, answers, difficulty)
        return next_q
    except Exception as e:
        print(f"[main] Adaptive question failed: {e}")
        return {"question": "Could you provide more details about your experience in this area?", "difficulty": "medium"}

@app.post("/employee/jobs/{job_id}/finish-interview")
async def finish_internal_interview(job_id: int, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    payload = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    
    app_record = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job_id,
        models.InternalJobApplication.employee_id == current_user.id
    ).first()
    
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    job = db.query(models.InternalJob).filter(models.InternalJob.id == job_id).first()
    
    # Save the Q&A pairs
    answers = payload.get("answers", []) if payload else []
    app_record.interview_answers = json.dumps(answers)
    app_record.status = "AI Interview Completed"
    db.commit()
    
    # Run AI evaluation in background-ish manner
    if answers and job:
        try:
            from .ai_engine import evaluate_interview_performance
            evaluation = await evaluate_interview_performance(job.title, job.description, answers)
            app_record.interview_evaluation = json.dumps(evaluation)
            app_record.interview_result = evaluation.get("recommendation", "Pending Review")
            db.commit()
            
            # Run advanced AI analysis pipeline
            try:
                # 1. Competency Spider Chart
                competency = await generate_competency_spider(job.title, job.description, answers)
                app_record.competency_scores = json.dumps(competency)
                
                # 2. Soft-Skill Feedback
                soft_skills = await analyze_soft_skills(answers)
                app_record.soft_skill_feedback = json.dumps(soft_skills)
                
                # 3. Sentiment & Integrity Analysis
                sentiment = await analyze_sentiment_integrity(answers)
                app_record.sentiment_analysis = json.dumps(sentiment)
                
                db.commit()
                
                # 4. Auto-add to Pre-Qualified Talent Pool if recommended
                if app_record.interview_result == "Recommended":
                    existing_pool = db.query(models.PreQualifiedPool).filter(
                        models.PreQualifiedPool.employee_id == current_user.id,
                        models.PreQualifiedPool.original_job_id == job_id
                    ).first()
                    
                    if not existing_pool:
                        pool_entry = models.PreQualifiedPool(
                            employee_id=current_user.id,
                            original_job_id=job_id,
                            application_id=app_record.id,
                            org_id=current_user.organization_id,
                            interview_score=evaluation.get("score", 0),
                            competency_scores=app_record.competency_scores,
                            matched_skills=current_user.skills_profile,
                            status="available"
                        )
                        db.add(pool_entry)
                        app_record.is_prequalified = True
                        app_record.prequalified_at = datetime.utcnow()
                        db.commit()
                        print(f"[main] Employee {current_user.id} added to pre-qualified pool")
                        
            except Exception as adv_e:
                print(f"[main] Advanced analysis partially failed: {adv_e}")
                db.commit()
                
        except Exception as e:
            print(f"[main] Interview evaluation failed: {e}")
            app_record.interview_result = "Pending Review"
            db.commit()
    
    return {"status": app_record.status, "result": app_record.interview_result}

@app.get("/employee/dream-roles")
async def get_dream_roles(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    try:
        roles = json.loads(current_user.dream_roles) if current_user.dream_roles else []
    except:
        roles = []
    
    if not roles:
        return {"paths": []}
        
    from .ai_engine import generate_dream_role_paths
    paths = await generate_dream_role_paths(current_user.skills_profile, roles)
    return paths

@app.get("/org/prequalified-pool")
async def get_prequalified_pool(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view this")
        
    pool = db.query(models.PreQualifiedPool).filter(
        models.PreQualifiedPool.org_id == current_user.organization_id
    ).all()
    
    results = []
    for p in pool:
        emp = db.query(models.User).filter(models.User.id == p.employee_id).first()
        results.append({
            "id": p.id,
            "employee_id": p.employee_id,
            "employee_name": emp.full_name if emp else "Unknown",
            "current_role": emp.role,
            "interview_score": p.interview_score,
            "competency_scores": p.competency_scores,
            "status": p.status,
            "added_at": p.added_at.isoformat() if p.added_at else None
        })
    return results

@app.get("/org/mobility-analytics")
async def get_mobility_analytics(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view this")
    
    # Very basic analytics mapping to return to the UI
    # In a full system this would aggregate actual transfers
    return {
        "top_exporter": "Customer Support",
        "top_importer": "Product Mgmt",
        "flight_risk": "Engineering (Mid)",
        "heatmap_data": [
            {"source": "Engineering", "dest": "Product", "value": 12},
            {"source": "Support", "dest": "Sales", "value": 24},
            {"source": "Marketing", "dest": "Design", "value": 8}
        ],
        "cohort_analysis": [
            {"period": "Q1", "turnover": 4.2, "internal_movement": 1.5},
            {"period": "Q2", "turnover": 3.8, "internal_movement": 2.1},
            {"period": "Q3", "turnover": 3.1, "internal_movement": 3.4},
            {"period": "Q4", "turnover": 2.5, "internal_movement": 4.8}
        ]
    }


# --- ADVANCED MARKETPLACE: Skill Profile & Dream Roles ---

@app.get("/employee/skill-profile")
async def get_skill_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get employee's skill profile and dream roles."""
    skills = {}
    dream = []
    try:
        if current_user.skills_profile:
            skills = json.loads(current_user.skills_profile)
        if current_user.dream_roles:
            dream = json.loads(current_user.dream_roles)
    except:
        pass
    return {
        "skills": skills,
        "dream_roles": dream,
        "career_note": current_user.career_aspiration_note or "",
        "current_role": current_user.job_title or "",
        "department": current_user.department or ""
    }

@app.post("/employee/skill-profile")
async def update_skill_profile(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Update employee's skill profile."""
    if "skills" in data:
        current_user.skills_profile = json.dumps(data["skills"])
    if "dream_roles" in data:
        current_user.dream_roles = json.dumps(data["dream_roles"])
    if "career_note" in data:
        current_user.career_aspiration_note = data["career_note"]
    db.commit()
    return {"message": "Skill profile updated"}

@app.get("/employee/dream-role-paths")
async def get_dream_role_paths(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get AI-generated learning paths for dream roles."""
    skills = {}
    dream = []
    try:
        if current_user.skills_profile:
            skills = json.loads(current_user.skills_profile)
        if current_user.dream_roles:
            dream = json.loads(current_user.dream_roles)
    except:
        pass
    if not dream:
        return {"paths": []}
    
    paths = await generate_dream_role_paths(skills, dream, current_user.job_title or "")
    return paths

@app.get("/employee/jobs-with-match")
async def list_jobs_with_match(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """List all jobs with real-time skill match percentage for the employee."""
    if current_user.role != "employee":
        raise HTTPException(status_code=400, detail="Only employees can view this")
    
    jobs = db.query(models.InternalJob).filter(
        models.InternalJob.org_id == current_user.organization_id,
        models.InternalJob.status == "open"
    ).order_by(models.InternalJob.id.desc()).all()
    
    employee_skills = {}
    try:
        if current_user.skills_profile:
            employee_skills = json.loads(current_user.skills_profile)
    except:
        pass
    
    results = []
    for j in jobs:
        job_skills = {}
        try:
            if j.required_skills:
                job_skills = json.loads(j.required_skills)
        except:
            pass
        
        # Calculate match
        match_data = {"match_pct": 0, "gaps": [], "strengths": [], "learning_priority": []}
        if employee_skills and job_skills:
            match_data = await calculate_skill_match(employee_skills, job_skills)
        
        # Check if already applied
        existing_app = db.query(models.InternalJobApplication).filter(
            models.InternalJobApplication.job_id == j.id,
            models.InternalJobApplication.employee_id == current_user.id
        ).first()
        
        results.append({
            "id": j.id,
            "title": j.title,
            "department": j.department,
            "description": j.description,
            "location": j.location,
            "package": j.package,
            "posted_at": j.posted_at.isoformat() if j.posted_at else None,
            "required_skills": job_skills,
            "experience_level": j.experience_level,
            "job_type": j.job_type or "full_time",
            "gig_duration": j.gig_duration,
            "skill_match_pct": match_data.get("match_pct", 0),
            "skill_gaps": match_data.get("gaps", []),
            "skill_strengths": match_data.get("strengths", []),
            "learning_priority": match_data.get("learning_priority", []),
            "already_applied": existing_app is not None,
            "application_status": existing_app.status if existing_app else None
        })
    
    # Sort by match percentage descending
    results.sort(key=lambda x: x["skill_match_pct"], reverse=True)
    return results

@app.post("/employee/generate-ai-resume/{job_id}")
async def generate_ai_resume_endpoint(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Generate an AI-powered internal resume for a specific job."""
    job = db.query(models.InternalJob).filter(models.InternalJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    employee_data = {
        "name": current_user.full_name,
        "current_role": current_user.job_title or "Employee",
        "department": current_user.department or "General",
        "skills": json.loads(current_user.skills_profile) if current_user.skills_profile else {},
        "tenure": str(current_user.date_of_joining) if current_user.date_of_joining else "N/A",
        "email": current_user.email
    }
    
    job_data = {
        "title": job.title,
        "department": job.department,
        "description": job.description,
        "required_skills": json.loads(job.required_skills) if job.required_skills else {},
        "experience_level": job.experience_level or "Not specified"
    }
    
    resume = await generate_ai_resume(employee_data, job_data)
    return resume

# --- ADVANCED MARKETPLACE: Micro-Gigs & Shadowing ---

@app.post("/org/micro-gigs")
async def create_micro_gig(data: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Create a micro-gig or shadowing opportunity."""
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can create micro-gigs")
    
    new_gig = models.InternalJob(
        org_id=current_user.organization_id,
        title=data.get("title", ""),
        department=data.get("department", ""),
        description=data.get("description", ""),
        location=data.get("location", ""),
        package=data.get("package", ""),
        job_type=data.get("job_type", "micro_gig"),
        gig_duration=data.get("gig_duration", "1 week"),
        gig_department=data.get("gig_department", ""),
        required_skills=json.dumps(data.get("required_skills", {})) if data.get("required_skills") else None,
        status="open"
    )
    db.add(new_gig)
    db.commit()
    return {"message": "Micro-gig created", "id": new_gig.id}

@app.get("/employee/micro-gigs")
async def list_micro_gigs(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """List all micro-gigs and shadowing opportunities."""
    gigs = db.query(models.InternalJob).filter(
        models.InternalJob.org_id == current_user.organization_id,
        models.InternalJob.status == "open",
        models.InternalJob.job_type.in_(["micro_gig", "shadowing"])
    ).order_by(models.InternalJob.id.desc()).all()
    
    return [{
        "id": g.id, "title": g.title, "department": g.department,
        "description": g.description, "location": g.location,
        "job_type": g.job_type, "gig_duration": g.gig_duration,
        "gig_department": g.gig_department,
        "posted_at": g.posted_at.isoformat() if g.posted_at else None
    } for g in gigs]

# --- ADVANCED INTERVIEW: Practice Mode ---

@app.post("/employee/practice-interview/{job_id}")
async def start_practice_interview(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Start a practice (sandbox) interview — not scored."""
    job = db.query(models.InternalJob).filter(models.InternalJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    from .ai_engine import generate_interview_questions
    questions = await generate_interview_questions(job.title, job.description)
    return {"questions": questions, "mode": "practice", "job_title": job.title}

@app.post("/employee/practice-interview/{job_id}/evaluate")
async def evaluate_practice_interview(job_id: int, request: Request, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Evaluate a practice interview and return soft-skill feedback (no record saved)."""
    payload = await request.json()
    answers = payload.get("answers", [])
    
    job = db.query(models.InternalJob).filter(models.InternalJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Run soft-skill analysis
    soft_skills = await analyze_soft_skills(answers)
    
    # Run a lightweight evaluation
    from .ai_engine import evaluate_interview_performance
    evaluation = await evaluate_interview_performance(job.title, job.description, answers)
    
    return {
        "mode": "practice",
        "soft_skill_feedback": soft_skills,
        "evaluation": evaluation,
        "message": "This was a practice session. No record has been saved. Use these insights to improve!"
    }

# --- ADVANCED INTERVIEW: Soft-Skill Feedback ---

@app.get("/employee/interview-feedback/{job_id}")
async def get_interview_feedback(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get soft-skill feedback for a completed interview."""
    app_record = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job_id,
        models.InternalJobApplication.employee_id == current_user.id,
        models.InternalJobApplication.interview_mode == "scored"
    ).first()
    
    if not app_record:
        raise HTTPException(status_code=404, detail="No completed interview found")
    
    feedback = None
    if app_record.soft_skill_feedback:
        try:
            feedback = json.loads(app_record.soft_skill_feedback)
        except:
            pass
    
    return {
        "job_id": job_id,
        "has_feedback": feedback is not None,
        "soft_skill_feedback": feedback,
        "interview_result": app_record.interview_result
    }

# --- ORG: Strategic Talent Analytics ---

@app.get("/org/talent-analytics")
async def get_talent_analytics(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get succession risk alerts, cost analysis, and diversity heatmap."""
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    org_id = current_user.organization_id
    
    # 1. Succession Risk Alerts: Find departments with critical skill gaps if key employees move
    employees = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == "employee"
    ).all()
    
    active_apps = db.query(models.InternalJobApplication).join(
        models.InternalJob, models.InternalJobApplication.job_id == models.InternalJob.id
    ).filter(models.InternalJob.org_id == org_id).all()
    
    # Build department headcount
    dept_counts = {}
    for emp in employees:
        dept = emp.department or "General"
        dept_counts[dept] = dept_counts.get(dept, 0) + 1
    
    # Find applicants from small teams
    risk_alerts = []
    for app in active_apps:
        emp = db.query(models.User).filter(models.User.id == app.employee_id).first()
        if emp:
            dept = emp.department or "General"
            count = dept_counts.get(dept, 1)
            if count <= 3:
                risk_alerts.append({
                    "employee_name": emp.full_name,
                    "department": dept,
                    "team_size": count,
                    "risk_level": "Critical" if count <= 2 else "High",
                    "message": f"Moving {emp.full_name} from {dept} (team of {count}) could cause a critical skill gap"
                })
    
    # 2. Internal vs External Cost Analysis
    total_internal_hires = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.interview_result == "Recommended"
    ).count()
    
    avg_external_cost = 15000  # Average recruitment cost
    avg_internal_cost = 2000   # Minimal admin cost
    savings_per_hire = avg_external_cost - avg_internal_cost
    
    cost_analysis = {
        "internal_hires": total_internal_hires,
        "avg_external_cost": avg_external_cost,
        "avg_internal_cost": avg_internal_cost,
        "total_savings": total_internal_hires * savings_per_hire,
        "savings_per_hire": savings_per_hire,
        "roi_percentage": round(((savings_per_hire / avg_external_cost) * 100), 1)
    }
    
    # 3. Diversity & Mobility Heatmap
    dept_mobility = {}
    for app in active_apps:
        emp = db.query(models.User).filter(models.User.id == app.employee_id).first()
        if emp:
            dept = emp.department or "General"
            if dept not in dept_mobility:
                dept_mobility[dept] = {"exports": 0, "headcount": dept_counts.get(dept, 0)}
            dept_mobility[dept]["exports"] += 1
    
    mobility_heatmap = []
    for dept, data in dept_mobility.items():
        export_rate = round((data["exports"] / max(data["headcount"], 1)) * 100, 1)
        mobility_heatmap.append({
            "department": dept,
            "headcount": data["headcount"],
            "applicants_out": data["exports"],
            "export_rate_pct": export_rate,
            "status": "High Exporter" if export_rate > 30 else "Balanced" if export_rate > 10 else "Stalled"
        })
    
    return {
        "succession_risk_alerts": risk_alerts,
        "cost_analysis": cost_analysis,
        "mobility_heatmap": mobility_heatmap,
        "total_employees": len(employees),
        "total_active_applications": len(active_apps)
    }

# --- PRE-QUALIFIED TALENT POOL ---

@app.get("/org/prequalified-pool")
async def get_prequalified_pool(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get all pre-qualified candidates in the talent pool."""
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    pool = db.query(models.PreQualifiedPool).filter(
        models.PreQualifiedPool.org_id == current_user.organization_id,
        models.PreQualifiedPool.status == "available"
    ).order_by(models.PreQualifiedPool.interview_score.desc()).all()
    
    results = []
    for p in pool:
        emp = db.query(models.User).filter(models.User.id == p.employee_id).first()
        orig_job = db.query(models.InternalJob).filter(models.InternalJob.id == p.original_job_id).first()
        competencies = None
        try:
            if p.competency_scores:
                competencies = json.loads(p.competency_scores)
        except:
            pass
        
        results.append({
            "pool_id": p.id,
            "employee_id": p.employee_id,
            "employee_name": emp.full_name if emp else "Unknown",
            "employee_email": emp.email if emp else "",
            "department": emp.department if emp else "",
            "skills": json.loads(emp.skills_profile) if emp and emp.skills_profile else {},
            "interview_score": p.interview_score,
            "competency_scores": competencies,
            "original_role": orig_job.title if orig_job else "Unknown",
            "added_at": p.added_at.isoformat() if p.added_at else None,
            "status": p.status
        })
    return {"pool": results, "total": len(results)}

@app.post("/org/prequalified-pool/{pool_id}/hire/{job_id}")
async def hire_from_pool(pool_id: int, job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Hire a pre-qualified candidate directly for a new role."""
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    pool_entry = db.query(models.PreQualifiedPool).filter(models.PreQualifiedPool.id == pool_id).first()
    if not pool_entry:
        raise HTTPException(status_code=404, detail="Pool entry not found")
    
    pool_entry.status = "hired"
    pool_entry.notified_for_job_id = job_id
    db.commit()
    return {"message": "Candidate hired from pre-qualified pool", "employee_id": pool_entry.employee_id}

# --- ORG: Highlights Reel ---

@app.get("/org/jobs/{job_id}/highlights/{app_id}")
async def get_interview_highlights(job_id: int, app_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Get AI-generated highlights reel for a specific interview."""
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    app_record = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.id == app_id,
        models.InternalJobApplication.job_id == job_id
    ).first()
    
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Return cached highlights if available
    if app_record.interview_highlights:
        try:
            return json.loads(app_record.interview_highlights)
        except:
            pass
    
    # Generate highlights from answers
    qa_pairs = []
    evaluation = None
    try:
        if app_record.interview_answers:
            qa_pairs = json.loads(app_record.interview_answers)
        if app_record.interview_evaluation:
            evaluation = json.loads(app_record.interview_evaluation)
    except:
        pass
    
    if not qa_pairs:
        return {"highlights": [], "executive_summary": "No interview data available.", "hire_signal": "N/A"}
    
    highlights = await generate_highlights_reel(qa_pairs, evaluation)
    
    # Cache the result
    app_record.interview_highlights = json.dumps(highlights)
    db.commit()
    
    return highlights

@app.get("/org/jobs/{job_id}/interview-results")
async def get_interview_results(job_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["org", "admin", "manager"]:
        raise HTTPException(status_code=400, detail="Only org admins can view these")
    
    apps = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.job_id == job_id,
        models.InternalJobApplication.status.in_(["AI Interview Completed", "AI Interview In Progress"])
    ).order_by(models.InternalJobApplication.id.desc()).all()
    
    results = []
    for a in apps:
        emp = db.query(models.User).filter(models.User.id == a.employee_id).first()
        evaluation = None
        if a.interview_evaluation:
            try:
                evaluation = json.loads(a.interview_evaluation)
            except:
                evaluation = None
        
        results.append({
            "id": a.id,
            "employee_id": a.employee_id,
            "employee_name": emp.full_name if emp else "Unknown",
            "employee_email": emp.email if emp else "N/A",
            "status": a.status,
            "match_score": a.match_score,
            "interview_result": a.interview_result,
            "evaluation": evaluation,
            "applied_at": a.applied_at.isoformat() if a.applied_at else None
        })
    return results

# --- Grievance & Compliance Intelligence ---

from fastapi import Form
from typing import List, Optional

@app.post("/culture/report-grievance")
async def report_grievance(
    category: str = Form(...),
    description: str = Form(...),
    firstOccurred: Optional[str] = Form(None),
    lastOccurred: Optional[str] = Form(None),
    impact: str = Form("Moderate"),
    desiredResolution: Optional[str] = Form(""),
    chatKey: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    case_no = "REP-" + str(uuid.uuid4().hex[:6].upper())
    
    priority = "High" if impact == "Critical" else "Medium" if impact == "High" else "Low"
    deadline = "48 Hrs (IT Act/GDPR)" if impact == "Critical" else "7 Days" if impact == "High" else "14 Days"
    sentiment_label = "High Distress" if "Harassment" in category or impact == "Critical" else "Concerned"
    
    try:
        first_occ = datetime.strptime(firstOccurred, "%Y-%m-%d").date() if firstOccurred else None
        last_occ = datetime.strptime(lastOccurred, "%Y-%m-%d").date() if lastOccurred else None
    except:
        first_occ = None
        last_occ = None

    # Handle file uploads (Mock S3 storage)
    file_urls = []
    if files:
        upload_dir = "uploads/grievance_evidence"
        os.makedirs(upload_dir, exist_ok=True)
        for file in files:
            if file.filename:
                # Strip metadata - for demo just saving it locally in a secure folder
                file_id = str(uuid.uuid4().hex[:8]) + "_" + file.filename
                file_path = os.path.join(upload_dir, file_id)
                with open(file_path, "wb") as f:
                    f.write(await file.read())
                file_urls.append(f"/static/evidence/{file_id}")

    new_case = models.GrievanceCase(
        case_number=case_no,
        org_id=current_user.organization_id,
        reporter_id=current_user.id,
        category=category,
        description=description,
        first_occurred=first_occ,
        last_occurred=last_occ,
        impact=impact,
        desired_resolution=desiredResolution,
        anonymous_chat_key=chatKey,
        evidence_files=json.dumps(file_urls) if file_urls else None,
        status="Open",
        priority=priority,
        sentiment_label=sentiment_label,
        deadline=deadline,
        department="General"
    )
    db.add(new_case)
    db.commit()
    return {"status": "success", "case_number": case_no, "files_uploaded": len(file_urls)}

@app.get("/employee/my-grievances")
async def get_my_grievances(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    cases = db.query(models.GrievanceCase).filter(models.GrievanceCase.reporter_id == current_user.id).order_by(models.GrievanceCase.id.desc()).all()
    results = []
    for c in cases:
        evidence = []
        try:
            if c.evidence_files:
                evidence = json.loads(c.evidence_files)
        except:
            pass
        results.append({
            "id": c.case_number,
            "category": c.category,
            "risk": "Critical" if c.impact == "Critical" else "High" if c.impact == "High" else "Medium",
            "date": c.created_at.strftime("%b %d, %Y") if c.created_at else "Unknown",
            "status": c.status,
            "description": c.description,
            "evidence_files": evidence,
            "deadline": c.deadline,
            "sentiment": c.sentiment_label
        })
    return {"reports": results}

@app.get("/org/grievances")
async def get_grievances(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager", "org"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    cases = db.query(models.GrievanceCase).order_by(models.GrievanceCase.id.desc()).all()
    results = []
    for c in cases:
        evidence = []
        try:
            if c.evidence_files:
                evidence = json.loads(c.evidence_files)
        except:
            pass
        results.append({
            "id": c.case_number,
            "category": c.category,
            "risk": "Critical" if c.impact == "Critical" else "High" if c.impact == "High" else "Medium",
            "sentiment": c.sentiment_label,
            "dept": c.department,
            "date": c.created_at.strftime("%b %d, %Y") if c.created_at else "Unknown",
            "deadline": c.deadline,
            "description": c.description,
            "status": c.status,
            "evidence_files": evidence
        })
    return {"reports": results}

@app.post("/org/grievances/{case_number}/action")
async def take_grievance_action(case_number: str, payload: dict, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager", "org"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    case = db.query(models.GrievanceCase).filter(models.GrievanceCase.case_number == case_number).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    action = payload.get("action")
    if action == "resolve":
        case.status = "Resolved"
    elif action == "investigate":
        case.status = "Under Investigation"
    
    db.commit()
    return {"status": "success", "case": {"id": case.case_number, "status": case.status}}

@app.get("/culture/burnout-radar")
async def burnout_radar(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if current_user.role not in ["admin", "manager", "org"]:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    # Calculate burnout risk based on last 14 days
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    users = db.query(models.User).filter(models.User.organization_id == current_user.organization_id).all()
    
    results = []
    for user in users:
        records = db.query(models.Attendance).filter(
            models.Attendance.user_id == user.id,
            models.Attendance.date >= fourteen_days_ago
        ).all()
        
        if not records:
            continue
            
        risk_score = 0
        burnt_out_count = sum(1 for r in records if r.mood == "🔥 Burnt Out")
        tired_count = sum(1 for r in records if r.mood and "Tired" in r.mood)
        overtime_count = sum(1 for r in records if r.overtime_flag)
        anomaly_count = sum(1 for r in records if r.anomaly_flag)
        
        if burnt_out_count >= 2:
            risk_score += 40
        elif burnt_out_count == 1:
            risk_score += 20
            
        if tired_count >= 3:
            risk_score += 20
            
        if overtime_count >= 2:
            risk_score += 30
            
        if anomaly_count >= 2:
            risk_score += 10
            
        risk_score = min(100, risk_score)
        
        if risk_score > 0:
            results.append({
                "employee_id": user.id,
                "employee_name": user.full_name,
                "department": user.department or "General",
                "risk_score": risk_score,
                "indicators": {
                    "burnt_out_days": burnt_out_count,
                    "tired_days": tired_count,
                    "overtime_days": overtime_count,
                    "anomalies": anomaly_count
                }
            })
            
    # Sort by highest risk
    results.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"burnout_alerts": results[:10]}

@app.get("/employee/notifications")
async def get_employee_notifications(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Generate dynamic notifications based on pre-qualified pool, dream roles, and micro-gigs.
    """
    notifications = []
    
    # 1. Check pre-qualified pool entries
    pool_entries = db.query(models.PreQualifiedPool).filter(
        models.PreQualifiedPool.employee_id == current_user.id,
        models.PreQualifiedPool.status == 'available'
    ).all()
    
    for entry in pool_entries:
        job = db.query(models.InternalJob).filter(models.InternalJob.id == entry.original_job_id).first()
        notifications.append({
            "id": f"prequal-{entry.id}",
            "type": "success",
            "title": "Pre-Qualified!",
            "message": f"You are in the pre-qualified pool for {job.title if job else 'a role'}.",
            "timestamp": entry.added_at.isoformat() if entry.added_at else datetime.utcnow().isoformat(),
            "link": "/employee/careers"
        })
    
    # 2. Check recommended applications
    rec_apps = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.employee_id == current_user.id,
        models.InternalJobApplication.interview_result == 'Recommended'
    ).all()
    for app_item in rec_apps:
        job = db.query(models.InternalJob).filter(models.InternalJob.id == app_item.job_id).first()
        notifications.append({
            "id": f"rec-{app_item.id}",
            "type": "success",
            "title": "Recommended!",
            "message": f"You were recommended for {job.title if job else 'an internal role'}.",
            "timestamp": app_item.applied_at.isoformat() if app_item.applied_at else datetime.utcnow().isoformat(),
            "link": "/employee/careers"
        })
        
    # 3. Check for new Micro-Gigs that match skills
    micro_gigs = db.query(models.InternalJob).filter(
        models.InternalJob.job_type == 'micro_gig', 
        models.InternalJob.status == 'open'
    ).all()
    if micro_gigs and current_user.skills_profile:
        try:
            emp_skills = set(json.loads(current_user.skills_profile).keys()) if '{' in (current_user.skills_profile or '') else set(json.loads(current_user.skills_profile or '[]'))
        except Exception:
            emp_skills = set()
        for gig in micro_gigs:
            try:
                req_skills = set(json.loads(gig.required_skills).keys()) if gig.required_skills and '{' in gig.required_skills else set()
            except Exception:
                req_skills = set()
            if req_skills and emp_skills:
                match_pct = int((len(emp_skills.intersection(req_skills)) / len(req_skills)) * 100)
                if match_pct >= 50:
                    notifications.append({
                        "id": f"gig-{gig.id}",
                        "type": "info",
                        "title": "New Micro-Gig Match",
                        "message": f"Your skills are a {match_pct}% match for '{gig.title}'.",
                        "timestamp": gig.posted_at.isoformat() if gig.posted_at else datetime.utcnow().isoformat(),
                        "link": "/employee/careers"
                    })
                    
    # Sort by timestamp descending
    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    return notifications


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PERFORMANCE INTELLIGENCE - EMPLOYEE SELF-GROWTH
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/performance/employee-growth")
async def get_employee_growth(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """360-degree self-growth intelligence report for the logged-in employee."""
    from .ai_engine import generate_employee_growth_report
    
    # Gather real data from the database
    skills = json.loads(current_user.skills_profile) if current_user.skills_profile else {}
    
    # Attendance moods for mood-productivity correlation
    recent_attendance = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id
    ).order_by(models.Attendance.date.desc()).limit(30).all()
    moods = [a.mood for a in recent_attendance if a.mood]
    
    # Performance reviews for collaboration
    reviews_given = db.query(models.PerformanceReview).filter(
        models.PerformanceReview.reviewer_id == current_user.id
    ).count() if hasattr(models.PerformanceReview, 'reviewer_id') else 0
    
    reviews_received = db.query(models.PerformanceReview).filter(
        models.PerformanceReview.employee_id == current_user.id
    ).all() if hasattr(models.PerformanceReview, 'employee_id') else []
    
    # Interview scores from internal applications
    apps = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.employee_id == current_user.id
    ).all()
    interview_scores = []
    for a in apps:
        if a.competency_scores:
            try:
                interview_scores.append(json.loads(a.competency_scores))
            except Exception:
                pass
    
    # Pre-qualified pool entries (milestones/badges)
    pool_entries = db.query(models.PreQualifiedPool).filter(
        models.PreQualifiedPool.employee_id == current_user.id
    ).all()
    
    # Succession data
    succession = db.query(models.SuccessionData).filter(
        models.SuccessionData.employee_id == current_user.id
    ).first()
    
    employee_data = {
        "name": current_user.full_name,
        "current_role": current_user.job_title or "Employee",
        "department": current_user.department or "General",
        "skills": skills,
        "moods": moods,
        "reviews_given_count": reviews_given,
        "reviews_received": [{"feedback": r.feedback_text, "rating": r.rating, "sentiment": r.sentiment_score} for r in reviews_received],
        "interview_scores": interview_scores,
        "pool_entries_count": len(pool_entries),
        "performance_score": succession.performance_score if succession else None,
        "potential_score": succession.potential_score if succession else None,
        "dream_roles": json.loads(current_user.dream_roles) if current_user.dream_roles else [],
    }
    
    report = await generate_employee_growth_report(employee_data)
    return report


@app.get("/performance/career-simulation")
async def get_career_simulation(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Autonomous Career Simulation: What executive role in 24 months + $3k training plan."""
    from .ai_engine import run_career_simulation
    
    skills = json.loads(current_user.skills_profile) if current_user.skills_profile else {}
    
    succession = db.query(models.SuccessionData).filter(
        models.SuccessionData.employee_id == current_user.id
    ).first()
    
    # Calculate tenure
    tenure_months = 0
    if current_user.date_of_joining:
        from datetime import date
        today = date.today()
        tenure_months = (today.year - current_user.date_of_joining.year) * 12 + (today.month - current_user.date_of_joining.month)
    
    # Mood trend from attendance
    recent_moods = db.query(models.Attendance.mood).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.mood.isnot(None)
    ).order_by(models.Attendance.date.desc()).limit(14).all()
    mood_list = [m[0] for m in recent_moods if m[0]]
    mood_trend = "Positive" if mood_list.count("Energized") + mood_list.count("Focused") > len(mood_list) / 2 else "Neutral"
    
    # Interview performance
    apps = db.query(models.InternalJobApplication).filter(
        models.InternalJobApplication.employee_id == current_user.id
    ).all()
    avg_score = 0
    if apps:
        scores = [a.match_score for a in apps if a.match_score]
        avg_score = sum(scores) / len(scores) if scores else 0
    
    employee_data = {
        "name": current_user.full_name,
        "current_role": current_user.job_title or "Employee",
        "department": current_user.department or "General",
        "skills": skills,
        "performance_score": succession.performance_score if succession else None,
        "potential_score": succession.potential_score if succession else None,
        "tenure_months": tenure_months,
        "mood_trend": mood_trend,
        "interview_scores": round(avg_score, 1),
    }
    
    simulation = await run_career_simulation(employee_data)
    return simulation


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PERFORMANCE INTELLIGENCE - ORG STRATEGIC VIEW
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@app.get("/performance/nine-box")
async def get_nine_box(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """9-Box Potential vs Performance matrix for all employees in the org."""
    from .ai_engine import generate_nine_box
    
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    # Get all succession data
    succession_records = db.query(models.SuccessionData).all()
    employees_data = []
    for s in succession_records:
        emp = db.query(models.Employee).filter(models.Employee.id == s.employee_id).first()
        user = db.query(models.User).filter(models.User.id == emp.user_id).first() if emp else None
        if user:
            employees_data.append({
                "employee_id": s.employee_id,
                "name": user.full_name,
                "role": user.job_title or emp.designation,
                "department": user.department or emp.department,
                "performance_score": s.performance_score,
                "potential_score": s.potential_score,
                "is_flight_risk": s.is_flight_risk,
            })
    
    if not employees_data:
        # Fallback: use all employees with reviews
        users = db.query(models.User).filter(
            models.User.organization_id == current_user.organization_id,
            models.User.role == 'employee'
        ).all()
        for u in users:
            reviews = db.query(models.PerformanceReview).filter(models.PerformanceReview.employee_id == u.id).all()
            avg_rating = sum(r.rating for r in reviews) / len(reviews) if reviews else 5
            avg_sentiment = sum(r.sentiment_score for r in reviews if r.sentiment_score) / max(len([r for r in reviews if r.sentiment_score]), 1)
            employees_data.append({
                "employee_id": u.id,
                "name": u.full_name,
                "role": u.job_title or "Employee",
                "department": u.department or "General",
                "performance_score": avg_rating * 2,
                "potential_score": avg_sentiment * 10 if avg_sentiment else 5.0,
                "is_flight_risk": False,
            })
    
    result = await generate_nine_box(employees_data)
    return result


@app.get("/performance/sentiment-trend")
async def get_sentiment_trend(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Gemini-powered sentiment trend analysis of peer feedback over time."""
    from .ai_engine import analyze_sentiment_trend
    
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    reviews = db.query(models.PerformanceReview).order_by(models.PerformanceReview.id.desc()).limit(50).all()
    feedbacks = [{
        "employee_id": r.employee_id,
        "feedback": r.feedback_text,
        "rating": r.rating,
        "sentiment_score": r.sentiment_score,
    } for r in reviews]
    
    result = await analyze_sentiment_trend(feedbacks)
    return result


@app.get("/performance/promotion-readiness")
async def get_promotion_readiness(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Check which employees meet 100% criteria for Internal Careers roles."""
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    open_jobs = db.query(models.InternalJob).filter(
        models.InternalJob.status == 'open',
        models.InternalJob.org_id == current_user.organization_id
    ).all()
    
    alerts = []
    users = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role == 'employee',
        models.User.skills_profile.isnot(None)
    ).all()
    
    for user in users:
        try:
            emp_skills = json.loads(user.skills_profile)
        except Exception:
            continue
        for job in open_jobs:
            if not job.required_skills:
                continue
            try:
                req_skills = json.loads(job.required_skills)
            except Exception:
                continue
            total_req = sum(req_skills.values()) if isinstance(req_skills, dict) else 0
            total_met = 0
            if isinstance(req_skills, dict) and isinstance(emp_skills, dict):
                for skill, level in req_skills.items():
                    total_met += min(emp_skills.get(skill, 0), level)
            match_pct = round((total_met / total_req) * 100) if total_req > 0 else 0
            if match_pct >= 90:
                alerts.append({
                    "employee_id": user.id,
                    "employee_name": user.full_name,
                    "role": user.job_title,
                    "target_job": job.title,
                    "target_department": job.department,
                    "match_pct": match_pct,
                    "flag": "PROMOTION READY" if match_pct >= 95 else "NEAR READY",
                })
    
    alerts.sort(key=lambda x: x["match_pct"], reverse=True)
    return {"alerts": alerts, "total": len(alerts)}


@app.get("/performance/disengagement-risk")
async def get_disengagement_risk(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Predictive disengagement/burnout risk scores for org employees."""
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    users = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role == 'employee'
    ).all()
    
    risks = []
    for user in users:
        risk_score = 0
        factors = []
        
        # Factor 1: Negative mood streaks
        recent_moods = db.query(models.Attendance.mood).filter(
            models.Attendance.user_id == user.id,
            models.Attendance.mood.isnot(None)
        ).order_by(models.Attendance.date.desc()).limit(14).all()
        mood_list = [m[0] for m in recent_moods if m[0]]
        neg_moods = [m for m in mood_list if m in ["Stressed", "Exhausted", "Anxious", "Burned Out"]]
        if len(neg_moods) > len(mood_list) * 0.4 and mood_list:
            risk_score += 35
            factors.append(f"{len(neg_moods)}/{len(mood_list)} negative mood check-ins")
        
        # Factor 2: Overtime flags
        overtime_count = db.query(models.Attendance).filter(
            models.Attendance.user_id == user.id,
            models.Attendance.overtime_flag == True
        ).count()
        if overtime_count > 5:
            risk_score += 25
            factors.append(f"{overtime_count} overtime days detected")
        
        # Factor 3: Low performance sentiment
        reviews = db.query(models.PerformanceReview).filter(
            models.PerformanceReview.employee_id == user.id
        ).all()
        if reviews:
            avg_sent = sum(r.sentiment_score for r in reviews if r.sentiment_score) / max(len([r for r in reviews if r.sentiment_score]), 1)
            if avg_sent < 0.4:
                risk_score += 20
                factors.append(f"Low feedback sentiment ({avg_sent:.0%})")
        
        # Factor 4: Flight risk from succession data
        succession = db.query(models.SuccessionData).filter(
            models.SuccessionData.employee_id == user.id,
            models.SuccessionData.is_flight_risk == True
        ).first()
        if succession:
            risk_score += 20
            factors.append("Flagged as flight risk in succession plan")
        
        if risk_score > 20:
            risks.append({
                "employee_id": user.id,
                "employee_name": user.full_name,
                "role": user.job_title or "Employee",
                "department": user.department or "General",
                "risk_score": min(risk_score, 100),
                "risk_level": "Critical" if risk_score >= 70 else "High" if risk_score >= 50 else "Moderate",
                "factors": factors,
            })
    
    risks.sort(key=lambda x: x["risk_score"], reverse=True)
    return {"risks": risks[:15], "total_at_risk": len(risks)}


@app.get("/performance/org-career-simulation/{employee_id}")
async def get_org_career_simulation(employee_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Org-level career simulation for a specific employee (admin only)."""
    from .ai_engine import run_career_simulation
    
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    user = db.query(models.User).filter(models.User.id == employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    skills = json.loads(user.skills_profile) if user.skills_profile else {}
    succession = db.query(models.SuccessionData).filter(models.SuccessionData.employee_id == employee_id).first()
    
    tenure_months = 0
    if user.date_of_joining:
        from datetime import date
        today = date.today()
        tenure_months = (today.year - user.date_of_joining.year) * 12 + (today.month - user.date_of_joining.month)
    
    employee_data = {
        "name": user.full_name,
        "current_role": user.job_title or "Employee",
        "department": user.department or "General",
        "skills": skills,
        "performance_score": succession.performance_score if succession else None,
        "potential_score": succession.potential_score if succession else None,
        "tenure_months": tenure_months,
        "mood_trend": "Neutral",
        "interview_scores": 0,
    }
    
    simulation = await run_career_simulation(employee_data)
    return simulation


@app.get("/succession/org-pipeline")
async def get_org_succession_pipeline(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from .ai_engine import analyze_succession_pipeline
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    # Gather organization data for AI analysis
    users = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role == 'employee'
    ).all()
    
    succession_data = db.query(models.SuccessionData).filter(
        models.SuccessionData.employee_id.in_([u.id for u in users])
    ).all()
    
    org_data = {
        "total_employees": len(users),
        "departments": list(set(u.department for u in users if u.department)),
        "succession_mappings": [
            {
                "employee_id": s.employee_id,
                "readiness": s.readiness_status,
                "potential": s.potential_score,
                "performance": s.performance_score,
                "flight_risk": s.is_flight_risk
            } for s in succession_data
        ]
    }
    
    result = await analyze_succession_pipeline(org_data)
    return result


@app.get("/succession/employee-profile")
async def get_employee_succession_profile(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from .ai_engine import analyze_employee_succession_profile
    if current_user.role != 'employee':
        raise HTTPException(status_code=403, detail="Employee access only")
    
    # Ideally, employee's "Goal Role" is stored in their profile or derived from internal careers
    goal_role = "Senior Engineer" # Default placeholder for now, would be dynamically fetched
    goal_role_reqs = {"title": goal_role, "skills": {"Python": 8, "Leadership": 6, "Architecture": 7}}
    
    employee_data = {
        "name": current_user.full_name,
        "skills": json.loads(current_user.skills_profile) if current_user.skills_profile else {},
        "department": current_user.department,
        "job_title": current_user.job_title
    }
    
    result = await analyze_employee_succession_profile(employee_data, goal_role_reqs)
    return result


class TriggerShadowRequest(BaseModel):
    employee_id: int
    target_role: str

@app.post("/succession/trigger-shadow")
async def trigger_shadow_pipeline(request: TriggerShadowRequest, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from .ai_engine import run_shadow_pipeline_simulation
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    user = db.query(models.User).filter(models.User.id == request.employee_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    employee_data = {
        "name": user.full_name,
        "skills": json.loads(user.skills_profile) if user.skills_profile else {},
        "performance_history": "Consistently high ratings"
    }
    
    result = await run_shadow_pipeline_simulation(employee_data, request.target_role)
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CULTURAL INTELLIGENCE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class PulseSubmission(BaseModel):
    micro_feedback: str
    psychological_safety: int
    engagement_drivers: List[str]
    mood_tags: List[str]
    cultural_alignment: int
    anonymous_feedback: Optional[str] = None

@app.post("/culture/submit-pulse")
async def submit_culture_pulse(request: PulseSubmission, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Calculate initial sentiment score based on inputs
    sentiment_score = (request.psychological_safety * 2 + request.cultural_alignment * 2) / 40.0 # Normalized 0-1
    
    pulse = models.PulseResponse(
        org_id=current_user.organization_id,
        department=current_user.department,
        sentiment_score=sentiment_score,
        anonymous_feedback=request.anonymous_feedback,
        micro_feedback=request.micro_feedback,
        psychological_safety=request.psychological_safety,
        engagement_drivers=json.dumps(request.engagement_drivers),
        mood_tags=json.dumps(request.mood_tags),
        cultural_alignment=request.cultural_alignment
    )
    db.add(pulse)
    db.commit()
    return {"message": "Pulse submitted anonymously"}

@app.get("/culture/org-intelligence")
async def get_org_culture_intelligence(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from .ai_engine import analyze_culture_map
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    pulses = db.query(models.PulseResponse).filter(models.PulseResponse.org_id == current_user.organization_id).order_by(models.PulseResponse.created_at.desc()).limit(100).all()
    pulse_data = [{
        "department": p.department,
        "sentiment": p.sentiment_score,
        "micro_feedback": p.micro_feedback,
        "psychological_safety": p.psychological_safety,
        "engagement_drivers": json.loads(p.engagement_drivers) if p.engagement_drivers else [],
        "mood_tags": json.loads(p.mood_tags) if p.mood_tags else [],
        "alignment": p.cultural_alignment
    } for p in pulses]
    
    # Fetch performance ROI data (average milestone completion etc)
    # This is a simplification for the demo
    org_perf_data = {
        "avg_milestone_completion": 85,
        "burnout_risks": 12
    }
    
    result = await analyze_culture_map(pulse_data, org_perf_data)
    return result

@app.get("/culture/intervention-template/{team_name}")
async def get_culture_intervention(team_name: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    from .ai_engine import generate_culture_intervention
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
        
    # Get recent friction points for this team
    pulses = db.query(models.PulseResponse).filter(
        models.PulseResponse.org_id == current_user.organization_id,
        models.PulseResponse.department == team_name
    ).order_by(models.PulseResponse.created_at.desc()).limit(20).all()
    
    frictions = [p.micro_feedback for p in pulses if p.micro_feedback]
    
    result = await generate_culture_intervention(team_name, frictions)
    return result


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# WELLNESS NAVIGATOR & ATTRITION INTELLIGENCE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def _gather_burnout_telemetry(db, org_id):
    """Helper: collects burnout telemetry aggregated by department for AI consumption."""
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    users = db.query(models.User).filter(
        models.User.organization_id == org_id,
        models.User.role == "employee"
    ).all()
    
    dept_data = {}
    for user in users:
        dept = user.department or "General"
        records = db.query(models.Attendance).filter(
            models.Attendance.user_id == user.id,
            models.Attendance.date >= fourteen_days_ago
        ).all()
        if not records:
            continue
        
        if dept not in dept_data:
            dept_data[dept] = {"team": dept, "employees": 0, "total_overtime": 0, "burnout_moods": 0, "tired_moods": 0, "anomalies": 0, "total_hours": 0}
        
        dept_data[dept]["employees"] += 1
        for r in records:
            if r.overtime_flag:
                dept_data[dept]["total_overtime"] += 1
            if r.mood and "Burnt" in r.mood:
                dept_data[dept]["burnout_moods"] += 1
            if r.mood and "Tired" in r.mood:
                dept_data[dept]["tired_moods"] += 1
            if r.anomaly_flag:
                dept_data[dept]["anomalies"] += 1
            if r.check_in and r.check_out:
                hours = (r.check_out - r.check_in).total_seconds() / 3600
                dept_data[dept]["total_hours"] += hours
    
    return list(dept_data.values())


@app.get("/employee/wellness-navigator")
async def employee_wellness_navigator(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Private Wellness Navigator — only the employee sees their own data."""
    from .ai_engine import analyze_employee_wellness
    
    fourteen_days_ago = datetime.utcnow() - timedelta(days=14)
    records = db.query(models.Attendance).filter(
        models.Attendance.user_id == current_user.id,
        models.Attendance.date >= fourteen_days_ago
    ).order_by(models.Attendance.date.desc()).all()
    
    moods = [r.mood for r in records if r.mood]
    overtime_days = sum(1 for r in records if r.overtime_flag)
    
    # Calculate consecutive late days
    consecutive_late = 0
    for r in records:
        if r.overtime_flag:
            consecutive_late += 1
        else:
            break
    
    total_hours = 0
    for r in records:
        if r.check_in and r.check_out:
            total_hours += (r.check_out - r.check_in).total_seconds() / 3600
    
    employee_data = {
        "name": current_user.full_name,
        "department": current_user.department or "General",
        "job_title": current_user.job_title or "Employee",
        "attendance_records": len(records),
        "moods_last_14_days": moods,
        "overtime_days": overtime_days,
        "consecutive_late_days": consecutive_late,
        "total_hours_14d": round(total_hours, 1),
        "avg_hours_per_day": round(total_hours / max(len(records), 1), 1),
        "skills_profile": current_user.skills_profile,
        "dream_roles": current_user.dream_roles,
        "career_aspiration": current_user.career_aspiration_note
    }
    
    result = await analyze_employee_wellness(employee_data)
    return result


@app.get("/attrition/intelligence")
async def get_attrition_intelligence(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """Organization-level Attrition Intelligence — aggregated, anonymized."""
    from .ai_engine import analyze_attrition_intelligence
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    # 1. Burnout telemetry
    burnout_data = _gather_burnout_telemetry(db, current_user.organization_id)
    
    # 2. Performance data (aggregated)
    performance_data = {"avg_rating": 3.5, "top_performers_count": 0, "reviews_completed": 0}
    
    # 3. Leave data (aggregated by dept)
    leave_data = {"pending_leaves": 0, "approved_leaves_next_30d": 0}
    
    result = await analyze_attrition_intelligence(burnout_data, performance_data, leave_data)
    return result


@app.get("/attrition/live-prediction")
async def live_prediction_intervention(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """The HRVALY Unique: Live Prediction & Load Balancer."""
    from .ai_engine import run_live_prediction_intervention
    if current_user.role not in ["admin", "hr_manager", "org_admin"]:
        raise HTTPException(status_code=403, detail="Organization-level access required")
    
    # 1. Burnout telemetry
    burnout_data = _gather_burnout_telemetry(db, current_user.organization_id)
    
    # 2. Leave data
    leave_data = {"pending_leaves": 0, "approved_next_week": 0, "departments_affected": []}
    
    # 3. Careers / Shadow Pipeline data
    pool = db.query(models.PreQualifiedPool).filter(
        models.PreQualifiedPool.org_id == current_user.organization_id,
        models.PreQualifiedPool.status == "available"
    ).all()
    careers_data = {
        "prequalified_pool_size": len(pool),
        "available_for_rotation": [{"id": p.id, "skills": p.matched_skills, "score": p.interview_score} for p in pool[:10]]
    }
    
    result = await run_live_prediction_intervention(burnout_data, leave_data, careers_data)
    return result
