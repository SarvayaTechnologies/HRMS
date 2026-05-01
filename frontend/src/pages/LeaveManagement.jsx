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
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'Sick Leave',
    reason: ''
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchRecords();
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
        alert("Leave request submitted successfully");
        setFormData({ start_date: '', end_date: '', leave_type: 'Sick Leave', reason: '' });
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

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 bg-slate-50 min-h-screen">
      <div className="w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="text-indigo-600" size={24} />
          <h2 className="text-2xl font-bold text-slate-800">Apply for Leave</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative group">
              <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  id="start_date_input"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 pl-12 rounded-xl outline-none focus:border-indigo-500 transition-colors custom-date-input" 
                />
                <Calendar 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 cursor-pointer" 
                  size={20} 
                  onClick={() => document.getElementById('start_date_input')?.showPicker?.()}
                />
              </div>
            </div>
            <div className="relative group">
              <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  id="end_date_input"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 pl-12 rounded-xl outline-none focus:border-indigo-500 transition-colors custom-date-input" 
                />
                <Calendar 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 cursor-pointer" 
                  size={20}
                  onClick={() => document.getElementById('end_date_input')?.showPicker?.()}
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
            <select 
              value={formData.leave_type}
              onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="Sick Leave">Sick Leave</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Paid Leave">Paid Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reason</label>
            <textarea 
              required
              value={formData.reason}
              onChange={(e) => setFormData({...formData, reason: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 p-4 rounded-xl outline-none focus:border-indigo-500 transition-colors resize-none" 
              placeholder="Why are you requesting this leave?" 
              rows="4" 
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:bg-indigo-400"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : "Submit Request"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">My Leave History</h3>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="p-4">Type</th>
              <th className="p-4">Duration</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-700">{r.leave_type}</td>
                <td className="p-4 text-slate-500">{r.start_date} to {r.end_date}</td>
                <td className="p-4">
                  {statusBadge(r.status)}
                </td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr>
                <td colSpan="3" className="p-8 text-center text-slate-400">No leave requests found.</td>
              </tr>
            )}
          </tbody>
        </table>
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

  return (
    <div className="p-10 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <Calendar className="text-indigo-600" /> Organization Leave Requests
        </h1>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white text-xs uppercase tracking-widest font-bold">
              <tr>
                <th className="p-6">Employee</th>
                <th className="p-6">Type</th>
                <th className="p-6">Duration</th>
                <th className="p-6">Reason</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <Inbox className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="font-bold text-slate-500">All caught up</p>
                    <p className="text-sm">No leave requests to review.</p>
                  </td>
                </tr>
              ) : (
                pending.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-6">
                      <p className="font-bold text-slate-700">{p.employee_name}</p>
                    </td>
                    <td className="p-6 font-medium text-slate-700">{p.leave_type}</td>
                    <td className="p-6 text-slate-500 whitespace-nowrap text-sm">
                      <div className="font-medium">{p.start_date}</div>
                      <div className="text-xs text-slate-400">to {p.end_date}</div>
                    </td>
                    <td className="p-6 text-slate-600 text-sm italic max-w-xs truncate">"{p.reason}"</td>
                    <td className="p-6">{statusBadge(p.status)}</td>
                    <td className="p-6 text-right">
                      {p.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleAction(p.id, 'approve')}
                            className="flex items-center gap-1 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold text-xs transition-colors"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button 
                            onClick={() => handleAction(p.id, 'reject')}
                            className="flex items-center gap-1 px-3 py-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-bold text-xs transition-colors"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-bold uppercase">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}