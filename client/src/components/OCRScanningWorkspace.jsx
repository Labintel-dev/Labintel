import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Image as ImageIcon,
  FileText,
  Sparkles,
  X,
  Loader2,
  CheckCircle2,
  Plus,
  ArrowRight,
  Download,
  Printer,
  MapPin,
  Phone,
  Stethoscope,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import apiClient from '../services/apiClient';
import PrintPortal from './PrintPortal';
import { normalizeAnalysis, isAiCapacityError, buildAiCapacityFallbackPayload } from '../lib/normalization';
import { chooseAnalysisSpeed } from '../lib/analysisSpeed';

const PRIMARY = '#14453d';

const getParameterList = (result) => {
  if (!result) return [];
  if (Array.isArray(result.results)) return result.results;
  if (Array.isArray(result.results?.parameters)) return result.results.parameters;
  return [];
};

const getMedicineList = (result) => {
  if (!result) return [];
  if (Array.isArray(result.results?.medicines)) return result.results.medicines;
  return [];
};

const getPatientDate = (result) => result?.patientInfo?.date || result?.patientInfo?.testDate || '';

const getSummaryText = (result) => {
  const analysisSummary = result?.analysis?.summary;
  if (typeof analysisSummary === 'string' && analysisSummary.trim()) return analysisSummary;
  if (typeof analysisSummary?.en === 'string' && analysisSummary.en.trim()) return analysisSummary.en;
  if (typeof result?.summary === 'string' && result.summary.trim()) return result.summary;
  if (typeof result?.comprehensiveReport === 'string' && result.comprehensiveReport.trim()) return result.comprehensiveReport;
  return 'AI analysis completed. Please review with your clinician.';
};

const getMarkerName = (marker) => marker?.name || marker?.parameter || 'Unknown Marker';
const getMarkerInsight = (marker) => marker?.insight || marker?.explanation?.en || 'No interpretation available.';

