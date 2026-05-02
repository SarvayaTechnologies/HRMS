from sqlalchemy import Column, Integer,String,Boolean, ForeignKey,Date , DateTime, Float,Enum
import enum
from sqlalchemy.orm import relationship
from datetime import datetime
from  .database import Base

class Organization(Base):
    __tablename__ ="organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    subscription_plan = Column(String, default="free")
    employees = relationship("Employee", back_populates="org")

class User(Base):
    __tablename__ ="users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(String, default="employee")
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    
    # Onboarding fields
    onboarding_completed = Column(Boolean, default=False)
    employee_code = Column(String, nullable=True)
    job_title = Column(String, nullable=True)
    department = Column(String, nullable=True)
    date_of_joining = Column(Date, nullable=True)
    reporting_manager = Column(String, nullable=True)
    employment_type = Column(String, nullable=True)
    work_location = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)
    personal_email = Column(String, nullable=True)

class Employee(Base):
    __tablename__ ="employees"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    org_id = Column(Integer, ForeignKey("organizations.id"))

    employee_id = Column(String, unique=True) 
    department = Column(String) 
    designation = Column(String) 
    joining_date = Column(Date)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)

    org = relationship("Organization", back_populates="employees")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    check_in = Column(DateTime, default=datetime.utcnow)
    check_out = Column(DateTime, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String, default="pending")  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    date = Column(Date, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])

class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class LeaveRequest(Base):
    __tablename__ = "leave_requests"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    leave_type = Column(String) 
    start_date = Column(Date)
    end_date = Column(Date)
    reason = Column(String)
    status = Column(String, default=LeaveStatus.PENDING)

class SalaryStructure(Base):
    __tablename__ = "salary_structures"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    base_salary = Column(Float)
    # bonus_pct = Column(Float, default=10.0)
    # stock_options = Column(Integer, default=0)
    # level = Column(String)
    # house_allowance = Column(Float) 
    # other_allowances = Column(Float)

class Payslip(Base):
    __tablename__ = "payslips"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    month = Column(String) 
    gross_pay = Column(Float)
    deductions = Column(Float)
    net_pay = Column(Float)
    generated_at = Column(DateTime, default=datetime.utcnow)

class PerformanceReview(Base):
    __tablename__ = "performance_reviews"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    reviewer_id = Column(Integer, ForeignKey("employees.id"))
    feedback_text = Column(String) 
    rating = Column(Integer) 
    ai_summary = Column(String, nullable=True) 
    sentiment_score = Column(Float, nullable=True) 

class SuccessionData(Base):
    __tablename__ = "succession_data"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    performance_score = Column(Float) 
    potential_score = Column(Float)   
    is_flight_risk = Column(Boolean, default=False)
    ai_succession_note = Column(String) 

class RoleRequirement(Base):
    __tablename__ = "role_requirements"
    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String) 
    required_skills = Column(String) 

class InternalJob(Base):
    __tablename__ = "internal_jobs"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    title = Column(String) 
    department = Column(String)
    description = Column(String)
    location = Column(String)
    package = Column(String)
    attachment_url = Column(String, nullable=True)
    posted_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="open")

class InternalJobApplication(Base):
    __tablename__ = "internal_job_applications"
    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("internal_jobs.id"))
    employee_id = Column(Integer, ForeignKey("users.id"))
    resume_url = Column(String)
    status = Column(String, default="Resume Parsing Completed")
    match_score = Column(Float, nullable=True)
    ai_reasoning = Column(String, nullable=True)
    applied_at = Column(DateTime, default=datetime.utcnow)
    interview_answers = Column(String, nullable=True)      # JSON string of [{question, answer}]
    interview_evaluation = Column(String, nullable=True)   # JSON string of AI evaluation
    interview_result = Column(String, nullable=True)        # "Recommended" / "Not Recommended"

class PulseSurvey(Base):
    __tablename__ = "pulse_surveys"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String)
    department = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class PulseResponse(Base):
    __tablename__ = "pulse_responses"
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("pulse_surveys.id"))
    sentiment_score = Column(Float) 
    anonymous_feedback = Column(String)

class GrievanceCase(Base):
    __tablename__ = "grievance_cases"
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True) 
    category = Column(String) 
    description = Column(String)
    status = Column(String, default="Open")
    priority = Column(String) 
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action = Column(String, index=True) 
    target_id = Column(String, nullable=True) 
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    ip_address = Column(String)

