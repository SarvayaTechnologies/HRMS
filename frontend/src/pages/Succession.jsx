import React, { useState, useEffect } from 'react';
import { ShieldAlert, Inbox, Loader, Zap, Users, Crosshair, AlertTriangle, PlayCircle, Eye, Activity, Award } from 'lucide-react';

export default function Succession() {
  const [pipelineData, setPipelineData] = useState(null);
  const [nineBox, setNineBox] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shadowScore, setShadowScore] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [pipelineRes, nineBoxRes] = await Promise.all([
        fetch('http://localhost:8001/succession/org-pipeline', { headers }),
        fetch('http://localhost:8001/performance/nine-box', { headers })
      ]);

      const pData = await pipelineRes.json();
      const nData = await nineBoxRes.json();
      
      setPipelineData(pData);
      setNineBox(nData);
    } catch (error) {
      console.error('Error fetching succession intelligence:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerShadowPipeline = async (employeeId, targetRole) => {
    setSimulating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8001/succession/trigger-shadow', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ employee_id: employeeId, target_role: targetRole })
      });
      const data = await res.json();
      setShadowScore(data);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  // Group nine-box employees by category
  const gridMapping = {
    'High Pro': [], 'Future Star': [], 'The STAR': [],
    'Dilemma': [], 'Core Employee': [], 'High Performer': [],
    'Talent Risk': [], 'Inconsistent': [], 'Work Horse': []
  };

  if (nineBox && nineBox.grid) {
    nineBox.grid.forEach(emp => {
      if (gridMapping[emp.category]) {
        gridMapping[emp.category].push(emp);
      }
    });
  }

  const GridBox = ({ title, color, employees }) => (
    <div className={`p-4 border border-slate-200 min-h-[140px] rounded-xl ${color} flex flex-col gap-2 shadow-inner transition-all hover:shadow-md`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase text-slate-500">{title}</span>
        <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full text-slate-600">{employees.length}</span>
      </div>
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[100px] no-scrollbar">
        {employees.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-400 italic">No employees</p>
          </div>
        ) : (
          employees.map(emp => (
            <div key={emp.employee_id} className="bg-white/80 p-2 rounded-lg border border-slate-100 flex justify-between items-center group cursor-pointer">
              <div>
                <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                <p className="text-[9px] text-slate-500">{emp.role}</p>
              </div>
              {(title === 'The STAR' || title === 'Future Star') && (
                <button 
                  onClick={() => triggerShadowPipeline(emp.employee_id, "Executive Leadership")}
                  className="bg-indigo-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Trigger Shadow Pipeline Simulation"
                >
                  <PlayCircle size={12} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pipeline Intelligence Command Center</h1>
            <p className="text-slate-500 mt-1">Live predictive mapping and shadow simulations for organizational succession.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <Activity className="text-indigo-600" size={20} />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Bench Strength</p>
              <p className="text-lg font-black text-slate-800">
                {pipelineData?.bench_strength?.reduce((acc, curr) => acc + curr.ready_now + curr.ready_1yr, 0) || 0} <span className="text-sm font-medium text-slate-500">Ready</span>
              </p>
            </div>
          </div>
        </div>

        {/* Intelligence Highlights */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Bench Strength */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Users className="text-blue-500" size={20} />
              <h3 className="font-bold text-slate-800">Critical Bench Strength</h3>
            </div>
            <div className="space-y-4">
              {pipelineData?.bench_strength?.map((bench, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-700">{bench.role}</p>
                  <div className="flex gap-4 mt-2">
                    <div className="text-center">
                      <p className="text-lg font-black text-green-600">{bench.ready_now}</p>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">Ready Now</p>
                    </div>
                    <div className="text-center border-l border-slate-200 pl-4">
                      <p className="text-lg font-black text-amber-500">{bench.ready_1yr}</p>
                      <p className="text-[10px] uppercase text-slate-400 font-bold">1 Yr Out</p>
                    </div>
                  </div>
                </div>
              ))}
              {!pipelineData?.bench_strength?.length && <p className="text-sm text-slate-500 italic">No bench data.</p>}
            </div>
          </div>

          {/* Attrition Risks & Overlaps */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-rose-500" size={20} />
              <h3 className="font-bold text-slate-800">Pipeline Risks & Overlaps</h3>
            </div>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {pipelineData?.succession_gaps?.map((gap, idx) => (
                <div key={idx} className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-sm">
                  <span className="font-bold text-rose-700">Gap Alert: </span>
                  <span className="text-rose-600">{gap.alert} ({gap.critical_role})</span>
                </div>
              ))}
              {pipelineData?.attrition_risks?.map((risk, idx) => (
                <div key={idx} className="bg-amber-50 border border-amber-100 p-3 rounded-lg text-sm">
                  <span className="font-bold text-amber-700">Flight Risk: {risk.employee_name}</span>
                  <p className="text-amber-600 text-xs mt-1">{risk.reason}</p>
                </div>
              ))}
              {pipelineData?.skills_overlap_analysis?.map((overlap, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm">
                  <span className="font-bold text-slate-700">Overlap: {overlap.employee_name}</span>
                  <p className="text-slate-500 text-xs mt-1">{overlap.issue}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shadow Pipeline Result */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={100} />
            </div>
            <div className="flex items-center gap-2 mb-4 relative z-10">
              <Crosshair className="text-indigo-200" size={20} />
              <h3 className="font-bold text-white">The Shadow Pipeline</h3>
            </div>
            {simulating ? (
              <div className="flex flex-col items-center justify-center h-40 gap-3 relative z-10">
                <Loader className="animate-spin text-white" size={30} />
                <p className="text-sm text-indigo-200 font-medium">Generating Autonomous Simulation...</p>
              </div>
            ) : shadowScore ? (
              <div className="relative z-10 space-y-3">
                <div className="flex items-center gap-4 bg-indigo-700/50 p-4 rounded-xl border border-indigo-500/50">
                  <div className="text-center">
                    <p className="text-[10px] text-indigo-200 font-bold uppercase mb-1">Shadow Score</p>
                    <p className="text-4xl font-black">{shadowScore.predicted_shadow_score}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{shadowScore.scenario_title}</p>
                    <p className="text-xs text-indigo-200 line-clamp-2 mt-1">{shadowScore.scenario_description}</p>
                  </div>
                </div>
                <div className="bg-white text-slate-800 p-4 rounded-xl text-sm">
                  <p className="font-bold mb-1 flex items-center gap-1"><Eye size={14}/> Readiness Proof</p>
                  <p className="text-xs text-slate-600">{shadowScore.readiness_proof}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-indigo-600">Action: {shadowScore.recommended_action}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 text-center h-40 flex flex-col items-center justify-center bg-indigo-700/30 rounded-xl border border-indigo-500/30 border-dashed">
                <PlayCircle size={32} className="text-indigo-300 mb-2" />
                <p className="text-sm font-medium text-indigo-100">Select a Star in the 9-Box grid below to run a micro-gig leadership simulation.</p>
              </div>
            )}
          </div>
        </div>

        {/* 9-Box Grid */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Award size={20} className="text-indigo-600"/> 9-Box Matrix</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2 bg-slate-50 py-1 rounded-md border border-slate-100">
              Potential ↑ · Performance →
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <GridBox title="High Pro" color="bg-indigo-50/40" employees={gridMapping['High Pro']} />
            <GridBox title="Future Star" color="bg-indigo-100/50 border-indigo-200" employees={gridMapping['Future Star']} />
            <GridBox title="The STAR" color="bg-indigo-200/50 border-indigo-300" employees={gridMapping['The STAR']} />
            
            <GridBox title="Dilemma" color="bg-slate-50/50" employees={gridMapping['Dilemma']} />
            <GridBox title="Core Employee" color="bg-slate-50/80" employees={gridMapping['Core Employee']} />
            <GridBox title="High Performer" color="bg-indigo-50/40" employees={gridMapping['High Performer']} />
            
            <GridBox title="Talent Risk" color="bg-rose-50/30 border-rose-100" employees={gridMapping['Talent Risk']} />
            <GridBox title="Inconsistent" color="bg-slate-50/50" employees={gridMapping['Inconsistent']} />
            <GridBox title="Work Horse" color="bg-slate-50/80" employees={gridMapping['Work Horse']} />
          </div>
        </div>
      </div>
    </div>
  );
}