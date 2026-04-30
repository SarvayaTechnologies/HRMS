import os
import httpx
import json
from fastapi import FastAPI, Depends, HTTPException, Request, UploadFile, File
from .parser import extract_text_from_file
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import models, database ,auth
from .ai_engine import analyze_resume_with_ai,get_ai_response
from geopy.distance import geodesic
from .payroll_logic import calculate_monthly_pay
from .utils import log_action
import uuid
from sqlalchemy.orm import joinedload

models.Base.metadata.create_all(bind=database.engine)

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
async def apply_leave(data: dict, db: Session = Depends(database.get_db)):
    new_leave = models.LeaveRequest(
        employee_id=data['employee_id'],
        leave_type=data['leave_type'],
        start_date=data['start_date'],
        end_date=data['end_date'],
        reason=data['reason']
    )
    db.add(new_leave)
    db.commit()
    return {"message": "Leave request submitted"}

@app.get("/leave/manager/pending")
async def get_pending_leaves(db: Session = Depends(database.get_db)):
    
    return db.query(models.LeaveRequest).filter(models.LeaveRequest.status == "pending").all()

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
    
    return {"message": "Payroll generated and logged"}

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

@app.post("/culture/report-grievance")
async def report_grievance(data: dict, db: Session = Depends(database.get_db)):
    case_no = f"CASE-{uuid.uuid4().hex[:6].upper()}"
    
    
    prompt = f"Analyze this workplace report: '{data['description']}'. Categorize it and set a priority (Low to Critical). Return ONLY JSON: {{'category': '...', 'priority': '...'}}"
    
    raw_ai_res = await get_ai_response(prompt)
    analysis = json.loads(raw_ai_res.replace('```json', '').replace('```', '').strip())
    
    new_case = models.GrievanceCase(
        case_number=case_no,
        category=analysis['category'],
        description=data['description'],
        priority=analysis['priority']
    )
    db.add(new_case)
    db.commit()
    
    return {"message": "Report submitted anonymously", "case_number": case_no}

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

@app.get("/org/employees")
async def list_org_employees(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """List all employees in the current user's organization."""
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="You must belong to an organization")
    
    employees = db.query(models.User).filter(
        models.User.organization_id == current_user.organization_id,
        models.User.role == "employee"
    ).all()
    
    return [{"id": e.id, "email": e.email, "full_name": e.full_name, "has_password": e.hashed_password is not None} for e in employees]

from pydantic import BaseModel

class AttendancePunchBase(BaseModel):
    lat: float = None
    lon: float = None

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
            
    # New punch in — auto-approved
    new_att = models.Attendance(
        user_id=current_user.id,
        check_in=datetime.utcnow(),
        latitude=data.lat,
        longitude=data.lon,
        status="approved",
        date=today
    )
    db.add(new_att)
    db.commit()
    db.refresh(new_att)
    return {"status": "Checked In", "record_id": new_att.id, "message": "Punch-in recorded successfully."}



@app.get("/attendance/my-records")
async def my_attendance(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    records = db.query(models.Attendance).filter(models.Attendance.user_id == current_user.id).order_by(models.Attendance.date.desc()).all()
    return [{"id": r.id, "check_in": r.check_in, "check_out": r.check_out, "status": r.status, "date": r.date.isoformat() if r.date else None} for r in records]

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
        result.append({
            "id": r.id,
            "employee_name": emp.full_name if emp else "Unknown",
            "employee_email": emp.email if emp else "",
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "date": r.date.isoformat() if r.date else None,
            "status": r.status
        })
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
