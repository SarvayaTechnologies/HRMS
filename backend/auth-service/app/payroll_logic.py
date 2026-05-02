"""
HRValy Enterprise Payroll Engine
================================
Indian IT Act compliant payroll calculation with:
- CTC → Gross → Net breakdown
- Old & New Tax Regime TDS slabs (FY 2025-26)
- EPF (Employee Provident Fund) @ 12%
- Professional Tax (state-wise, defaulting to Karnataka/Telangana)
- HRA exemption calculation
- LOP (Loss of Pay) deduction from attendance data
- Anomaly detection for unusual payroll spikes
"""

from datetime import datetime, date
import calendar


# ─── Indian Tax Slabs FY 2025-26 ───────────────────────────────────────────
NEW_REGIME_SLABS = [
    (400000,   0.00),   # 0-4L: Nil
    (400000,   0.05),   # 4-8L: 5%
    (400000,   0.10),   # 8-12L: 10%
    (400000,   0.15),   # 12-16L: 15%
    (400000,   0.20),   # 16-20L: 20%
    (400000,   0.25),   # 20-24L: 25%
    (float('inf'), 0.30),  # >24L: 30%
]

OLD_REGIME_SLABS = [
    (250000,   0.00),   # 0-2.5L: Nil
    (250000,   0.05),   # 2.5-5L: 5%
    (500000,   0.20),   # 5-10L: 20%
    (float('inf'), 0.30),  # >10L: 30%
]

# Standard deduction under new regime
STANDARD_DEDUCTION = 75000

# EPF rates
EPF_EMPLOYEE_RATE = 0.12  # 12% of Basic
EPF_EMPLOYER_RATE = 0.12  # 12% of Basic (not deducted from salary)
EPF_BASIC_LIMIT = 15000   # PF calculated on max ₹15,000 Basic

# Professional Tax (monthly, Telangana/AP/Karnataka pattern)
def get_professional_tax(monthly_gross):
    """Professional Tax based on monthly gross salary."""
    if monthly_gross <= 15000:
        return 0
    elif monthly_gross <= 20000:
        return 150
    else:
        return 200  # Max ₹200/month for most Indian states


def calculate_annual_tds(annual_taxable, regime="new"):
    """Calculate annual TDS based on tax regime."""
    slabs = NEW_REGIME_SLABS if regime == "new" else OLD_REGIME_SLABS
    tax = 0
    remaining = annual_taxable
    
    for slab_limit, rate in slabs:
        if remaining <= 0:
            break
        taxable_in_slab = min(remaining, slab_limit)
        tax += taxable_in_slab * rate
        remaining -= taxable_in_slab
    
    # 4% Health & Education Cess
    cess = tax * 0.04
    total_tax = tax + cess
    
    # Rebate u/s 87A: No tax if income ≤ ₹12L (new regime) or ≤ ₹5L (old)
    if regime == "new" and annual_taxable <= 1200000:
        total_tax = 0
    elif regime == "old" and annual_taxable <= 500000:
        total_tax = 0
    
    return round(total_tax, 2)


def build_salary_structure(annual_ctc):
    """
    Break down CTC into Indian salary components.
    Standard split: Basic=40%, HRA=20%, Special=28%, EPF employer=12%
    """
    basic_annual = round(annual_ctc * 0.40, 2)
    hra_annual = round(annual_ctc * 0.20, 2)
    employer_pf = round(min(basic_annual, EPF_BASIC_LIMIT * 12) * EPF_EMPLOYER_RATE, 2)
    special_annual = round(annual_ctc - basic_annual - hra_annual - employer_pf, 2)
    
    return {
        "annual_ctc": annual_ctc,
        "basic_annual": basic_annual,
        "hra_annual": hra_annual,
        "special_allowance_annual": special_annual,
        "employer_pf_annual": employer_pf,
        "basic_monthly": round(basic_annual / 12, 2),
        "hra_monthly": round(hra_annual / 12, 2),
        "special_allowance_monthly": round(special_annual / 12, 2),
        "employer_pf_monthly": round(employer_pf / 12, 2),
    }


