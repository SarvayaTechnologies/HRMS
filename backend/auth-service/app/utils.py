import hashlib
from datetime import datetime
from sqlalchemy.orm import Session
from . import models

def get_last_audit_hash(db: Session, org_id: int) -> str:
    last_log = db.query(models.AuditLog).filter(models.AuditLog.org_id == org_id).order_by(models.AuditLog.id.desc()).first()
    if last_log and last_log.entry_hash:
        return last_log.entry_hash
    return "GENESIS_HASH"

def log_action(db: Session, user_id: int, action: str, target_id=None, ip=None, org_id=None, target_resource=None, previous_value=None, new_value=None, geo_location=None, severity="info"):
    # Create the log entry first to get basic structure
    new_log = models.AuditLog(
        user_id=user_id,
        org_id=org_id,
        action=action,
        target_id=str(target_id) if target_id else None,
        target_resource=target_resource,
        previous_value=previous_value,
        new_value=new_value,
        ip_address=ip,
        geo_location=geo_location,
        severity=severity,
        timestamp=datetime.utcnow()
    )
    
    # Blockchain-style hash integrity
    prev_hash = get_last_audit_hash(db, org_id)
    raw_content = f"{user_id}|{org_id}|{action}|{target_id}|{target_resource}|{new_log.timestamp.isoformat()}|{prev_hash}"
    new_log.entry_hash = hashlib.sha256(raw_content.encode('utf-8')).hexdigest()
    
    db.add(new_log)
    db.commit()


def log_data_access(db: Session, accessed_by: int, employee_id: int, data_field: str, org_id=None, access_reason=None, ip=None):
    """Logs when an admin/manager views an employee's sensitive data"""
    new_access = models.DataAccessLog(
        accessed_by=accessed_by,
        employee_id=employee_id,
        org_id=org_id,
        data_field=data_field,
        access_reason=access_reason,
        ip_address=ip,
        timestamp=datetime.utcnow()
    )
    db.add(new_access)
    db.commit()