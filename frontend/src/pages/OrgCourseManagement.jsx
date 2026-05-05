import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, PlayCircle, Clock, Star, TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function OrgCourseManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { token } = useAuth();
  
  const [analytics, setAnalytics] = useState([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchAnalytics();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch('http://localhost:8001/courses', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:8001/org/courses/analytics', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStats = (courseTitle) => {
    const courseAnalytics = analytics.filter(a => a.course_title === courseTitle);
    return {
      enrolled: courseAnalytics.length,
      completed: courseAnalytics.filter(a => a.status === 'completed').length
    };
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8001/org/courses', {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newCourse)
      });
      
      if (res.ok) {
        const created = await res.json();
        setCourses([created, ...courses]);
        setIsModalOpen(false);
        setNewCourse({
          title: '',
          category: '',
          description: '',
          duration: '',
          level: 'Beginner',
          video_url: ''
        });
      }
    } catch (err) {
      console.error("Failed to create course:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-slate-50 min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-2">
              <BookOpen size={18} />
              <span className="text-xs uppercase tracking-widest">L&D Admin</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900">Course Management</h1>
            <p className="text-slate-500 mt-2">Upload and manage learning resources for your organization.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAnalyticsModal(true)}
              className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <TrendingUp size={20} className="text-indigo-600" /> View Analytics
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              <Plus size={20} /> Add New Course
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-bold text-slate-700 mb-2">No courses available</h3>
            <p className="text-slate-500">Upload your first course to populate the employee learning portal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => {
              const stats = getStats(course.title);
              return (
                <div key={course.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <PlayCircle size={100} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                        <TrendingUp size={12} /> {course.category}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Participants</span>
                        <div className="flex gap-2">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-slate-400 font-bold">ENROLLED</span>
                            <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded border border-indigo-100">{stats.enrolled}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-slate-400 font-bold">DONE</span>
                            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-100">{stats.completed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>
                    
                    <div className="flex items-center gap-4 mt-6 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        {course.duration || 'N/A'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={16} className="text-amber-400" />
                        {course.rating}
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        course.level === 'Beginner' ? 'bg-emerald-100 text-emerald-700' :
                        course.level === 'Intermediate' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {course.level}
                      </span>
                      <a 
                        href={course.video_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-indigo-600 text-sm font-bold hover:underline flex items-center gap-1"
                      >
                        View Source
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAnalyticsModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl p-8 shadow-2xl relative animate-in slide-in-from-bottom-4">
            <button 
              onClick={() => setShowAnalyticsModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="text-indigo-600" /> Learning Analytics Dashboard
            </h2>
            
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Employee</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Course Title</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Enrolled At</th>
                    <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest">Completed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {analytics.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm font-bold text-slate-700">{entry.employee_name}</td>
                      <td className="p-4 text-sm text-slate-600">{entry.course_title}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                          entry.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {entry.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-slate-400">{entry.enrolled_at?.split('T')[0]}</td>
                      <td className="p-4 text-xs text-slate-400">{entry.completed_at?.split('T')[0] || '-'}</td>
                    </tr>
                  ))}
                  {analytics.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-10 text-center text-slate-400 italic">No participation data available yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black text-slate-900 mb-6">Add Learning Resource</h2>
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Course Title *</label>
                <input 
                  type="text" 
                  required
                  value={newCourse.title}
                  onChange={e => setNewCourse({...newCourse, title: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. Advanced React Patterns"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category *</label>
                  <input 
                    type="text" 
                    required
                    value={newCourse.category}
                    onChange={e => setNewCourse({...newCourse, category: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. Frontend"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Difficulty Level</label>
                  <select 
                    value={newCourse.level}
                    onChange={e => setNewCourse({...newCourse, level: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Duration</label>
                  <input 
                    type="text" 
                    value={newCourse.duration}
                    onChange={e => setNewCourse({...newCourse, duration: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="e.g. 4h 30m"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Video URL *</label>
                  <input 
                    type="url" 
                    required
                    value={newCourse.video_url}
                    onChange={e => setNewCourse({...newCourse, video_url: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="YouTube, Coursera, S3 Link..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea 
                  value={newCourse.description}
                  onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none h-24 resize-none"
                  placeholder="Brief overview of the course..."
                />
              </div>
              
              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white rounded-xl py-3 font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
              >
                Upload Course
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
