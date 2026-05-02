import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mic, MicOff, Loader2, CheckCircle2, ChevronRight, Briefcase, Play, ArrowRight, RotateCcw, Send } from 'lucide-react';

export default function InterviewSession() {
  const { token } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);

  // Interview state machine: "select" → "ready" → "interview" → "submitting" → "done"
  const [phase, setPhase] = useState("select");
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  
  // Speech recognition refs
  const recognitionRef = useRef(null);
  const wantRecordingRef = useRef(false);
  const accumulatedTextRef = useRef("");
  const restartTimerRef = useRef(null);
  const restartCountRef = useRef(0);
  const MAX_SILENT_RESTARTS = 30;
  
  // MediaRecorder fallback refs (for Firefox, Brave, etc.)
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Detect browser support
  const hasSpeechAPI = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    fetchInterviews();
    return () => {
      wantRecordingRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
      }
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch("http://localhost:8001/employee/pending-interviews", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setInterviews(data);
    } catch (e) {
      console.error("Failed to fetch interviews", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job) => {
    setSelectedJob(job);
    setPhase("ready");
  };

  const handleStartInterview = async () => {
    setQuestionsLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/employee/interview/${selectedJob.job_id}/generate-questions`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      setQuestions(data.questions || []);
      setAnswers([]);
      setCurrentQ(0);
      setCurrentAnswer("");
      setPhase("interview");
    } catch (e) {
      alert("Failed to generate questions. Please try again.");
    } finally {
      setQuestionsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════
  // METHOD A: Native Web Speech API (Chrome, Edge)
  // ═══════════════════════════════════════════════════
  const doStartRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition || !wantRecordingRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event) => {
      restartCountRef.current = 0;
      let interim = "";
      let accumulated = accumulatedTextRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          accumulated = (accumulated + " " + transcript).trim();
          accumulatedTextRef.current = accumulated;
        } else {
          interim = transcript;
        }
      }
      setCurrentAnswer(interim ? (accumulated + " " + interim).trim() : accumulated);
    };

    recognition.onerror = (event) => {
      const fatal = ['not-allowed', 'service-not-allowed', 'language-not-supported'];
      if (fatal.includes(event.error)) {
        wantRecordingRef.current = false;
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please allow microphone permissions.");
        }
      }
    };

    recognition.onend = () => {
      if (!wantRecordingRef.current) { setIsRecording(false); return; }
      restartCountRef.current += 1;
      if (restartCountRef.current > MAX_SILENT_RESTARTS) {
        wantRecordingRef.current = false;
        setIsRecording(false);
        return;
      }
      restartTimerRef.current = setTimeout(() => {
        if (wantRecordingRef.current) doStartRecognition();
        else setIsRecording(false);
      }, 300);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setTimeout(() => {
        if (wantRecordingRef.current) {
          try { recognition.start(); } catch(e2) {
            wantRecordingRef.current = false;
            setIsRecording(false);
          }
        }
      }, 500);
    }
  };

  // ═══════════════════════════════════════════════════
  // METHOD B: MediaRecorder + Backend Transcription
  // (Firefox, Brave, Safari, etc.)
  // ═══════════════════════════════════════════════════
  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Find a supported mime type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMime = '';
      for (const mt of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mt)) { selectedMime = mt; break; }
      }

      const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : {});
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all mic tracks
        stream.getTracks().forEach(t => t.stop());
        
        if (audioChunksRef.current.length === 0) return;

        // Send audio to backend for transcription
        setIsTranscribing(true);
        try {
          const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const formData = new FormData();
          formData.append('file', blob, 'recording.webm');

          const res = await fetch('http://localhost:8001/employee/transcribe-audio', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              const newText = (currentAnswer + " " + data.text).trim();
              setCurrentAnswer(newText);
              accumulatedTextRef.current = newText;
            }
          }
        } catch (e) {
          console.error("Transcription failed:", e);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // collect data every second
      setIsRecording(true);
    } catch (e) {
      console.error("MediaRecorder start failed:", e);
      if (e.name === 'NotAllowedError') {
        alert("Microphone access denied. Please allow microphone permissions and try again.");
      } else {
        alert("Could not access microphone. Please check your browser settings.");
      }
    }
  };

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  // ═══════════════════════════════════════════════════
  // UNIFIED START/STOP (picks the right method)
  // ═══════════════════════════════════════════════════
  const startListening = () => {
    if (hasSpeechAPI) {
      // Clean up existing
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch(e) {}
        recognitionRef.current = null;
      }
      accumulatedTextRef.current = currentAnswer;
      wantRecordingRef.current = true;
      restartCountRef.current = 0;
      doStartRecognition();
    } else {
      accumulatedTextRef.current = currentAnswer;
      startMediaRecorder();
    }
  };

  const stopListening = () => {
    if (hasSpeechAPI) {
      wantRecordingRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
      }
      setIsRecording(false);
      if (accumulatedTextRef.current) {
        setCurrentAnswer(accumulatedTextRef.current);
      }
    } else {
      stopMediaRecorder();
      // Note: transcription happens in recorder.onstop callback
    }
  };

  const handleNextQuestion = () => {
    if (!currentAnswer.trim()) return alert("Please provide an answer before proceeding.");
    
    // Stop recording if active
    stopListening();
    
    const newAnswers = [...answers, { question: questions[currentQ], answer: currentAnswer.trim() }];
    setAnswers(newAnswers);
    setCurrentAnswer("");
    accumulatedTextRef.current = "";

    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      // All questions answered — submit
      handleFinishInterview(newAnswers);
    }
  };

  const handleFinishInterview = async (finalAnswers) => {
    setPhase("submitting");
    try {
      const res = await fetch(`http://localhost:8001/employee/jobs/${selectedJob.job_id}/finish-interview`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ answers: finalAnswers })
      });
      if (res.ok) {
        setPhase("done");
      } else {
        alert("Failed to submit interview. Please try again.");
        setPhase("interview");
      }
    } catch (e) {
      alert("Error submitting interview.");
      setPhase("interview");
    }
  };

  // ─── LOADING ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
          <p className="text-slate-500 text-sm font-medium">Loading interviews...</p>
        </div>
      </div>
    );
  }

  // ─── DONE / THANK YOU ───
  if (phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
        <div className="max-w-lg w-full bg-gradient-to-br from-slate-900 to-slate-800 border border-emerald-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-4 ring-emerald-500/20">
            <CheckCircle2 size={48} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-black text-white mb-3">Interview Complete!</h2>
          <p className="text-slate-400 mb-3 leading-relaxed">
            Thank you for completing your AI interview for <span className="text-white font-semibold">{selectedJob?.job_title}</span>.
          </p>
          <p className="text-slate-500 text-sm mb-10">
            Our AI is analyzing your responses. The hiring team will review your results shortly.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href='/employee/careers'}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all"
            >
              Back to Careers
            </button>
            <button 
              onClick={() => { setPhase("select"); setSelectedJob(null); fetchInterviews(); }}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-2xl transition-all border border-white/10"
            >
              View Other Interviews
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── SUBMITTING ───
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 animate-spin text-emerald-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-full animate-ping"></div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">Analyzing your responses...</p>
            <p className="text-slate-500 text-sm mt-1">Our AI is evaluating your interview performance</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── SELECT JOB ───
  if (phase === "select") {
    return (
      <div className="min-h-screen bg-[#050505] p-10 flex flex-col items-center">
        <div className="w-full max-w-3xl">
          <div className="mb-10">
            <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-[4px] mb-2">AI Interview Center</p>
            <h2 className="text-3xl font-black text-white">Pending Interviews</h2>
            <p className="text-slate-500 mt-2">Select a role to begin your AI-powered interview session.</p>
          </div>
          
          {interviews.length === 0 ? (
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-16 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="text-slate-600" size={28} />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">No Pending Interviews</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
                Apply for a role in the Internal Careers section and pass the AI resume screening to unlock interviews.
              </p>
              <button 
                onClick={() => window.location.href='/employee/careers'}
                className="mt-8 px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-all"
              >
                Browse Open Roles
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {interviews.map(job => (
                <button 
                  key={job.job_id}
                  onClick={() => handleSelectJob(job)}
                  className="flex items-center justify-between p-6 bg-slate-900/60 hover:bg-slate-800/80 border border-white/5 hover:border-emerald-500/30 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-5 text-left">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                      <Briefcase size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">{job.job_title}</h3>
                      <p className="text-slate-500 text-sm mt-1">Status: <span className="text-emerald-400 font-semibold">{job.status}</span></p>
                    </div>
                  </div>
                  <ChevronRight className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── READY TO START ───
  if (phase === "ready") {
    return (
      <div className="min-h-screen bg-[#050505] p-10 flex items-center justify-center">
        <div className="max-w-xl w-full bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/20">
              <Mic size={36} className="text-emerald-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-3">{selectedJob?.job_title}</h2>
            <p className="text-slate-400">AI-Powered Interview Session</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/5">
            <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-widest">Before you begin:</h3>
            <ul className="space-y-3 text-slate-300 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold mt-0.5">01</span>
                You will be asked <span className="text-white font-semibold">10 questions</span> tailored to this role.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold mt-0.5">02</span>
                Use the microphone to record your answers or type them manually.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold mt-0.5">03</span>
                You can re-record each answer before moving to the next question.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 font-bold mt-0.5">04</span>
                AI will evaluate your performance after all questions are answered.
              </li>
            </ul>
          </div>

          <button
            onClick={handleStartInterview}
            disabled={questionsLoading}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {questionsLoading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Generating Questions...
              </>
            ) : (
              <>
                <Play size={20} />
                Start Interview
              </>
            )}
          </button>

          <button
            onClick={() => { setPhase("select"); setSelectedJob(null); }}
            className="w-full mt-3 py-3 text-slate-500 hover:text-white font-semibold text-sm transition-colors"
          >
            ← Choose a different role
          </button>
        </div>
      </div>
    );
  }

  // ─── INTERVIEW IN PROGRESS ───
  const progress = questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;
  const isLastQuestion = currentQ === questions.length - 1;

  return (
    <div className="min-h-screen bg-[#050505] p-6 md:p-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-[4px]">
              Question {currentQ + 1} of {questions.length}
            </p>
            <p className="text-slate-500 text-xs font-semibold">{selectedJob?.job_title}</p>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500"></div>
          
          {/* Recording indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-2.5 w-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : isTranscribing ? 'bg-amber-500 animate-pulse' : 'bg-slate-700'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {isTranscribing ? 'Transcribing...' : isRecording ? 'Recording...' : 'Ready'}
            </span>
            <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-slate-700 bg-slate-800 px-2 py-0.5 rounded-full">
              {hasSpeechAPI ? 'Live Mode' : 'AI Transcription'}
            </span>
          </div>
          
          {/* Question */}
          <div className="mb-8">
            <p className="text-slate-500 uppercase text-[10px] font-black tracking-widest mb-4">Question {currentQ + 1}</p>
            <p className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed">
              "{questions[currentQ]}"
            </p>
          </div>

          {/* Answer Area */}
          <div className="bg-white/5 rounded-2xl p-6 min-h-[160px] mb-8 border border-white/5 relative">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">Your Answer</p>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={hasSpeechAPI 
                ? "Use the microphone or type your answer here..." 
                : "Click Record to speak, or type your answer here..."}
              className="w-full bg-transparent text-slate-200 text-base leading-relaxed outline-none resize-none min-h-[100px] placeholder:text-slate-600"
            />
            {isRecording && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-red-500/60 to-transparent animate-pulse"></div>
            )}
            {isTranscribing && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent animate-pulse"></div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            <button 
              onClick={isRecording ? stopListening : startListening}
              disabled={isTranscribing}
              className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isTranscribing
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 cursor-wait'
                  : isRecording 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20' 
                    : 'bg-emerald-500 text-slate-900 hover:bg-emerald-400'
              }`}
            >
              {isTranscribing 
                ? <><Loader2 size={16} className="animate-spin"/> Transcribing...</>
                : isRecording 
                  ? <><MicOff size={16}/> Stop Recording</> 
                  : <><Mic size={16}/> Record Answer</>
              }
            </button>
            
            <button
              onClick={() => { setCurrentAnswer(""); accumulatedTextRef.current = ""; }}
              disabled={!currentAnswer || isTranscribing}
              className="px-5 py-4 bg-white/5 text-slate-400 hover:text-white rounded-2xl transition-all border border-white/5 hover:border-white/20 disabled:opacity-20"
              title="Clear answer"
            >
              <RotateCcw size={16} />
            </button>

            <button 
              disabled={isTranscribing}
              onClick={handleNextQuestion}
              className={`flex-1 py-4 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 ${
                !currentAnswer.trim() || isTranscribing
                  ? 'bg-white/20 text-slate-900/50 cursor-not-allowed'
                  : 'bg-white text-slate-900 hover:bg-slate-200'
              }`}
            >
              {isLastQuestion ? <><Send size={16}/> Submit Interview</> : <><ArrowRight size={16}/> Next Question</>}
            </button>
          </div>
        </div>

        {/* Answered questions summary */}
        {answers.length > 0 && (
          <div className="mt-6 bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-4">Answered ({answers.length}/{questions.length})</p>
            <div className="space-y-2">
              {answers.map((a, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                  <span className="text-slate-400 truncate">Q{i+1}: {a.question}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}