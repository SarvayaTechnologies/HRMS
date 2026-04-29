from . import models

def log_action(db, user_id, action, target_id=None, ip=None):
    new_log = models.AuditLog(
        user_id=user_id,
        action=action,
        target_id=str(target_id),
        ip_address=ip
    )
    db.add(new_log)
    db.commit()