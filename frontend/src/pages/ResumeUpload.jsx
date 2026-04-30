"use client";
import React, { useState } from 'react';
import { UploadCloud, CheckCircle, BarChart3, User, Loader2 } from 'lucide-react';

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8001/talent/parse-resume", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();
      setData(result.analysis);
    } catch (error) {
      console.error("Error analyzing resume:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 md:p-12 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">AI Talent Acquisition</h1>
          <p className="text-gray-400">Automated resume parsing and intelligent candidate analysis</p>
        </header>
        
        <div className="glass-card p-8 rounded-2xl mb-10 w-full max-w-2xl">
          <label className="block mb-6 relative">
            <div className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-indigo-500/30 rounded-xl bg-indigo-500/5 hover:bg-indigo-500/10 transition-colors cursor-pointer group">
              <UploadCloud className="w-10 h-10 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-sm text-gray-300 font-medium">Click to select or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PDF, DOCX, or TXT up to 10MB</p>
            </div>
            <input 
              type="file" 
              onChange={(e) => setFile(e.target.files[0])} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              accept=".pdf,.doc,.docx,.txt"
            />
          </label>

          {file && (
            <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-medium text-indigo-100 flex-1 truncate">{file.name}</span>
            </div>
          )}

          <button 
            onClick={handleUpload}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-gray-700/50 disabled:text-gray-500 transition-all shadow-lg shadow-indigo-600/20 disabled:shadow-none"
            disabled={loading || !file}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                AI is analyzing...
              </>
            ) : "Analyze Candidate"}
          </button>
        </div>

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Candidate Profile</h3>
              </div>
              <p className="text-2xl font-bold text-white mb-3">{data["Candidate Name"]}</p>
              <p className="text-gray-300 leading-relaxed text-sm md:text-base">{data["Summary"]}</p>
            </div>

            <div className="glass-card p-6 md:p-8 rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Skill Graph</h3>
              </div>
              
              <div className="space-y-4">
                {data["Skill Graph"] && Object.entries(data["Skill Graph"]).map(([skill, level]) => (
                  <div key={skill} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-200 font-medium group-hover:text-white transition-colors">{skill}</span>
                      <span className="text-indigo-400 font-bold">{level}/10</span>
                    </div>
                    <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${level * 10}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}