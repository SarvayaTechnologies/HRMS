import os
import httpx
import json
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File
from .parser import extract_text_from_file
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database ,auth
from .ai_engine import analyze_resume_with_ai, get_ai_response, evaluate_internal_candidate
from geopy.distance import geodesic
from .payroll_logic import calculate_monthly_pay, calculate_monthly_payroll, build_salary_structure, detect_anomalies
from .utils import log_action
import uuid
import calendar
from sqlalchemy.orm import joinedload
from datetime import datetime, date

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
            "posted_at": j.posted_at.isoformat() if j.posted_at else None
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
        except Exception as e:
            print(f"[main] Interview evaluation failed: {e}")
            app_record.interview_result = "Pending Review"
            db.commit()
    
    return {"status": app_record.status, "result": app_record.interview_result}

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
