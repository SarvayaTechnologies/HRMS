import React, { useState, useEffect } from 'react';
import { UserPlus, X, Loader2, CheckCircle } from 'lucide-react';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const token = localStorage.getItem("token");

  const fetchEmployees = async () => {
    try {
      const res = await fetch("http://localhost:8001/org/employees", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setAdding(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("http://localhost:8001/org/add-employee", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ email: newEmail, full_name: newName || newEmail.split("@")[0] }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.detail || "Failed to add employee");
        setAdding(false);
        return;
      }

      setSuccessMsg(`${newEmail} added successfully! They can now set up their password at the Employee Login page.`);
      setNewEmail("");
      setNewName("");
      setAdding(false);
      fetchEmployees();

      // Auto-close after 3 seconds
      setTimeout(() => { setShowModal(false); setSuccessMsg(""); }, 3000);
    } catch (err) {
      setErrorMsg("Could not connect to the server");
      setAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Workforce Directory</h1>
          <button 
            onClick={() => { setShowModal(true); setErrorMsg(""); setSuccessMsg(""); }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <UserPlus size={18} />
            Add Employee
          </button>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Loading employees...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-400">
                    No employees added yet. Click "Add Employee" to get started.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {emp.full_name?.[0]?.toUpperCase() || emp.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{emp.full_name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">Employee</td>
                    <td className="p-4">
                      {emp.has_password ? (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold">Pending Setup</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-900 mb-1">Add New Employee</h2>
            <p className="text-slate-500 text-sm mb-6">
              The employee will receive access to login via the Employee Portal.
            </p>

            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
                <CheckCircle size={18} className="mt-0.5 shrink-0" />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">
                {errorMsg}
              </div>
            )}

            {!successMsg && (
              <form onSubmit={handleAddEmployee} className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase mb-2">Employee Email *</label>
                  <input 
                    type="email" 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-indigo-500 outline-none transition" 
                    placeholder="employee@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-xs font-bold uppercase mb-2">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:border-indigo-500 outline-none transition" 
                    placeholder="John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  disabled={adding}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {adding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Add Employee
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}