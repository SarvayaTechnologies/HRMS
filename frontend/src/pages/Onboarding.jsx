import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, Briefcase, Building2, Calendar, Users, MapPin, 
  CreditCard, Phone, Shield, Mail, CheckCircle2, Loader2,
  ChevronRight, ChevronLeft, Sparkles
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Identification', icon: <User size={18}/>, desc: 'Your basic work identity' },
  { id: 2, title: 'Organization', icon: <Building2 size={18}/>, desc: 'Team & reporting structure' },
  { id: 3, title: 'Compliance', icon: <Shield size={18}/>, desc: 'Tax, ID & banking details' },
  { id: 4, title: 'Contact', icon: <Phone size={18}/>, desc: 'Personal & emergency contacts' },
];

export default function Onboarding() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [userName, setUserName] = useState('');

  const [form, setForm] = useState({
    employee_code: '',
    job_title: '',
    department: '',
    date_of_joining: '',
    reporting_manager: '',
    employment_type: '',
    work_location: '',
    pan_number: '',
    aadhaar_number: '',
    bank_account: '',
    bank_ifsc: '',
    phone_number: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    personal_email: '',
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('http://localhost:8001/employee/onboarding-status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setUserName(data.full_name || '');
      if (data.onboarding_completed) {
        navigate('/employee', { replace: true });
        return;
      }
      // Pre-fill any existing data
      const dataRes = await fetch('http://localhost:8001/employee/onboarding-data', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (dataRes.ok) {
        const existing = await dataRes.json();
        setForm(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(existing).filter(([k, v]) => k !== 'onboarding_completed' && v)
          )
        }));
      }
    } catch (e) {
      console.error('Failed to check onboarding status:', e);
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:8001/employee/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setDone(true);
        setTimeout(() => navigate('/employee', { replace: true }), 3000);
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to submit onboarding');
      }
    } catch (e) {
      alert('Could not connect to server');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white mb-3">Welcome Aboard!</h1>
          <p className="text-slate-400 leading-relaxed">
            Your onboarding is complete, <span className="text-emerald-400 font-semibold">{userName}</span>. 
            Redirecting to your dashboard...
          </p>
          <div className="mt-6 flex justify-center">
            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition text-sm";
  const labelCls = "block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1";
  const selectCls = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-emerald-500 outline-none transition text-sm appearance-none";

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-3xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="text-emerald-400" size={14} />
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Employee Onboarding</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Welcome, <span className="text-emerald-400">{userName || 'Team Member'}</span>!
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Complete your profile to get started with HRValy.</p>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <button
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  step === s.id
                    ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20'
                    : step > s.id
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-slate-500 border border-white/5'
                }`}
              >
                {step > s.id ? <CheckCircle2 size={14} /> : s.icon}
                <span className="hidden md:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px ${step > s.id ? 'bg-emerald-500/40' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>

          {/* Step 1: Identification */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <User size={20} className="text-emerald-400" /> Essential Identification
                </h2>
                <p className="text-slate-500 text-sm mt-1">Your unique identity within the organization.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Employee ID *</label>
                  <input className={inputCls} placeholder="e.g. EMP-001" value={form.employee_code} onChange={update('employee_code')} />
                </div>
                <div>
                  <label className={labelCls}>Official Job Title *</label>
                  <input className={inputCls} placeholder="e.g. Senior Backend Developer" value={form.job_title} onChange={update('job_title')} />
                </div>
                <div>
                  <label className={labelCls}>Department / Team *</label>
                  <input className={inputCls} placeholder="e.g. Engineering" value={form.department} onChange={update('department')} />
                </div>
                <div>
                  <label className={labelCls}>Date of Joining *</label>
                  <input type="date" className={inputCls} value={form.date_of_joining} onChange={update('date_of_joining')} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Organization */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Building2 size={20} className="text-emerald-400" /> Organizational Hierarchy
                </h2>
                <p className="text-slate-500 text-sm mt-1">Your reporting structure and work arrangement.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Reporting Manager</label>
                  <input className={inputCls} placeholder="Manager's full name" value={form.reporting_manager} onChange={update('reporting_manager')} />
                </div>
                <div>
                  <label className={labelCls}>Employment Type *</label>
                  <select className={selectCls} value={form.employment_type} onChange={update('employment_type')}>
                    <option value="" className="bg-slate-900">Select type</option>
                    <option value="Full-time" className="bg-slate-900">Full-time</option>
                    <option value="Part-time" className="bg-slate-900">Part-time</option>
                    <option value="Contract" className="bg-slate-900">Contract</option>
                    <option value="Intern" className="bg-slate-900">Intern</option>
                    <option value="Freelance" className="bg-slate-900">Freelance</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Work Location</label>
                  <input className={inputCls} placeholder="e.g. Hyderabad Office / Remote" value={form.work_location} onChange={update('work_location')} />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Compliance */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Shield size={20} className="text-emerald-400" /> Compliance & Payroll
                </h2>
                <p className="text-slate-500 text-sm mt-1">Tax, identity verification, and banking details for payroll.</p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 mb-2">
                <p className="text-amber-400/80 text-xs font-medium">
                  🔒 Your data is encrypted and only accessible to authorized HR personnel.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>PAN Number</label>
                  <input className={inputCls} placeholder="ABCDE1234F" value={form.pan_number} onChange={update('pan_number')} maxLength={10} style={{ textTransform: 'uppercase' }} />
                </div>
                <div>
                  <label className={labelCls}>Aadhaar Number</label>
                  <input className={inputCls} placeholder="1234 5678 9012" value={form.aadhaar_number} onChange={update('aadhaar_number')} maxLength={14} />
                </div>
                <div>
                  <label className={labelCls}>Bank Account Number</label>
                  <input className={inputCls} placeholder="Account number" value={form.bank_account} onChange={update('bank_account')} />
                </div>
                <div>
                  <label className={labelCls}>Bank IFSC Code</label>
                  <input className={inputCls} placeholder="e.g. SBIN0001234" value={form.bank_ifsc} onChange={update('bank_ifsc')} maxLength={11} style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Phone size={20} className="text-emerald-400" /> Contact & Personal Info
                </h2>
                <p className="text-slate-500 text-sm mt-1">Communication and emergency contact details.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Phone Number *</label>
                  <input className={inputCls} placeholder="+91 98765 43210" value={form.phone_number} onChange={update('phone_number')} />
                </div>
                <div>
                  <label className={labelCls}>Personal Email</label>
                  <input type="email" className={inputCls} placeholder="personal@gmail.com" value={form.personal_email} onChange={update('personal_email')} />
                </div>
                <div>
                  <label className={labelCls}>Emergency Contact Name *</label>
                  <input className={inputCls} placeholder="Contact person's name" value={form.emergency_contact_name} onChange={update('emergency_contact_name')} />
                </div>
                <div>
                  <label className={labelCls}>Emergency Contact Phone *</label>
                  <input className={inputCls} placeholder="+91 98765 43210" value={form.emergency_contact_phone} onChange={update('emergency_contact_phone')} />
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-10 pt-6 border-t border-white/5">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 px-6 py-3 bg-white/5 text-slate-400 hover:text-white rounded-xl transition-all font-bold text-xs uppercase tracking-widest border border-white/5 hover:border-white/20"
              >
                <ChevronLeft size={16} /> Previous
              </button>
            ) : <div />}

            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-900 hover:bg-emerald-400 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:opacity-50 rounded-xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle2 size={16} /> Complete Onboarding</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Progress text */}
        <p className="text-center text-slate-600 text-xs mt-4 font-medium">
          Step {step} of 4 — {STEPS[step - 1].desc}
        </p>
      </div>
    </div>
  );
}