const ReportContent = ({ result }) => {
  const parameters = getParameterList(result);
  const medicines = getMedicineList(result);
  const summaryText = getSummaryText(result);

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-1">Labintel</h1>
          <p className="text-[10px] font-bold text-gray-400">contact.labintel@gmail.com</p>
        </div>
        <div className="text-right">
          <img src="/logo.jpg" alt="Logo" className="w-12 h-12 inline-block object-contain" />
        </div>
      </div>

      <div className="h-0.5 bg-black w-full mb-6" />

      <div className="mb-6">
        <h2 className="text-xl font-black uppercase tracking-[0.05em] text-black mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
          {result?.labDetails?.name || 'SUNRISE DIAGNOSTIC CENTRE'}
        </h2>
        <div className="flex flex-col gap-0.5">
          <p className="text-[9px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
            <MapPin size={9} /> {result?.labDetails?.address || 'Kolkata, West Bengal'}
          </p>
          <p className="text-[9px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
            <Phone size={9} /> {result?.labDetails?.contact || '+91 00000 00000'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-6 mb-8 pb-8 border-b border-gray-200 border-dashed">
        <div>
          <p className="label-tiny mb-1">Full Patient Name</p>
          <p className="text-xl font-black">{result?.patientInfo?.name || 'Valued Patient'}</p>
        </div>
        <div className="text-right">
          <p className="label-tiny mb-1">Report Date</p>
          <p className="text-lg font-black">{getPatientDate(result) || 'N/A'}</p>
        </div>
        <div>
          <p className="label-tiny mb-1">Demographics</p>
          <p className="text-sm font-bold text-gray-700">{result?.patientInfo?.age || '--'} Years / {result?.patientInfo?.gender || '--'}</p>
        </div>
        <div className="text-right">
          <p className="label-tiny mb-1">Analysis ID</p>
          <p className="text-xs font-mono font-bold text-gray-400 uppercase">{result?.id || 'LAB-ANALYSIS'}</p>
        </div>
      </div>

      <div className="space-y-12">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Clinical Biomarker Intelligence</h3>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {parameters.length > 0 ? (
          <div className="space-y-14">
            {parameters.map((marker, index) => (
              <div key={`${getMarkerName(marker)}-${index}`} className="page-break-avoid border-b border-gray-50 pb-12 last:border-0">
                <div className="flex justify-between items-start mb-6 gap-4">
                  <div>
                    <h4 className="biomarker-title">{getMarkerName(marker)}</h4>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
                        OBSERVED: <span className="text-black ml-1">{marker?.value ?? '--'} {marker?.unit || ''}</span>
                      </span>
                      <span className="w-px h-3 bg-gray-200" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
                        REF: <span className="text-black ml-1">{marker?.range || '--'}</span>
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-1.5 border border-gray-300 text-[10px] font-black uppercase tracking-widest text-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {marker?.status || 'NORMAL'}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="pl-4 border-l-2 border-gray-100">
                    <p className="label-tiny mb-1">Simplification</p>
                    <p className="text-sm italic text-gray-500 font-medium leading-relaxed">"{getMarkerInsight(marker)}"</p>
                  </div>
                  <div className="pl-4 border-l-2 border-gray-100">
                    <p className="label-tiny mb-1">Creative Solution</p>
                    <p className="text-sm font-black text-black leading-relaxed">{marker?.creativeSolution || 'Maintain balanced nutrition and regular movement.'}</p>
                  </div>
                  <div className="bg-gray-50/40 rounded-2xl p-7 border border-gray-100 mt-4">
                    <p className="label-tiny mb-2 text-gray-400">Suggestive Medicine Ref</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-loose">
                      {marker?.suggestedMedicine || 'Educational medication groups info provided upon professional consult.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-gray-300">
                      <Stethoscope size={16} />
                    </div>
                    <div>
                      <p className="label-tiny mb-0.5">Recommended Expert</p>
                      <p className="text-[10px] font-black text-black uppercase tracking-widest leading-relaxed">
                        {marker?.suggestedSpecialist || 'General Internal Medicine'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-6 text-sm font-semibold text-gray-500">
            No biomarkers were extracted. Please upload a clearer image/PDF for complete digitization.
          </div>
        )}
      </div>

      {medicines.length > 0 && (
        <div className="mt-16 page-break-avoid">
          <p className="label-tiny mb-4 text-gray-400">Extracted Medicines</p>
          <div className="rounded-3xl border border-gray-100 bg-white p-6 space-y-3">
            {medicines.map((med, index) => (
              <div key={`${med?.name || 'medicine'}-${index}`} className="text-sm text-gray-700">
                <span className="font-black text-black">{med?.name || 'Unknown Medicine'}</span>
                <span className="ml-2">{med?.dosage || '--'}</span>
                <span className="ml-2 text-gray-500">{med?.duration || '--'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-20 page-break-avoid">
        <div className="bg-gray-50/50 rounded-[2.5rem] p-10 border border-gray-100 shadow-sm">
          <p className="label-tiny mb-5 text-gray-400">Clinical Executive Summary</p>
          <p className="text-base font-bold leading-relaxed text-gray-700">{summaryText}</p>
        </div>
      </div>

      <div className="mt-20 pt-10 text-center">
        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] max-w-3xl mx-auto leading-relaxed">
          VALIDATED THROUGH LABINTEL CLINICAL INTELLIGENCE PROTOCOL. THIS IS AN EDUCATIONAL SYNTHESIS, NOT A REPLACEMENT FOR PROFESSIONAL MEDICAL ADVICE. © 2026 LABINTEL DIGITAL HEALTH SOLUTIONS.
        </p>
      </div>
    </>
  );
};

const PrintReport = ({ result }) => (
  <div className="bg-white text-black p-10 font-serif leading-relaxed report-print-root">
    <style>{`
      .report-print-root { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important; }
      .label-tiny { font-family: 'Inter', sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #999; }
      .biomarker-title { color: #1e40af; font-family: ui-serif, serif; font-size: 22px; font-weight: 900; }
      @media print {
        body { margin: 0; padding: 0; }
        .page-break-avoid { break-inside: avoid; page-break-inside: avoid; }
      }
    `}</style>
    <ReportContent result={result} />
  </div>
);

const OCRScanningWorkspace = ({ user }) => {
  const [step, setStep] = useState('upload');
  const [subStep, setSubStep] = useState(0);
  const [file, setFile] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  const docInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const reportRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('ocr-print-mode', isPrinting);
    return () => document.body.classList.remove('ocr-print-mode');
  }, [isPrinting]);

  const startCamera = async () => {
    setIsCameraOpen(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions.');
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
      setCapturedImage(canvas.toDataURL('image/jpeg'));
      setIsReviewing(true);
      stopCamera();
    }
  };

  const handleReviewConfirm = () => {
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const reviewedFile = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
        handleFile(reviewedFile);
        setIsReviewing(false);
        setCapturedImage(null);
      });
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    startProcessing(selectedFile);
  };

  const startProcessing = async (selectedFile) => {
    setStep('processing');
    setSubStep(0);
    setError(null);

    try {
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(selectedFile);
      });
      const base64 = await base64Promise;

      setSubStep(1);
      const response = await apiClient.post('/analyze-report', {
        image: base64,
        mimeType: selectedFile.type,
        patientId: user?.id,
        analysisSpeed: chooseAnalysisSpeed({
          mimeType: selectedFile.type,
          fileSizeBytes: selectedFile.size,
          fileName: selectedFile.name,
        }),
      });

      setSubStep(2);
      await new Promise((r) => setTimeout(r, 800));
      const normalized = normalizeAnalysis(response?.data || {});
      setResult({
        ...normalized,
        originalImage: selectedFile.type.startsWith('image/') ? base64 : null,
      });
      setStep('results');
    } catch (err) {
      if (isAiCapacityError(err)) {
        const retryAfterSec = Number(err?.response?.data?.retryAfterSec || 0);
        const fallback = normalizeAnalysis(buildAiCapacityFallbackPayload({ retryAfterSec }));
        setResult({
          ...fallback,
          originalImage: selectedFile.type.startsWith('image/') ? base64 : null,
        });
        setStep('results');
        setError(null);
        return;
      }

      const message = err?.response?.data?.error || err?.message || 'Pipeline failed. Please try a clearer file.';
      setError(message);
      setStep('upload');
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const cleanup = () => {
      setIsPrinting(false);
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => window.print(), 80);
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsPdfDownloading(true);

    const element = reportRef.current;
    const originalStyle = element.style.cssText;
    element.style.padding = '10mm';
    element.style.width = '210mm';
    element.style.background = 'white';

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const patientName = result?.patientInfo?.name || 'Patient';
      pdf.save(`Labintel_Report_${patientName}.pdf`);
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
    } finally {
      element.style.cssText = originalStyle;
      setIsPdfDownloading(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setResult(null);
    setFile(null);
    setShowOptions(false);
    setError(null);
  };

  const parameterList = getParameterList(result);

  return (
    <div className="flex-1 flex flex-col bg-gray-50/30 overflow-visible relative">
      <style>{`
        #print-root { display: none; }
        body.ocr-print-mode #print-root { display: block; }
        .ocr-report-sheet { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important; }
        .label-tiny { font-family: 'Inter', sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #999; }
        .biomarker-title { color: #1e40af; font-family: ui-serif, serif; font-size: 22px; font-weight: 900; }
        @media print {
          body.ocr-print-mode #root { display: none !important; }
          body.ocr-print-mode #print-root { display: block !important; }
          .ocr-print-hide { display: none !important; }
        }
      `}</style>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-xl text-center mb-10">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-50 text-[#14453d] mb-4"><Sparkles size={32} /></div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight">OCR Scan Station</h1>
              <p className="text-gray-500 mt-2 font-medium">Upload any medical report for clinical synthesis.</p>
            </div>

            <div className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-2 relative overflow-visible">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-[2rem]">
                <div className="flex-1 pl-4 flex items-center gap-3">
                  <FileText size={20} className="text-gray-400" />
                  <input
                    type="text"
                    readOnly
                    value={file ? file.name : ''}
                    placeholder="Upload report, prescription, or scan..."
                    className="bg-transparent w-full text-lg outline-none text-gray-700 cursor-pointer"
                    onClick={() => setShowOptions(!showOptions)}
                  />
                  <input type="file" ref={docInputRef} hidden onChange={(e) => handleFile(e.target.files[0])} />
                  <input type="file" ref={photoInputRef} accept="image/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOptions(!showOptions)}
                    className={`p-3 rounded-2xl border transition-all active:scale-95 shadow-sm ${
                      showOptions ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-100 text-[#14453d] hover:shadow-md'
                    }`}
                  >
                    <Plus size={22} className={`transition-transform duration-300 ${showOptions ? 'rotate-45' : ''}`} />
                  </button>
                  <button onClick={() => file && startProcessing(file)} style={{ background: PRIMARY }} className="p-3 text-white rounded-2xl shadow-xl hover:opacity-90 transition-all active:scale-95 flex items-center justify-center"><ArrowRight size={22} /></button>
                </div>
              </div>

              <AnimatePresence>
                {showOptions && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 mt-4 grid grid-cols-3 gap-3 p-4 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-50">
                    {[
                      { icon: Camera, label: 'Camera', color: 'bg-blue-50 text-blue-600', action: startCamera },
                      { icon: ImageIcon, label: 'Photos', color: 'bg-purple-50 text-purple-600', action: () => photoInputRef.current?.click() },
                      { icon: FileText, label: 'Files', color: 'bg-emerald-50 text-emerald-600', action: () => docInputRef.current?.click() },
                    ].map((opt) => (
                      <button key={opt.label} onClick={() => { setShowOptions(false); opt.action(); }} className={`${opt.color} p-4 rounded-3xl flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform font-bold text-xs uppercase tracking-widest`}><opt.icon size={20} /> {opt.label}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {error && <p className="mt-4 text-rose-500 text-sm font-bold">{error}</p>}
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div 
            key="processing" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8 bg-white/40 backdrop-blur-sm"
          >
            {/* Premium Intelligence Loader */}
            <div className="relative mb-16">
              <motion.div 
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 8, ease: "linear" },
                  scale: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                }}
                className="w-40 h-40 rounded-full border-[1px] border-emerald-100/30 flex items-center justify-center relative"
              >
                {/* Orbital dots */}
                {[0, 72, 144, 216, 288].map((deg, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full"
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `rotate(${deg}deg) translate(80px) rotate(-${deg}deg)`
                    }}
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                  />
                ))}
                
                <div className="w-32 h-32 rounded-full border-[1px] border-emerald-50 flex items-center justify-center bg-white shadow-[0_0_50px_rgba(16,185,129,0.05)]">
                  <div className="relative">
                    <Loader2 size={48} className="text-[#14453d] animate-spin" strokeWidth={1.5} />
                    <motion.div 
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Sparkles size={24} className="text-emerald-500/30" />
                    </motion.div>
                  </div>
                </div>
              </motion.div>

              {/* Pulsating background glows */}
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.15, 0.05] }} 
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }} 
                className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl -z-10" 
              />
            </div>

            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl font-black text-gray-800 mb-12 tracking-tight text-center"
            >
              Intelligence Pipeline <span className="text-emerald-600">Active</span>
            </motion.h2>

            <div className="w-full max-w-sm space-y-6 mx-auto">
              {['Securely reading report file...', 'Extracting clinical biomarkers...', 'AI synthesis & risk assessment...'].map((text, i) => {
                const isActive = subStep === i;
                const isCompleted = subStep > i;
                const isPending = subStep < i;

                return (
                  <motion.div 
                    key={i} 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-5 relative group"
                  >
                    {/* Connection Line */}
                    {i < 2 && (
                      <div className="absolute left-4 top-8 w-[2px] h-6 bg-gray-100 -z-10 overflow-hidden">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: isCompleted ? "100%" : "0%" }}
                          className="w-full bg-emerald-500"
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}

                    {/* Step Icon/Number */}
                    <motion.div 
                      animate={{ 
                        scale: isActive ? 1.1 : 1,
                        backgroundColor: isCompleted ? '#10b981' : isActive ? '#14453d' : '#f3f4f6',
                        color: isCompleted || isActive ? '#ffffff' : '#9ca3af'
                      }}
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${isActive ? 'shadow-emerald-200 shadow-lg' : ''}`}
                    >
                      {isCompleted ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={18} /></motion.div>
                      ) : (
                        <span className="text-xs font-black">{i + 1}</span>
                      )}
                    </motion.div>

                    {/* Step Text */}
                    <div className="flex flex-col">
                      <span className={`text-[15px] font-bold transition-all duration-500 ${isActive ? 'text-gray-900 translate-x-1' : isCompleted ? 'text-emerald-600' : 'text-gray-300'}`}>
                        {text}
                      </span>
                      {isActive && (
                        <motion.span 
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] uppercase tracking-widest text-emerald-500 font-black mt-0.5"
                        >
                          Processing...
                        </motion.span>
                      )}
                    </div>

                    {/* Scanning Shine Effect on Active Step */}
                    {isActive && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/5 to-transparent -z-10 rounded-2xl"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Bottom Insight Hint */}
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 1 }}
              className="mt-16 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 text-center"
            >
              Analyzing patterns with Labintel Core v4
            </motion.p>
          </motion.div>
        )}

        {step === 'results' && result && (
          <motion.div key="results" className="flex-1 flex flex-col p-4 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-8 px-2 ocr-print-hide">
              <button onClick={reset} className="px-4 py-2 bg-white text-gray-500 font-bold rounded-xl border border-gray-100 text-xs shadow-sm">New scan</button>
              <div className="flex gap-2">
                <button onClick={handlePrint} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm inline-flex items-center gap-2 text-sm font-bold text-gray-700"><Printer size={16} /> Print</button>
                <button onClick={handleDownloadPdf} disabled={isPdfDownloading} className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm inline-flex items-center gap-2 text-sm font-bold text-gray-700 disabled:opacity-50">
                  {isPdfDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  PDF
                </button>
              </div>
            </div>

            <div className="space-y-6 pb-20">
              <div className="ocr-print-hide rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-xs font-bold text-emerald-800 inline-flex items-center gap-2">
                <CheckCircle2 size={14} /> Digital report ready for print and PDF export.
              </div>

              {result?.quality?.extractionMode === 'quota-fallback' && (
                <div className="ocr-print-hide rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 inline-flex items-center gap-2">
                  <AlertCircle size={14} /> Live AI capacity is limited right now. Showing temporary fallback output.
                </div>
              )}

              <div ref={reportRef} className="digital-report-view ocr-report-sheet bg-white p-12 rounded-[3rem] shadow-2xl border border-gray-50">
                <ReportContent result={result} />
              </div>

              {parameterList.length === 0 && (
                <div className="ocr-print-hide rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 inline-flex items-center gap-2">
                  <AlertCircle size={14} /> No markers were detected. Upload a clearer file to prevent missing data.
                </div>
              )}

              {result?.originalImage && (
                <div className="ocr-print-hide bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider mb-4">Uploaded Source Image</h3>
                  <img src={result.originalImage} alt="Uploaded report" className="w-full max-h-[620px] object-contain rounded-xl border border-gray-100 bg-gray-50" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCameraOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[100] flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-10">
              <button onClick={stopCamera} className="p-4 bg-white/10 rounded-full text-white"><X size={32} /></button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-8 border-gray-300 active:scale-95 transition-transform" />
              <div className="w-16" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isReviewing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[110] flex flex-col">
            <img src={capturedImage} alt="Review" className="flex-1 object-contain" />
            <div className="p-8 bg-black/80 flex justify-between gap-4">
              <button onClick={() => { setIsReviewing(false); setCapturedImage(null); startCamera(); }} className="flex-1 py-4 bg-white/10 text-white font-bold rounded-2xl">Retake</button>
              <button onClick={handleReviewConfirm} style={{ background: PRIMARY }} className="flex-1 py-4 text-white font-bold rounded-2xl">Analyze Report</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <canvas ref={canvasRef} hidden />
      {isPrinting && result && <PrintPortal><PrintReport result={result} /></PrintPortal>}
    </div>
  );
};

export default OCRScanningWorkspace;
