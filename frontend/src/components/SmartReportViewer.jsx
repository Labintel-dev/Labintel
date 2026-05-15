import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, Info, Microscope, Pill, Download, Sparkles, Volume2, Loader2, Square } from 'lucide-react';
import apiClient from '../services/apiClient';

const P = '#14453d'; // Primary dark teal

const SmartReportViewer = ({ isOpen, onClose, originalFileUrl, originalFileType, reportData }) => {
  const [activeTab, setActiveTab] = useState('smart'); // 'smart' or 'original'
  const [imgError, setImgError] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioElements, setAudioElements] = useState([]);
  const [hindiSummary, setHindiSummary] = useState(null);
  const [showHindi, setShowHindi] = useState(false);

  const handleVoiceSummary = async () => {
    if (isSpeaking) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      setIsSpeaking(false);
      return;
    }

    if (!reportData?.summary) return;

    try {
      setLoadingAudio(true);
      console.log("Generating voice summary for:", reportData.summary);
      
      const loadVoices = () => new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) return resolve(voices);
        const onChanged = () => {
          resolve(window.speechSynthesis.getVoices());
          window.speechSynthesis.removeEventListener('voiceschanged', onChanged);
        };
        window.speechSynthesis.addEventListener('voiceschanged', onChanged);
        setTimeout(() => { resolve(window.speechSynthesis.getVoices()); }, 1000);
      });

      const response = await apiClient.post('/ai/voice-summary-public', {
        text: reportData.hindiVoiceScript || reportData.summary
      });

      console.log("Response received:", response.data);
      const { audioData, hindiText } = response.data;
      
      if (hindiText) {
        setHindiSummary(hindiText);
        setShowHindi(true);
      }
      
      // Step 1: Play MP3 audio chunks from backend (highly reliable, works everywhere)
      if (audioData && audioData.length > 0) {
        setIsSpeaking(true);
        // Create audio objects from base64 data
        const audios = audioData.map(base64 => new Audio(`data:audio/mp3;base64,${base64}`));
        setAudioElements(audios);
        
        let currentIndex = 0;
        
        const playNext = () => {
          if (currentIndex < audios.length) {
            console.log(`Playing chunk ${currentIndex + 1}/${audios.length}`);
            audios[currentIndex].play().catch(e => {
              console.error("Playback error:", e);
              setIsSpeaking(false);
            });
            audios[currentIndex].onended = () => {
              currentIndex++;
              playNext();
            };
          } else {
            console.log("Playback completed");
            setIsSpeaking(false);
          }
        };
        
        playNext();
        setLoadingAudio(false);
        return; // Success!
      }
      
      // Step 2: Try Browser Speech Synthesis with the translated Hindi text (fallback)
      if (typeof window !== 'undefined' && window.speechSynthesis && hindiText) {
        try {
          const voices = await loadVoices();
          const hindiVoice =
            voices.find(v => v.lang.startsWith('hi') && (v.name.includes('Neural') || v.name.includes('Google'))) ||
            voices.find(v => v.lang.startsWith('hi') && (v.name.includes('Female') || v.name.includes('Heera') || v.name.includes('Swara'))) ||
            voices.find(v => v.lang.startsWith('hi'));

          if (hindiVoice) {
            const utterance = new SpeechSynthesisUtterance(hindiText);
            utterance.lang = 'hi-IN';
            utterance.voice = hindiVoice;
            utterance.rate = 0.95;
            utterance.pitch = 1.05;
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);
            window.speechSynthesis.speak(utterance);
            setLoadingAudio(false);
            return;
          }
        } catch (synthErr) {
          console.warn('Browser speech synthesis failed:', synthErr);
        }
      }

      // Step 3: Absolute fallback Browser Speech (English)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(reportData.summary);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        console.warn("No audio data received and speech synthesis not supported.");
      }
    } catch (err) {
      console.error("Voice Summary Error:", err);
      alert("Failed to generate Hindi voice summary. Please check your internet connection and try again.");
    } finally {
      setLoadingAudio(false);
    }
  };

  if (!isOpen) return null;

  const isPDF = originalFileType === 'application/pdf' || 
                originalFileUrl?.includes('application/pdf') || 
                originalFileUrl?.endsWith('.pdf');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-2 sm:p-6 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl border border-blue-100/50"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-blue-50 bg-slate-50/50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-blue-50">
                <img src="/logo.jpg" alt="LabIntel" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight" style={{ color: P }}>LabIntel</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Smart Diagnostic Interpretation</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex bg-white px-3 py-1.5 rounded-full border border-blue-50 shadow-sm mr-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   AI Analysis Verified
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-500 border border-slate-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* View Toggle Tabs */}
          <div className="flex border-b border-blue-50 bg-white px-6">
            <button 
              onClick={() => setActiveTab('smart')}
              className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'smart' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Smart Analysis
              {activeTab === 'smart' && <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
            <button 
              onClick={() => setActiveTab('original')}
              className={`px-6 py-3 text-sm font-bold transition-all relative ${activeTab === 'original' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Original Document
              {activeTab === 'original' && <motion.div layoutId="tabUnderline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
            </button>
          </div>

          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-y-auto bg-slate-50/30 p-4 md:p-8">
            {activeTab === 'smart' ? (
              <div className="mx-auto max-w-4xl space-y-8 pb-10">
                
                {/* Patient Information Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-2xl bg-white border border-blue-100/50 p-6 shadow-sm">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Patient Name</p>
                    <p className="font-bold text-slate-800">{reportData?.patientInfo?.name || 'Unknown'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Age / Gender</p>
                    <p className="font-bold text-slate-800">{reportData?.patientInfo?.age || '--'} / {reportData?.patientInfo?.gender || '--'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Report Date</p>
                    <p className="font-bold text-slate-800">{reportData?.patientInfo?.date || '--'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</p>
                    <p className="font-bold text-slate-800">{reportData?.type || 'Lab Report'}</p>
                  </div>
                </div>

                {/* AI Summary Section */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border border-blue-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-blue-600 border border-blue-100">
                      <Sparkles size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">AI Health Insights</h3>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {showHindi && hindiSummary ? hindiSummary : (reportData?.summary || "Analyzing your results to provide a plain-language summary...")}
                    </p>
                  </div>

                  {hindiSummary && (
                    <button 
                      onClick={() => setShowHindi(!showHindi)}
                      className="mt-2 text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest"
                    >
                      {showHindi ? 'Show English' : 'Show Hindi Translation'}
                    </button>
                  )}
                  
                  {/* AI Voice Button */}
                  {reportData?.summary && (
                    <div className="mt-4 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleVoiceSummary}
                        disabled={loadingAudio}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                          isSpeaking 
                            ? 'bg-rose-50 border-rose-100 text-rose-600' 
                            : 'bg-white border-blue-100 text-blue-600 hover:bg-blue-50'
                        } disabled:opacity-50`}
                      >
                        {loadingAudio ? (
                          <Loader2 size={16} className="animate-spin text-blue-500" />
                        ) : isSpeaking ? (
                          <Square size={14} className="fill-current" />
                        ) : (
                          <Volume2 size={16} />
                        )}
                        {loadingAudio ? 'Generating Hindi Voice...' : isSpeaking ? 'Stop Audio' : 'Speak Summary in Hindi'}
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Lab Results Table */}
                <div className="rounded-2xl bg-white border border-blue-100/50 shadow-sm overflow-hidden">
                  <div className="border-b border-blue-50 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <Microscope size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Lab Parameters</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden md:flex gap-2 mr-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Normal</span>
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">Abnormal</span>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">Borderline</span>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all active:scale-95">
                        <Download size={14} /> Download PDF
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">Test Description</th>
                          <th className="px-6 py-4">Result Value</th>
                          <th className="px-6 py-4">Reference Range</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reportData?.results?.parameters?.length > 0 ? (
                          reportData.results.parameters.map((param, idx) => {
                            const isAbnormal = param.status?.toLowerCase().includes('abnormal') || 
                                             param.status?.toLowerCase().includes('high') || 
                                             param.status?.toLowerCase().includes('low');
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-semibold text-slate-800">{param.name}</td>
                                <td className="px-6 py-4">
                                  <span className={`font-bold ${isAbnormal ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {param.value} <span className="text-[11px] font-medium text-slate-400">{param.unit}</span>
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col gap-2.5">
                                    <div className="flex justify-between w-full max-w-[280px] text-xs font-bold text-slate-500 uppercase tracking-tight">
                                      <span>Low</span>
                                      <span className="text-slate-800 font-black">{param.range || '--'}</span>
                                      <span>High</span>
                                    </div>
                                    <div className="relative h-4 w-full max-w-[280px] rounded-full bg-slate-100 overflow-hidden border-2 border-slate-200 shadow-inner">
                                      {/* Visual Range Indicator Bar */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-rose-400/40 via-green-400/40 to-rose-400/40"></div>
                                      <div className="absolute left-1/4 right-1/4 h-full bg-green-400/50"></div>
                                      
                                      {/* Result Pointer */}
                                      <motion.div 
                                        initial={{ left: '50%' }}
                                        animate={{ 
                                          left: (() => {
                                            const val = parseFloat(param.value);
                                            if (isNaN(val)) return '50%';
                                            const high = parseFloat(param.high) || 100;
                                            const low = parseFloat(param.low) || 0;
                                            if (val > high) return '92%';
                                            if (val < low) return '8%';
                                            return '50%';
                                          })()
                                        }}
                                        className={`absolute top-0 h-full w-2 shadow-[0_0_10px_rgba(0,0,0,0.3)] border-x border-white/20 ${isAbnormal ? 'bg-rose-600' : 'bg-green-600'}`}
                                      ></motion.div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {isAbnormal ? (
                                    <span className="inline-flex items-center gap-1.5 text-rose-600 font-bold text-xs">
                                      <AlertTriangle size={14} /> Attention
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-green-600 font-bold text-xs">
                                      <CheckCircle2 size={14} /> Within Range
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic bg-slate-50/20">
                              No test parameters detected in the document.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Prescriptions & Medicines */}
                {reportData?.results?.medicines?.length > 0 && (
                  <div className="rounded-2xl bg-white border border-blue-100/50 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Pill size={20} />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800">Detected Prescriptions</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {reportData.results.medicines.map((med, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 hover:border-purple-200 transition-colors">
                          <h4 className="font-bold text-slate-800 flex items-center justify-between">
                            {med.name}
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">MEDICINE</span>
                          </h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="text-xs bg-white border border-slate-100 px-2 py-1 rounded text-slate-600 font-medium">
                              Dosage: {med.dosage || '--'}
                            </span>
                            <span className="text-xs bg-white border border-slate-100 px-2 py-1 rounded text-slate-600 font-medium">
                              {Array.isArray(med.frequency) ? med.frequency.join(', ') : med.frequency || '--'}
                            </span>
                          </div>
                          {med.duration && <p className="text-[11px] text-slate-400 mt-2 italic">Scheduled for: {med.duration}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Health Advice & Tips */}
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-white/20 p-2 rounded-xl">
                      <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Recommendations & Insights</h3>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {reportData?.advice?.length > 0 ? (
                      reportData.advice.map((adv, idx) => (
                        <div key={idx} className="flex items-start gap-4 bg-white/10 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                          <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400/30 text-[10px] font-bold">
                            {idx + 1}
                          </div>
                          <p className="text-sm font-medium leading-relaxed text-blue-50">
                            {adv}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-blue-100 italic">Please consult your healthcare provider for medical advice.</p>
                    )}
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                     <p className="text-[10px] text-blue-200 font-medium uppercase tracking-widest">Powered by Advanced Clinical AI</p>
                     <p className="text-[10px] bg-amber-400 text-amber-900 px-3 py-1 rounded-full font-bold">NOT A DIAGNOSIS</p>
                  </div>
                </div>

              </div>
            ) : (
              /* Original Document View */
              <div className="mx-auto h-full max-w-5xl flex flex-col">
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-inner overflow-hidden flex flex-col">
                  <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Document Source</span>
                    {originalFileUrl && (
                       <a 
                         href={originalFileUrl} 
                         download 
                         className="flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors"
                       >
                         <Download size={14} /> DOWNLOAD
                       </a>
                    )}
                  </div>
                  
                  {/* AI Summary in Original Tab (for visibility) */}
                  <div className="p-4 bg-blue-50/30 border-b border-blue-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-blue-600" />
                      <span className="text-[11px] font-black uppercase tracking-tighter text-blue-700">Quick AI Insight</span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed italic">
                      {reportData?.summary || "Analyzing report contents..."}
                    </p>
                  </div>

                  <div className="flex-1 bg-slate-100/50 p-4 md:p-8 overflow-auto flex items-center justify-center min-h-[500px]">
                    {!originalFileUrl ? (
                      <div className="text-center p-10 text-slate-400">
                        <Info size={64} className="mx-auto mb-4 opacity-10" />
                        <p className="font-bold">No document source found</p>
                      </div>
                    ) : isPDF ? (
                      <object data={originalFileUrl} type="application/pdf" className="w-full h-full min-h-[700px] rounded-lg shadow-lg">
                        <div className="text-center p-10 text-slate-500">
                          <AlertTriangle size={48} className="mx-auto mb-4 text-amber-500" />
                          <p className="mb-4">PDF Preview is unavailable in your browser.</p>
                          <a href={originalFileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition-all">
                            <Download size={18} /> Download Document
                          </a>
                        </div>
                      </object>
                    ) : (
                      <div className="relative group">
                        {imgError ? (
                          <div className="text-center p-10 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <AlertTriangle size={48} className="mx-auto mb-4 text-rose-500" />
                            <p className="mb-2 font-bold">Failed to load image preview</p>
                            <p className="text-xs">The resource might be restricted or moved.</p>
                          </div>
                        ) : (
                          <img 
                            src={originalFileUrl} 
                            alt="Original Report" 
                            className="max-w-full h-auto rounded-lg shadow-2xl border border-slate-200" 
                            onError={() => setImgError(true)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SmartReportViewer;
