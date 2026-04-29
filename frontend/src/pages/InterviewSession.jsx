import React, { useState } from 'react';

export default function InterviewSession() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition. Please use Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      setTranscript(event.results[0][0].transcript);
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-10 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-bold text-slate-800">AI Voice Interview</h2>
          <div className={`h-4 w-4 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`}></div>
        </div>

        <div className="mb-8">
          <p className="text-slate-500 uppercase text-xs font-bold tracking-widest mb-2">Current Question</p>
          <p className="text-2xl font-semibold text-slate-900 leading-tight">
            "How do you handle state management in large scale React applications?"
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 min-h-[150px] mb-8 border-2 border-dashed border-slate-200">
          <p className="text-slate-400 text-sm mb-2">Transcript Preview:</p>
          <p className="text-slate-700 font-medium">
            {transcript || "Click the microphone and start speaking..."}
          </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={startListening}
            className={`flex-1 py-4 rounded-2xl font-bold text-white transition-all ${isRecording ? 'bg-red-500' : 'bg-slate-900 hover:bg-black'}`}
          >
            {isRecording ? "🔴 Stop & Process" : "🎤 Start Speaking"}
          </button>
        </div>
      </div>
    </div>
  );
}