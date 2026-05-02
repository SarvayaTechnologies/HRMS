from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, DateTime, Float, Enum, Text
import enum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

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
    
    # Skill-Gap Mobility fields
    skills_profile = Column(Text, nullable=True)        # JSON: {"Python": 8, "React": 7, ...}
    dream_roles = Column(Text, nullable=True)            # JSON: ["Lead Engineer", "CTO"]
    career_aspiration_note = Column(Text, nullable=True)  # Free-text career goals

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
    
    # Smart Presence Additions
    work_mode = Column(String, default="Office") 
    device_id = Column(String, nullable=True)
    mood = Column(String, nullable=True) 
    daily_goal = Column(String, nullable=True)
    is_offline_sync = Column(Boolean, default=False)
    anomaly_flag = Column(String, nullable=True) 
    overtime_flag = Column(Boolean, default=False)

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
    
    # Contextual Leave Additions
    handover_link = Column(String, nullable=True)
    point_of_person_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    wellness_check_requested = Column(Boolean, default=False)
    
    # AI Impact Analytics
    ai_impact_score = Column(Float, nullable=True)
    ai_milestone_conflict = Column(String, nullable=True)
    ai_succession_backup = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

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
    # Advanced Marketplace fields
    required_skills = Column(Text, nullable=True)      # JSON: {"Python": 9, "React": 8}
    experience_level = Column(String, nullable=True)    # Junior, Mid, Senior, Lead
    job_type = Column(String, default="full_time")      # full_time, micro_gig, shadowing
    gig_duration = Column(String, nullable=True)        # "1 week", "2 weeks" for micro-gigs
    gig_department = Column(String, nullable=True)      # Host department for shadowing

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
    # Advanced fields
    skill_match_pct = Column(Float, nullable=True)          # Real-time skill match %
    competency_scores = Column(Text, nullable=True)         # JSON spider chart data
    sentiment_analysis = Column(Text, nullable=True)        # JSON sentiment/integrity flags
    soft_skill_feedback = Column(Text, nullable=True)       # JSON communication clarity etc
    interview_highlights = Column(Text, nullable=True)      # JSON key moments
    interview_mode = Column(String, default="scored")       # "scored" or "practice"
    is_prequalified = Column(Boolean, default=False)        # Pre-Qualified Talent Pool
    prequalified_at = Column(DateTime, nullable=True)
    ai_resume_data = Column(Text, nullable=True)            # JSON generated AI resume

class PulseSurvey(Base):
    __tablename__ = "pulse_surveys"
    id = Column(Integer, primary_key=True, index=True)
    question = Column(String)
    department = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class PulseResponse(Base):
    __tablename__ = "pulse_responses"
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("pulse_surveys.id"), nullable=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    department = Column(String, nullable=True)
    sentiment_score = Column(Float, nullable=True) 
    anonymous_feedback = Column(String, nullable=True)
    
    # High-Granularity Culture Data
    micro_feedback = Column(String(140), nullable=True)      # Micro-Shoutout / Micro-Gripe
    psychological_safety = Column(Integer, nullable=True)    # Slider 1-5
    engagement_drivers = Column(Text, nullable=True)         # JSON: ["Skill Learned", "Recognition"]
    mood_tags = Column(Text, nullable=True)                  # JSON: ["Inspired", "Overwhelmed"]
    cultural_alignment = Column(Integer, nullable=True)      # Purpose Check 1-5
    manager_id = Column(Integer, nullable=True)              # Anonymized manager reference for Managerial Impact
    created_at = Column(DateTime, default=datetime.utcnow)

class GrievanceCase(Base):
    __tablename__ = "grievance_cases"
    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String, unique=True) 
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    category = Column(String) 
    description = Column(String)
    first_occurred = Column(Date, nullable=True)
    last_occurred = Column(Date, nullable=True)
    impact = Column(String, nullable=True)
    desired_resolution = Column(String, nullable=True)
    evidence_files = Column(String, nullable=True)
    anonymous_chat_key = Column(String, unique=True, index=True)
    status = Column(String, default="Open")
    priority = Column(String) 
    sentiment_label = Column(String, nullable=True)
    department = Column(String, nullable=True)
    deadline = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    action = Column(String, index=True) 
    target_id = Column(String, nullable=True) 
    target_resource = Column(String, nullable=True)       # "Payroll Database", "AI Interview Models"
    previous_value = Column(Text, nullable=True)          # JSON: old value before change
    new_value = Column(Text, nullable=True)               # JSON: new value after change
    ip_address = Column(String, nullable=True)
    geo_location = Column(String, nullable=True)          # "Mumbai, IN" derived from IP
    geo_flag = Column(Boolean, default=False)             # True if unusual location
    severity = Column(String, default="info")             # info, warning, critical
    entry_hash = Column(String, nullable=True, index=True) # SHA-256 hash for integrity
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class DataAccessLog(Base):
    """Tracks when admin/manager views employee sensitive data (PAN, Aadhaar, etc.)"""
    __tablename__ = "data_access_logs"
    id = Column(Integer, primary_key=True, index=True)
    accessed_by = Column(Integer, ForeignKey("users.id"), index=True)    # Who viewed
    employee_id = Column(Integer, ForeignKey("users.id"), index=True)    # Whose data
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    data_field = Column(String)                  # "pan_number", "aadhaar_number", "performance_score"
    access_reason = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ActiveSession(Base):
    """Tracks all active login sessions for session control."""
    __tablename__ = "active_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    session_token = Column(String, unique=True, index=True)
    device_name = Column(String, nullable=True)       # "Chrome on Windows 11"
    ip_address = Column(String, nullable=True)
    geo_location = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)


class PrivacyRequest(Base):
    """GDPR / IT Act India privacy requests from employees."""
    __tablename__ = "privacy_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"), nullable=True)
    request_type = Column(String)                # "right_to_be_forgotten", "data_correction", "data_export"
    description = Column(Text, nullable=True)
    status = Column(String, default="pending")   # pending, in_review, completed, rejected
    handler_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)


class ConsentRecord(Base):
    """Timestamped consent grant/revoke history."""
    __tablename__ = "consent_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    consent_type = Column(String)                # "data_processing", "ai_analysis", "marketing", "biometric"
    action = Column(String)                      # "granted", "revoked"
    version = Column(String, nullable=True)      # Policy version e.g. "v2.1"
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class PreQualifiedPool(Base):
    __tablename__ = "prequalified_pool"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), index=True)
    original_job_id = Column(Integer, ForeignKey("internal_jobs.id"))
    application_id = Column(Integer, ForeignKey("internal_job_applications.id"))
    org_id = Column(Integer, ForeignKey("organizations.id"))
    interview_score = Column(Float)
    competency_scores = Column(Text, nullable=True)    # JSON
    matched_skills = Column(Text, nullable=True)       # JSON
    status = Column(String, default="available")        # available, hired, expired
    added_at = Column(DateTime, default=datetime.utcnow)
    notified_for_job_id = Column(Integer, nullable=True)  # If matched to a new role
