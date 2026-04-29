import React, { useState, useEffect } from 'react';
import { Wallet, Download } from 'lucide-react';

export default function Payroll() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     fetch("http://localhost:8001/payroll/generate/1")
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-10 text-white">Calculating Payroll...</div>;

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-black text-slate-900 mb-8">Salary Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Gross Earned</p>
          <p className="text-3xl font-black text-slate-900">${data.calculations.gross}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <p className="text-slate-500 text-xs font-bold uppercase mb-1">Deductions (Tax/PF)</p>
          <p className="text-3xl font-black text-red-500">-${data.calculations.deductions}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border-indigo-500 border-2">
          <p className="text-indigo-600 text-xs font-bold uppercase mb-1">Net Pay</p>
          <p className="text-3xl font-black text-indigo-600">${data.calculations.net}</p>
        </div>
      </div>

  
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-6 bg-slate-900 flex justify-between items-center">
          <span className="text-white font-bold">Official Payslip: {data.month}</span>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
            <Download size={16}/> PDF
          </button>
        </div>
      </div>
    </div>
  );
}