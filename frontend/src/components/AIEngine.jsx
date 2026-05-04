import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Upload, X, Loader2, Sparkles, 
  FileText, CheckCircle2, AlertCircle, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';

const P = '#14453d';

/**
 * AIEngine Component
 * Handles medical report image capture and AI analysis.
 */
const AIEngine = ({ onAnalysisComplete, onClose, patientId }) => {
  const [step, setStep] = useState('select'); // select, capture, uploading, analyzing
  const [image, setImage] = useState(null);
  const [mimeType, setMimeType] = useState('image/jpeg');
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setStep('capture');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setError('Camera access denied. Please check permissions.');
      setStep('select');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setImage(dataUrl);
      setMimeType('image/jpeg');
      stopCamera();
      analyze(dataUrl, 'image/jpeg');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setImage(dataUrl);
        setMimeType(file.type);
        analyze(dataUrl, file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyze = async (base64Data, type) => {
    setStep('analyzing');
    setError(null);
    try {
      const response = await apiClient.post('/ocr/analyze-report', { 
        image: base64Data,
        mimeType: type,
        patientId: patientId 
      });
      onAnalysisComplete(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Analysis failed. Please try a clearer image.');
      setStep('select');
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div 
        className="relative bg-white rounded-[2.5rem] shadow-sm border border-gray-100 w-full max-w-4xl mx-auto overflow-hidden flex flex-col flex-1"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#e8f5f0] flex items-center justify-center text-[#14453d]">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-800 tracking-tight">AI Report Transformation</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ordinary Report → Digital Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all group">
            <X size={20} className="text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          <AnimatePresence mode="wait">
            {step === 'select' && (
              <motion.div 
                key="select"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">How would you like to add your report?</h3>
                  <p className="text-sm text-gray-500">Choose an option to start the AI analysis.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={startCamera}
                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-dashed border-gray-200 hover:border-[#14453d] hover:bg-[#f0f9f6] transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-[#14453d] flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <div className="text-center">
                      <span className="block font-bold text-gray-800">Scan via Camera</span>
                      <span className="text-xs text-gray-400">Best for physical documents</span>
                    </div>
                  </button>

                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-4 p-8 rounded-3xl border-2 border-dashed border-gray-200 hover:border-[#14453d] hover:bg-[#f0f9f6] transition-all group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:bg-[#14453d] group-hover:text-white transition-all shadow-sm group-hover:shadow-lg">
                      <Upload size={24} />
                    </div>
                    <div className="text-center">
                      <span className="block font-bold text-gray-800">Upload File</span>
                      <span className="text-xs text-gray-400">PDF, JPG or PNG formats</span>
                    </div>
                  </button>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,.jpg,.jpeg,.png"
                />

                {error && (
                  <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600">
                    <AlertCircle size={18} />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'capture' && (
              <motion.div 
                key="capture"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="relative w-full aspect-[3/4] max-w-sm rounded-[2rem] overflow-hidden bg-black shadow-2xl border-4 border-white/20">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 border-2 border-dashed border-white/30 h-1/2 rounded-xl" />
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => { stopCamera(); setStep('select'); }}
                    className="px-6 py-3 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={capturePhoto}
                    style={{ background: P }}
                    className="px-8 py-3 rounded-2xl font-bold text-white shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Camera size={18} /> Capture Now
                  </button>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </motion.div>
            )}

            {step === 'analyzing' && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center py-12 text-center"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 rounded-full border-4 border-[#e8f5f0] flex items-center justify-center">
                    <Loader2 size={40} className="text-[#14453d] animate-spin" />
                  </div>
                  <motion.div 
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.1, 0.3, 0.1]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-[#14453d] rounded-full"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Intelligent Analysis In Progress</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                  Advanced AI is reading your reports, understanding biomarkers, and generating your health profile...
                </p>
                
                <div className="mt-8 space-y-3 w-full max-w-xs">
                  {[
                    "Extracting medical observations...",
                    "Analyzing clinical parameters...",
                    "Mapping reference ranges...",
                    "Generating personalized advice..."
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 text-left">
                      <div className="w-2 h-2 rounded-full bg-[#14453d]/20" />
                      <span className="text-xs text-gray-400 font-medium">{text}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1.5 uppercase tracking-widest">
            <CheckCircle2 size={10} className="text-emerald-500" /> Secure • HIPAA-Compliant • Encrypted
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIEngine;