def calculate_monthly_payroll(
    annual_ctc,
    total_days_in_month=30,
    lop_days=0,
    tax_regime="new",
    investment_declarations=0,  # 80C + 80D total for old regime
    performance_bonus=0,
    month_name=None,
):
    """
    Complete monthly payroll calculation for an Indian employee.
    
    Returns a detailed payslip breakdown.
    """
    if month_name is None:
        month_name = datetime.utcnow().strftime("%B %Y")
    
    structure = build_salary_structure(annual_ctc)
    
    # ── Monthly components (before LOP) ──
    basic_monthly = structure["basic_monthly"]
    hra_monthly = structure["hra_monthly"]
    special_monthly = structure["special_allowance_monthly"]
    
    # ── LOP deduction ──
    working_days = total_days_in_month - lop_days
    lop_factor = working_days / total_days_in_month if total_days_in_month > 0 else 1
    
    earned_basic = round(basic_monthly * lop_factor, 2)
    earned_hra = round(hra_monthly * lop_factor, 2)
    earned_special = round(special_monthly * lop_factor, 2)
    earned_bonus = round(performance_bonus, 2)
    
    gross_earned = round(earned_basic + earned_hra + earned_special + earned_bonus, 2)
    lop_deduction = round((basic_monthly + hra_monthly + special_monthly) - (earned_basic + earned_hra + earned_special), 2)
    
    # ── Employee PF ──
    pf_base = min(earned_basic, EPF_BASIC_LIMIT)
    epf_employee = round(pf_base * EPF_EMPLOYEE_RATE, 2)
    
    # ── Professional Tax ──
    professional_tax = get_professional_tax(gross_earned)
    
    # ── TDS (monthly projection) ──
    annual_gross = gross_earned * 12
    annual_taxable = annual_gross - STANDARD_DEDUCTION - (epf_employee * 12)
    
    if tax_regime == "old":
        annual_taxable -= investment_declarations  # 80C, 80D deductions
    
    annual_taxable = max(annual_taxable, 0)
    annual_tds = calculate_annual_tds(annual_taxable, regime=tax_regime)
    monthly_tds = round(annual_tds / 12, 2)
    
    # ── Total Deductions ──
    total_deductions = round(epf_employee + professional_tax + monthly_tds, 2)
    
    # ── Net Pay ──
    net_pay = round(gross_earned - total_deductions, 2)
    
    # ── Employer contributions (not deducted, but shown for CTC visibility) ──
    employer_pf = round(min(earned_basic, EPF_BASIC_LIMIT) * EPF_EMPLOYER_RATE, 2)
    
    return {
        "month": month_name,
        "total_days": total_days_in_month,
        "working_days": working_days,
        "lop_days": lop_days,
        
        # Earnings
        "earnings": {
            "basic": earned_basic,
            "hra": earned_hra,
            "special_allowance": earned_special,
            "performance_bonus": earned_bonus,
            "gross": gross_earned,
        },
        
        # Deductions
        "deductions": {
            "epf_employee": epf_employee,
            "professional_tax": professional_tax,
            "tds": monthly_tds,
            "lop_deduction": lop_deduction,
            "total": total_deductions,
        },
        
        # Employer side (CTC visibility)
        "employer": {
            "epf_employer": employer_pf,
        },
        
        # Summary
        "net_pay": net_pay,
        "annual_ctc": annual_ctc,
        "tax_regime": tax_regime,
        
        # CTC breakdown reference
        "structure": structure,
    }


def detect_anomalies(current_payroll_list, threshold_pct=50):
    """
    Flag unusual payroll spikes across employees.
    Returns a list of anomaly alerts.
    """
    if not current_payroll_list:
        return []
    
    nets = [p["net_pay"] for p in current_payroll_list if p["net_pay"] > 0]
    if not nets:
        return []
    
    avg_net = sum(nets) / len(nets)
    alerts = []
    
    for p in current_payroll_list:
        # Flag if an employee's net is >threshold% above average
        if avg_net > 0 and p["net_pay"] > avg_net * (1 + threshold_pct / 100):
            alerts.append({
                "type": "HIGH_PAY_SPIKE",
                "severity": "warning",
                "employee": p.get("name", "Unknown"),
                "message": f"Net pay ₹{p['net_pay']:,.0f} is {((p['net_pay']/avg_net - 1)*100):.0f}% above department average (₹{avg_net:,.0f})",
            })
        
        # Flag unusually high LOP
        if p.get("lop_days", 0) > 5:
            alerts.append({
                "type": "HIGH_LOP",
                "severity": "info",
                "employee": p.get("name", "Unknown"),
                "message": f"{p['lop_days']} LOP days detected — verify attendance records",
            })
        
        # Flag zero TDS on high salary
        if p.get("gross", 0) > 50000 and p.get("tds", 0) == 0:
            alerts.append({
                "type": "ZERO_TDS",
                "severity": "info",
                "employee": p.get("name", "Unknown"),
                "message": f"No TDS deducted on gross ₹{p.get('gross', 0):,.0f} — likely under rebate threshold",
            })
    
    return alerts


# Legacy compatibility wrapper
def calculate_monthly_pay(base_salary, total_days, unpaid_days):
    """Legacy function maintained for backward compatibility."""
    result = calculate_monthly_payroll(
        annual_ctc=base_salary * 12,
        total_days_in_month=total_days,
        lop_days=unpaid_days,
    )
    return {
        "gross": result["earnings"]["gross"],
        "deductions": result["deductions"]["total"],
        "net": result["net_pay"],
    }