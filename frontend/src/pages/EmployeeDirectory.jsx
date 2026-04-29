import React, { useState, useEffect } from 'react';

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([
    { id: 1, name: "Jaswanth", dept: "Engineering", role: "AI Lead", email: "jas@hrvaly.com" },
    { id: 2, name: "Sarah Smith", dept: "HR", role: "Talent Lead", email: "sarah@hrvaly.com" }
  ]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Workforce Directory</h1>
          <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700">
            + Add Employee
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Employee</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Department</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{emp.name}</p>
                        <p className="text-xs text-slate-500">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{emp.dept}</td>
                  <td className="p-4 text-slate-600">{emp.role}</td>
                  <td className="p-4">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}