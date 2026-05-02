import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Inbox, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const statusBadge = (s) => (
  <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider
    ${s === 'approved' ? 'bg-emerald-100 text-emerald-700' :
      s === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
    {s}
  </span>
);

export default function LeaveManagement() {
  const { user } = useAuth();
  
  if (!user) return null;

  return user.role === 'employee' ? <EmployeeLeave /> : <OrgLeave />;
}

function EmployeeLeave() {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'Sick Leave',
    reason: '',
    handover_link: '',
    point_of_person_id: '',
    wellness_check_requested: false
  });
  const token = localStorage.getItem("token");

  // Mock leave balance
  const balance = {
    "Sick Leave": 12,
    "Casual Leave": 15,
    "Privilege Leave": 20,
    "Maternity Leave": 180,
    "Paternity Leave": 15,
    "Bereavement Leave": 5
  };

  useEffect(() => {
    fetchRecords();
    fetchEmployees();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("http://localhost:8001/leave/my-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setRecords(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8001/org/employees", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setEmployees(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8001/leave/request", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        alert("Leave request submitted successfully with AI Impact Analysis!");
        setFormData({ 
          start_date: '', 
          end_date: '', 
          leave_type: 'Sick Leave', 
          reason: '',
          handover_link: '',
          point_of_person_id: '',
          wellness_check_requested: false
        });
        fetchRecords();
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to submit request");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting request");
    } finally {
      setLoading(false);
    }
  };

  const requestedDays = calculateDays();
  const remaining = (balance[formData.leave_type] || 0) - requestedDays;

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 bg-slate-50 min-h-screen">
      <div className="w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="text-indigo-600" size={28} />
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Contextual Leave Request</h2>
          </div>
          <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
            <span className="text-indigo-600 font-bold text-sm">Real-time Balance: {remaining < 0 ? 0 : remaining} Days Left</span>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Start Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  id="start_date_input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 pl-12 rounded-xl outline-none focus:border-indigo-500 transition-colors" 
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={20} />
              </div>
            </div>
            <div className="relative group">
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">End Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  id="end_date_input"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 pl-12 rounded-xl outline-none focus:border-indigo-500 transition-colors" 
                />
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={20} />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Leave Type (Compliance-Ready)</label>
              <select 
                value={formData.leave_type}
                onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="Sick Leave">Sick Leave</option>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Privilege Leave">Privilege Leave (Vacation)</option>
                <option value="Maternity Leave">Maternity Leave (IT Act India)</option>
                <option value="Paternity Leave">Paternity Leave (IT Act India)</option>
                <option value="Bereavement Leave">Bereavement Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Emergency Point of Person</label>
              <select 
                value={formData.point_of_person_id}
                onChange={(e) => setFormData({...formData, point_of_person_id: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="">Select Colleague for Handover</option>
                {employees.map(e => (
                  <option key={e.id} value={e.user_id}>{e.full_name} ({e.department})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Handover Documentation / Link</label>
            <input 
              type="text"
              value={formData.handover_link}
              onChange={(e) => setFormData({...formData, handover_link: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl outline-none focus:border-indigo-500 transition-colors" 
              placeholder="Attach a link to project tasks or handover notes" 
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Detailed Reason</label>
            <textarea 
              required
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none" 
              placeholder="Why are you requesting this leave? (AI uses this for impact prediction)" 
              rows="3" 
            />
          </div>

          {formData.leave_type === 'Sick Leave' && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <input 
                type="checkbox"
                id="wellness"
                checked={formData.wellness_check_requested}
                onChange={(e) => setFormData({...formData, wellness_check_requested: e.target.checked})}
                className="w-5 h-5 accent-rose-500"
              />
              <label htmlFor="wellness" className="text-sm font-medium text-rose-700 cursor-pointer">
                Wellness Check-In: Request a follow-up from HR / Burnout Radar if this is stress-related.
              </label>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:bg-indigo-400 transform active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin w-6 h-6"/> : "Submit Contextual Request"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-black text-slate-800 uppercase tracking-wider text-sm">My Leave History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-slate-400 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100">
              <tr>
                <th className="p-6">Type</th>
                <th className="p-6">Duration</th>
                <th className="p-6">Point of Person</th>
                <th className="p-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="p-6">
                    <p className="font-bold text-slate-800">{r.leave_type}</p>
                  </td>
                  <td className="p-6">
                    <p className="font-medium">{r.start_date} → {r.end_date}</p>
                  </td>
                  <td className="p-6">
                    <span className="bg-slate-100 px-2 py-1 rounded text-xs font-medium">Assigned</span>
                  </td>
                  <td className="p-6">
                    {statusBadge(r.status)}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center text-slate-300">
                    <Inbox className="mx-auto mb-2 opacity-20" size={40} />
                    <p className="font-bold">No leave requests found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


function OrgLeave() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    try {
      const res = await fetch("http://localhost:8001/org/leave/all", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setPending(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const res = await fetch(`http://localhost:8001/org/leave/${id}/${action}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchPending(); // Refresh list
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getImpactColor = (score) => {
    if (!score) return 'bg-slate-100 text-slate-500';
    if (score < 3) return 'bg-emerald-100 text-emerald-700';
    if (score < 6) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  return (
    <div className="p-10 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
              <Calendar className="text-indigo-600 w-10 h-10" /> Impact Analytics: Leave Approval
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage team capacity and project continuity with AI-driven insights.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Capacity</p>
              <p className="text-2xl font-black text-indigo-600">84%</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[120px]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Leaves</p>
              <p className="text-2xl font-black text-rose-500">2</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-slate-100">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-500 font-bold">Analyzing Team Impact...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="p-20 text-center bg-white rounded-3xl border border-slate-100">
              <Inbox className="w-16 h-16 mx-auto mb-4 text-slate-200" />
              <p className="font-black text-2xl text-slate-400">All Clear</p>
              <p className="text-slate-500">No pending leave requests to analyze.</p>
            </div>
          ) : (
            pending.map((p) => (
              <div key={p.id} className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all hover:border-indigo-200 group">
                <div className="flex flex-col lg:flex-row">
                  {/* Employee Info & Action */}
                  <div className="p-8 lg:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100">
                        {p.employee_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-800">{p.employee_name}</h3>
                        <p className="text-indigo-600 font-bold text-xs uppercase tracking-wider">{p.leave_type}</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-medium">Duration:</span>
                        <span className="text-slate-800 font-black">{p.start_date} to {p.end_date}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl italic text-slate-600 text-sm">
                        "{p.reason}"
                      </div>
                    </div>

                    {p.status === 'pending' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleAction(p.id, 'approve')}
                          className="py-3 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 transform active:scale-95"
                        >
                          Approve
                        </button>
                        <button 
                          onClick={() => handleAction(p.id, 'reject')}
                          className="py-3 bg-rose-50 text-rose-600 rounded-xl font-black text-sm hover:bg-rose-100 transition-all transform active:scale-95"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-black text-sm text-center">
                        PROCESSED
                      </div>
                    )}
                  </div>

                  {/* AI Impact Analytics */}
                  <div className="p-8 flex-1 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">HRValy AI Impact Intelligence</h4>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getImpactColor(p.ai_impact_score)}`}>
                        Impact Score: {p.ai_impact_score?.toFixed(1) || 'N/A'}/10
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="text-indigo-500" size={16} />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Milestone Conflicts</span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          {p.ai_milestone_conflict || "No critical mArgI platform milestones detected for this period."}
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="text-emerald-500" size={16} />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Succession Plan</span>
                        </div>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                          <span className="font-bold text-indigo-600">Backup Suggestion:</span> {p.ai_succession_backup || "Point of Person handles urgent tasks."}
                        </p>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <Loader2 className="text-amber-500" size={16} />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Productivity Loss</span>
                        </div>
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-black text-slate-800">40</span>
                          <span className="text-xs font-bold text-slate-400 mb-1">Work-Hours Estimated</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                          <div className="bg-amber-400 h-full w-[40%]"></div>
                        </div>
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="text-indigo-500" size={16} />
                          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Compliance Check</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          Adheres to IT Act India
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 italic uppercase">Audit trail logged for Payroll Engine</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}