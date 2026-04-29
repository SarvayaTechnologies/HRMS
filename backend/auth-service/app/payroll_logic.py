def calculate_monthly_pay(base_salary, total_days, unpaid_days):
    """
    Simple Payroll Logic:
    1. Calculate daily rate
    2. Subtract unpaid leave days
    3. Deduct a flat 10% for Tax/PF for now
    """
    working_days = total_days - unpaid_days
    per_day_pay = base_salary / total_days
    gross_earned = per_day_pay * working_days
    
    deductions = gross_earned * 0.10 
    net_pay = gross_earned - deductions
    
    return {
        "gross": round(gross_earned, 2),
        "deductions": round(deductions, 2),
        "net": round(net_pay, 2)
    }