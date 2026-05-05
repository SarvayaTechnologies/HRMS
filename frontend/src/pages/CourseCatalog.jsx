import React, { useState, useEffect } from 'react';
import { BookOpen, Search, PlayCircle, Clock, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchCourses();
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId, videoUrl) => {
    try {
      await fetch(`http://localhost:8001/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchCourses();
      if (videoUrl) window.open(videoUrl, '_blank');
    } catch (err) {
      console.error(err);
    }
  };

  const handleComplete = async (e, courseId) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await fetch(`http://localhost:8001/courses/${courseId}/complete`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 bg-[#050505] min-h-screen flex items-center justify-center">
        <div className="text-indigo-400 font-bold">Loading Courses...</div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[#050505] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold mb-2">
              <BookOpen size={18} />
              <span className="text-xs uppercase tracking-widest">L&D Portal</span>
            </div>
            <h1 className="text-4xl font-black text-white">Course Catalog</h1>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search courses..." 
              className="bg-[#111827] border border-slate-800 text-white pl-10 pr-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500 w-64 transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div 
              key={course.id} 
              onClick={() => handleEnroll(course.id, course.video_url)}
              className="bg-[#111827] border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <PlayCircle size={100} />
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
                    <TrendingUp size={12} /> {course.category}
                  </div>
                  {course.enrollment_status === 'completed' && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20">
                      COMPLETED
                    </span>
                  )}
                  {course.enrollment_status === 'enrolled' && (
                    <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-indigo-500/20">
                      IN PROGRESS
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-2">
                  {course.title}
                </h3>
                
                <div className="flex items-center gap-4 mt-6 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock size={16} className="text-slate-500" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-amber-400" />
                    {course.rating}
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                    course.level === 'Beginner' ? 'bg-emerald-500/10 text-emerald-400' :
                    course.level === 'Intermediate' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-rose-500/10 text-rose-400'
                  }`}>
                    {course.level}
                  </span>
                  
                  {course.enrollment_status === 'enrolled' ? (
                    <button 
                      onClick={(e) => handleComplete(e, course.id)}
                      className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
                    >
                      Mark Complete
                    </button>
                  ) : (
                    <div className="text-indigo-400 text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {course.enrollment_status === 'completed' ? 'Re-watch' : 'Enroll Now'} <PlayCircle size={16} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
