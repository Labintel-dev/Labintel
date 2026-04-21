import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Image as ImageIcon, FileText, 
  Sparkles, X, Loader2, CheckCircle2, AlertCircle,
  Plus, ArrowRight, Download, Share2, Printer, 
  Languages, Volume2, Save, MoreHorizontal,
  FileDown, Sunrise, Sun, Moon, Heart, Mail, MapPin, Phone, Stethoscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../services/apiClient';
import PrintPortal from './PrintPortal';

const PRIMARY = '#14453d';

const normalizeAnalysis = (payload = {}) => {
  const type = payload.type === 'Lab Report' || payload.type === 'Prescription' ? payload.type : 'Other';
  const patientInfo = payload.patientInfo || {};
  const results = payload.results || {};
  const labDetails = payload.labDetails || {};

  const parameters = Array.isArray(results.parameters)
    ? results.parameters.map((item) => ({
        name: item?.name || 'Unknown Marker',
        value: item?.value ?? '--',
        unit: item?.unit || '',
        range: item?.range || '--',
        low: item?.low,
        high: item?.high,
        status: item?.status || 'Normal',
        insight: item?.insight || 'No detailed insight provided by AI for this marker.',
        education: item?.education || '',
        creativeSolution: item?.creativeSolution || '',
        suggestedSpecialist: item?.suggestedSpecialist || '',
        suggestedMedicine: item?.suggestedMedicine || ''
      }))
    : [];

  const medicines = Array.isArray(results.medicines)
    ? results.medicines.map((item) => ({
        name: item?.name || 'Unknown Medicine',
        dosage: item?.dosage || '--',
        frequency: Array.isArray(item?.frequency) ? item.frequency : [],
        duration: item?.duration || '--',
        purpose: item?.purpose || 'General use',
      }))
    : [];

  return {
    ...payload,
    type,
    labDetails: {
      name: labDetails.name || 'Sunrise Diagnostic Centre',
      address: labDetails.address || 'Kolkata, West Bengal',
      contact: labDetails.contact || '+91 00000 00000',
    },
    patientInfo: {
      name: patientInfo.name || 'Valued Patient',
      age: patientInfo.age || '--',
      gender: patientInfo.gender || '--',
      date: patientInfo.date || new Date().toLocaleDateString(),
      doctor: patientInfo.doctor || '',
    },
    results: {
      ...results,
      parameters: parameters || [],
      medicines: medicines || [],
    },
    summary:
      payload.summary ||
      'AI extracted this medical document and generated a structured summary from the uploaded scan.',
    advice: Array.isArray(payload.advice) && payload.advice.length > 0 ? payload.advice : ['Consult your clinician for final interpretation.'],
    riskLevel: payload.riskLevel || 'Medium',
  };
};

const normalizeStatus = (status = '') => {
  const value = String(status).toLowerCase();
  if (value.includes('high') || value.includes('low') || value.includes('critical') || value.includes('abnormal')) {
    return 'Abnormal';
  }
  if (value.includes('border')) {
    return 'Borderline';
  }
  return 'Normal';
};

const DemoNormalReportPanel = () => (
  <div className="h-full w-full bg-[#eff3f8] p-5">
    <div className="h-full rounded-2xl border border-slate-300 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.08)] overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Normal Report</div>
          <div className="text-[11px] font-bold text-slate-500">Raw Lab Scan (Unstructured)</div>
        </div>
        <div className="text-[10px] text-slate-400 font-bold">Page 1 / 1</div>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="h-2 bg-slate-200 rounded w-full" />
            <div className="h-2 bg-slate-200 rounded w-10/12" />
            <div className="h-2 bg-slate-200 rounded w-8/12" />
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-slate-200 rounded w-11/12 ml-auto" />
            <div className="h-2 bg-slate-200 rounded w-9/12 ml-auto" />
            <div className="h-2 bg-slate-200 rounded w-8/12 ml-auto" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span className="col-span-2">Test Name</span>
            <span className="text-right">Result</span>
          </div>
          {[
            ['PSA (FREE + TOTAL)', '7.2'],
            ['FREE PSA', '0.8'],
            ['% FREE PSA', '11'],
            ['CRP', '8.4'],
            ['ESR', '22'],
          ].map(([name, value]) => (
            <div key={name} className="grid grid-cols-3 px-3 py-2 border-t border-slate-100 text-[10px] text-slate-600">
              <span className="col-span-2 truncate">{name}</span>
              <span className="text-right font-semibold">{value}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="h-2 bg-slate-200 rounded w-full" />
          <div className="h-2 bg-slate-200 rounded w-11/12" />
          <div className="h-2 bg-slate-200 rounded w-10/12" />
          <div className="h-2 bg-slate-200 rounded w-8/12" />
          <div className="h-2 bg-slate-200 rounded w-7/12" />
        </div>
      </div>
    </div>
  </div>
);

const PrintReport = ({ result }) => {
  const parameters = result?.results?.parameters || [];
  const medicines = result?.results?.medicines || [];
  const isLabReport = result.type === 'Lab Report';
  const isPrescription = result.type === 'Prescription';

  return (
    <div className="bg-white text-black p-8 font-serif leading-relaxed">
      {/* 1. Branding Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-2">Labintel</h1>
          <p className="text-sm font-bold text-gray-600">contact.labintel@gmail.com</p>
        </div>
        <div className="text-right">
           <img src="/logo.jpg" alt="Logo" className="w-16 h-16 inline-block object-contain" />
        </div>
      </div>

      {/* 2. Horizontal Line */}
      <div className="h-0.5 bg-black w-full mb-6" />

      {/* 3. Entity (Lab or Clinic) Layer */}
      <div className="mb-6">
        <h2 className="text-xl font-black uppercase tracking-widest mb-1">{result.labDetails?.name || (isPrescription ? 'Medical Prescription' : 'Diagnostic Report')}</h2>
        <div className="flex flex-col gap-0.5">
          {result.labDetails?.address && (
            <p className="text-xs text-gray-500 font-bold flex items-center gap-2 uppercase tracking-wide">
              <MapPin size={10} /> {result.labDetails.address}
            </p>
          )}
          {result.labDetails?.contact && (
            <p className="text-xs text-gray-500 font-bold flex items-center gap-2 uppercase tracking-wide">
              <Phone size={10} /> {result.labDetails.contact}
            </p>
          )}
        </div>
      </div>

      {/* 4. Patient Layer */}
      <div className="grid grid-cols-2 gap-10 mb-8 pb-6 border-b-2 border-dotted border-gray-200">
        <div className="space-y-4">
           <div>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1.5">Full Patient Name</p>
             <p className="text-xl font-black">{result.patientInfo?.name}</p>
           </div>
           <div>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1.5">Demographics</p>
             <p className="text-sm font-bold text-gray-700">{result.patientInfo?.age} Years / {result.patientInfo?.gender}</p>
           </div>
        </div>
        <div className="space-y-4 text-right">
           <div>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1.5">Report Date</p>
             <p className="text-base font-black">{result.patientInfo?.date}</p>
           </div>
           <div>
             <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1.5">Analysis ID</p>
             <p className="text-xs font-mono font-bold text-gray-400">LAB-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
           </div>
        </div>
      </div>

      {/* 5. Clinical Content Layer */}
      <div className="space-y-8">
        {isLabReport && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] bg-black text-white px-4 py-2">Clinical Biomarker Intelligence</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            
            {parameters.map((p, i) => {
              const status = normalizeStatus(p.status);
              const isAbnormal = status === 'Abnormal';
              return (
                <div key={i} className="space-y-4 break-inside-avoid border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-black tracking-tight flex items-center gap-3">
                        {p.name}
                        {isAbnormal && <AlertCircle size={18} className="text-black" />}
                      </h4>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Observed: {p.value} {p.unit} <span className="mx-2 opacity-30">|</span> Ref: {p.range}
                      </p>
                    </div>
                    <div className={`px-4 py-2 border-2 border-black text-xs font-black uppercase tracking-widest ${isAbnormal ? 'bg-black text-white' : 'bg-white text-black'}`}>
                      {p.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-5">
                      <div className="pl-4 border-l-2 border-gray-100">
                         <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-1.5">Simplification</p>
                         <p className="text-sm leading-relaxed text-gray-700 italic">"{p.insight}"</p>
                      </div>
                      <div className="pl-4 border-l-2 border-black">
                         <p className="text-[9px] font-black uppercase text-black tracking-widest mb-1.5">Creative Solution</p>
                         <p className="text-sm font-bold leading-relaxed">{p.creativeSolution || "Maintain balanced nutrition and regular movement."}</p>
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl">
                         <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest mb-2">Suggestive Medicine Ref</p>
                         <p className="text-xs font-bold leading-relaxed text-gray-600">{p.suggestedMedicine || "Educational medication groups info provided upon consult."}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {isPrescription && (
          <>
            <div className="flex items-center gap-4 mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] bg-black text-white px-4 py-2">Medication Intelligence Schedule</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            
            <div className="border border-black rounded-xl overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-gray-100 text-[10px] font-black uppercase tracking-widest">
                    <tr>
                      <th className="p-4 border-r border-gray-200">Medicine Name</th>
                      <th className="p-4 border-r border-gray-200">Dosage</th>
                      <th className="p-4 border-r border-gray-200">Schedule</th>
                      <th className="p-4">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs font-bold">
                    {medicines.map((m, i) => (
                      <tr key={i}>
                        <td className="p-4 border-r border-gray-200">{m.name}</td>
                        <td className="p-4 border-r border-gray-200">{m.dosage}</td>
                        <td className="p-4 border-r border-gray-200">
                          <div className="flex gap-1">
                            {['Morning', 'Afternoon', 'Night'].map(time => (
                              <span key={time} className={`px-1.5 py-0.5 rounded border ${m.frequency?.includes(time) ? 'bg-black text-white border-black' : 'text-gray-300 border-gray-200'}`}>
                                {time[0]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">{m.purpose}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </>
        )}
      </div>

      {/* Summary Recap */}
      <div className="mt-10 p-6 border-2 border-black rounded-2xl break-inside-avoid">
         <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-4">Clinical Executive Summary</p>
         <p className="text-base font-bold leading-relaxed">{result.summary}</p>
      </div>

      {/* Footer Disclaimer */}
      <div className="mt-auto pt-16 pb-6 text-center">
        <div className="w-20 h-0.5 bg-gray-200 mx-auto mb-6" />
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-300 max-w-2xl mx-auto leading-loose">
          VALIDATED THROUGH LABINTEL CLINICAL INTELLIGENCE PROTOCOL. 
          THIS IS AN EDUCATIONAL SYNTHESIS, NOT A REPLACEMENT FOR PROFESSIONAL MEDICAL ADVICE.
          © 2026 LabIntel Digital Health Solutions.
        </p>
      </div>
    </div>
  );
};

const DemoAiReportPanel = () => (
  <div className="h-full w-full bg-[linear-gradient(160deg,#e8f0ff_0%,#f4f8ff_45%,#ebf4ff_100%)] p-5">
    <div className="h-full rounded-2xl border border-blue-100 bg-white overflow-hidden shadow-[0_12px_35px_rgba(47,95,207,0.18)]">
      <div className="px-5 py-3 bg-gradient-to-r from-[#2f5fcf] to-[#4f83ea] text-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em]">AI Report</div>
            <div className="text-[12px] font-bold mt-0.5">Multimarker Clinical Intelligence</div>
          </div>
          <div className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">Confidence 96%</div>
        </div>
      </div>

      <div className="px-5 py-2.5 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 grid grid-cols-3">
        <span>Accession AI-7281</span>
        <span>Male / 45Y</span>
        <span className="text-right text-rose-500">Priority Review</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Risk</div>
            <div className="text-xl font-black text-rose-600">High</div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Severity</div>
            <div className="text-xl font-black text-amber-600">81</div>
          </div>
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">Progression</div>
            <div className="text-xl font-black text-[#2f5fcf]">Rising</div>
          </div>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">AI Summary</div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Elevated total PSA with suppressed free PSA fraction suggests higher-risk pattern. Recommend specialist follow-up and short-interval trend recheck.
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-2 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-500">
            <span>Result</span>
            <span>Range</span>
            <span className="text-right">AI Flag</span>
          </div>
          {[
            ['7.2 ng/mL', '0.0-4.0', 'High', 'text-rose-600'],
            ['0.8 ng/mL', '> 1.0', 'Low', 'text-rose-600'],
            ['11 %', '> 25%', 'Borderline', 'text-amber-600'],
          ].map(([resultValue, rangeValue, flag, color]) => (
            <div key={resultValue} className="grid grid-cols-3 px-3 py-2 border-t border-slate-100 text-[10px] text-slate-600">
              <span>{resultValue}</span>
              <span>{rangeValue}</span>
              <span className={`text-right font-black ${color}`}>{flag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const TrendLineChart = ({ series = [] }) => {
  if (!series.length) return null;

  const width = 420;
  const height = 150;
  const padding = 18;
  const values = series.map((point) => Number(point.value) || 0);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 100);
  const range = Math.max(1, maxValue - minValue);
  const xStep = series.length > 1 ? (width - padding * 2) / (series.length - 1) : 0;

  const points = series.map((point, index) => {
    const x = padding + index * xStep;
    const y = height - padding - ((Number(point.value) - minValue) / range) * (height - padding * 2);
    return { ...point, x, y };
  });

  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 print:rounded-lg print:shadow-none">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-black uppercase tracking-widest text-gray-500">Progression Trend</h4>
        <span className="text-[11px] font-black uppercase tracking-wider text-[#2f5fcf]">Last 4 Reads</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
        {[0.25, 0.5, 0.75].map((ratio, idx) => {
          const y = padding + (height - padding * 2) * ratio;
          return <line key={idx} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeDasharray="3 4" />;
        })}
        <motion.polyline
          points={polylinePoints}
          fill="none"
          stroke="#2f5fcf"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        {points.map((point) => (
          <motion.circle
            key={point.label}
            cx={point.x}
            cy={point.y}
            r="4.5"
            fill="#2f5fcf"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          />
        ))}
      </svg>
      <div className="grid grid-cols-4 gap-2 mt-2">
        {points.map((point) => (
          <div key={point.label} className="text-center">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400">{point.label}</div>
            <div className="text-xs font-bold text-gray-700">{Math.round(point.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * RangeIndicator Component - Quest Style
 */
const RangeIndicator = ({ value, low, high, status, unit }) => {
  const numericValue = parseFloat(value);
  const nLow = parseFloat(low);
  const nHigh = parseFloat(high);
  
  let percentage = 0;
  if (!isNaN(numericValue) && !isNaN(nLow) && !isNaN(nHigh)) {
    const range = nHigh - nLow || 1;
    // Stretch the range slightly for visual comfort (Normal is center 50%)
    percentage = Math.min(Math.max(((numericValue - nLow) / range) * 50 + 25, 5), 95);
  } else {
    percentage = status === 'High' ? 85 : status === 'Low' ? 15 : 50;
  }

  const isWarning = status === 'High' || status === 'Low' || status === 'Critical' || status === 'Abnormal';

  return (
    <div className="w-full relative py-12 px-2 no-print">
      {/* Visual Bar */}
      <div className="h-4 w-full bg-emerald-500/10 rounded-full relative overflow-hidden">
        {/* Highlight Low Abnormal Zone */}
        <div className="absolute left-0 w-[25%] top-0 bottom-0 bg-rose-500/20" />
        {/* Highlight High Abnormal Zone */}
        <div className="absolute right-0 w-[25%] top-0 bottom-0 bg-rose-500/20" />
      </div>

      {/* Numerical Reference Bounds */}
      <div className="absolute top-[3.5rem] left-[25%] -translate-x-1/2 text-[10px] font-black text-gray-400 bg-white px-1">
        {nLow || '--'}
      </div>
      <div className="absolute top-[3.5rem] right-[25%] translate-x-1/2 text-[10px] font-black text-gray-400 bg-white px-1">
        {nHigh || '--'}
      </div>
      
      {/* Marker Tooltip/Box */}
      <motion.div 
        initial={{ left: '50%' }}
        animate={{ left: `${percentage}%` }}
        className="absolute top-2 -translate-x-1/2 flex flex-col items-center z-10"
      >
        <div className={`px-2.5 py-1 rounded-lg shadow-xl border-2 border-white text-[11px] font-black text-white
          ${isWarning ? 'bg-rose-500' : 'bg-emerald-600'}`}>
          {numericValue}
        </div>
        <div className={`w-1 h-10 mt-1 block ${isWarning ? 'bg-rose-500 opacity-20' : 'bg-emerald-600 opacity-20'}`} />
      </motion.div>

      {/* Axis Labels */}
      <div className="flex justify-between mt-10 text-[9px] font-black text-gray-300 uppercase tracking-[0.25em]">
        <span>Abnormal</span>
        <span>Normal Range</span>
        <span>Abnormal</span>
      </div>
    </div>
  );
};

/**
 * OCRScanningWorkspace Component
 * A premium medical document intelligence interface.
 */
const OCRScanningWorkspace = ({ user }) => {
  const [step, setStep] = useState('upload'); // upload, processing, results
  const [subStep, setSubStep] = useState(0); // 0: OCR, 1: Classify, 2: Transform
  const [file, setFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const [demoSplit, setDemoSplit] = useState(44);
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const docInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  // PRIMARY FIX: Reset marker selection when a new report is generated/loaded
  useEffect(() => {
    if (result) {
      setSelectedMarkerIndex(0);
    }
  }, [result]);

  const processingSteps = [
    "Extracting text from your uploaded scan...",
    "Classifying medical document type...",
    "Generating structured AI report..."
  ];

  const startCamera = async () => {
    setIsCameraOpen(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setError("Unable to access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      setIsReviewing(true);
      stopCamera();
    }
  };

  const handleReviewConfirm = () => {
    // Convert base64 to File object
    fetch(capturedImage)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "captured_report.jpg", { type: "image/jpeg" });
        handleFile(file);
        setIsReviewing(false);
        setCapturedImage(null);
      });
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const startProcessing = async (selectedFile) => {
    setStep('processing');
    setSubStep(0);
    setError(null);

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(selectedFile);
      });
      const base64 = await base64Promise;

      // SINGLE STEP MULTIMODAL ANALYSIS (Top-Notch accuracy)
      setSubStep(0); // Analyzing
      const response = await apiClient.post('/api/analyze-report', { 
        image: base64, 
        mimeType: selectedFile.type,
        patientId: user?.id
      });
      
      setSubStep(1); // Structuring
      await new Promise(r => setTimeout(r, 600));
      setSubStep(2); // Finalizing
      await new Promise(r => setTimeout(r, 600));
      
      const isImageFile = (selectedFile.type || '').startsWith('image/');
      const originalImage = isImageFile ? base64 : null;
      const normalized = normalizeAnalysis(response.data);
      setResult({ ...normalized, originalImage, sourceFileName: selectedFile.name || 'Uploaded file' });
      setShowComparison(Boolean(originalImage));
      setStep('results');
    } catch (err) {
      console.error('Pipeline Error:', err);
      let errMsg = 'Intelligence pipeline failed. Please check the document clarity.';
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        errMsg = 'The AI is taking longer than usual due to high demand. Please try again in 30 seconds.';
      } else if (err.response?.status === 503) {
        errMsg = 'The AI server is currently overloaded. We are retrying, but please try again shortly.';
      } else {
        errMsg = err.response?.data?.details || err.response?.data?.error || errMsg;
      }
      
      setError(errMsg);
      setStep('upload');
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      const payload = {
        patient_id: user?.authId || user?.id,
        patient_name: result.patientInfo?.name || user?.name || 'Unknown',
        test_name: result.type === 'Prescription' ? 'Medical Prescription' : 'Diagnostic Report',
        category: 'AI Scan',
        results: result,
        date: new Date().toISOString().split('T')[0],
        status: 'Ready',
        uploaded_by: user?.name || 'AI Scan Station',
      };
      await apiClient.post('/reports', payload);
      alert('Report saved successfully to "My Reports"!');
    } catch (err) {
      console.error('Save Error:', err);
      alert(err.response?.data?.error || err.response?.data?.details || err.message || 'Failed to save report.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LabIntel Medical Report',
          text: `Summary of my ${result.type}: ${result.summary}`,
          url: window.location.href,
        });
      } catch (err) { console.log('Share cancelled'); }
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleVoice = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(result.summary);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const runDemoAiReport = () => {
    setError(null);
    setShowOptions(false);
    setFile(null);
    setImagePreview(null);

    const demoReport = normalizeAnalysis({
      type: 'Lab Report',
      patientInfo: {
        name: 'Sayantan Maji',
        age: '45',
        gender: 'Male',
        date: new Date().toLocaleDateString(),
        doctor: 'Dr. N. Roy, Hematology',
      },
      results: {
        parameters: [
          {
            name: 'White Blood Cell Count',
            value: '6.3',
            unit: 'Thousand/uL',
            range: '3.8 - 10.8',
            low: 3.8,
            high: 10.8,
            status: 'Normal',
            education: "White blood cells (WBCs) are the body's protectors. Each of the five varieties of WBCs plays its own specific role in defending your body against illness or injury.",
            insight: 'Your count is comfortably within the reference range, indicating a healthy immune baseline.',
            recommendation: "Maintain a balanced diet rich in leafy greens to support leukocyte health."
          },
          {
            name: 'Red Blood Cell Count',
            value: '4.8',
            unit: 'Million/uL',
            range: '4.5 - 5.9',
            low: 4.5,
            high: 5.9,
            status: 'Normal',
            education: "Red blood cells carry oxygen from your lungs to the rest of your body.",
            insight: 'Oxygen delivery capacity is normal.',
            recommendation: "Ensure adequate iron intake."
          },
          {
            name: 'Hemoglobin',
            value: '13.1',
            unit: 'g/dL',
            range: '13.2 - 17.1',
            low: 13.2,
            high: 17.1,
            status: 'Low',
            education: "Hemoglobin is the protein in your red blood cells that carries oxygen.",
            insight: 'Your level is just below the typical range, which might indicate mild anemia or iron deficiency.',
            recommendation: "Consider iron-rich foods like spinach and lean meats. Consult your doctor."
          },
          {
            name: 'Hematocrit',
            value: '39.5',
            unit: '%',
            range: '38.5 - 50.0',
            low: 38.5,
            high: 50.0,
            status: 'Normal',
            insight: 'The volume percentage of red blood cells is healthy.',
            education: "Hematocrit measures the proportion of red blood cells in your blood."
          }
        ],
      },
      summary:
        'Overall blood count is healthy, with a single sub-threshold reading for Hemoglobin. This typically suggests early monitoring for iron sufficiency is warranted.',
      advice: [
        'Repeat CBC panel in 3 months to monitor Hemoglobin trend.',
        'Consider iron-rich nutritional adjustments.',
        'Maintain consistent hydration for optimal cell volume.'
      ],
      riskLevel: 'Low',
    });

    setResult({
      ...demoReport,
      originalImage: null,
      sourceFileName: 'Demo Lab Report',
    });
    setShowComparison(false);
    setStep('results');
  };

  const runDemoPrescription = () => {
    setError(null);
    setShowOptions(false);
    setFile(null);
    setImagePreview(null);

    const demoReport = normalizeAnalysis({
      type: 'Prescription',
      patientInfo: {
        name: 'Sayantan Maji',
        age: '45',
        gender: 'Male',
        date: new Date().toLocaleDateString(),
        doctor: 'Dr. S. K. Das, General Medicine',
      },
      results: {
        medicines: [
          {
            name: 'Amoxicillin 500mg',
            dosage: '1 Capsule',
            frequency: ['Morning', 'Afternoon', 'Night'],
            duration: '5 Days',
            purpose: 'Bacterial Infection'
          },
          {
            name: 'Paracetamol 650mg',
            dosage: '1 Tablet',
            frequency: ['Morning', 'Night'],
            duration: '3 Days',
            purpose: 'Fever and Pain'
          },
          {
            name: 'Pantoprazole 40mg',
            dosage: '1 Tablet',
            frequency: ['Morning'],
            duration: '10 Days',
            purpose: 'Acidity (Take before food)'
          }
        ],
      },
      summary:
        'A comprehensive prescription for treating a respiratory infection and associated fever. Ensure completion of the antibiotic course.',
      advice: [
        'Complete the full 5-day course of Amoxicillin even if you feel better.',
        'Drink plenty of warm fluids.',
        'Avoid cold drinks and direct AC exposure.'
      ],
      riskLevel: 'Low',
    });

    setResult({
      ...demoReport,
      originalImage: null,
      sourceFileName: 'Demo Prescription',
    });
    setShowComparison(false);
    setStep('results');
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setImagePreview(null);
    setResult(null);
    setError(null);
    setIsCameraOpen(false);
    setIsReviewing(false);
    setCapturedImage(null);
    setShowComparison(false);
  };

  // Ensure camera is stopped on unmount
  useEffect(() => {
    const activeVideo = videoRef.current;
    return () => {
      if (activeVideo && activeVideo.srcObject) {
        activeVideo.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const parameterList = result?.results?.parameters || [];
  const statusCounts = parameterList.reduce(
    (acc, item) => {
      const normalized = normalizeStatus(item?.status);
      if (normalized === 'Normal') acc.normal += 1;
      if (normalized === 'Abnormal') acc.abnormal += 1;
      if (normalized === 'Borderline') acc.borderline += 1;
      return acc;
    },
    { normal: 0, abnormal: 0, borderline: 0 }
  );

  const totalMarkers = Math.max(parameterList.length, 1);
  const abnormalWeightedScore = Math.round((statusCounts.abnormal * 1 + statusCounts.borderline * 0.5) / totalMarkers * 100);
  const baseSeverity = result?.riskLevel === 'High' ? 75 : result?.riskLevel === 'Medium' ? 55 : 32;
  const severityScore = Math.min(98, Math.max(8, Math.round(baseSeverity + abnormalWeightedScore * 0.25)));
  const confidenceScore = Math.min(99, Math.max(72, 82 + Math.round(totalMarkers * 2.2)));
  const progressionScore = Math.min(99, Math.max(5, Math.round((severityScore * 0.65) + (abnormalWeightedScore * 0.35))));

  const clamp = (value) => Math.min(99, Math.max(5, value));
  const trendSeries =
    result?.riskLevel === 'Low'
      ? [
          { label: 'W-6', value: clamp(progressionScore + 10) },
          { label: 'W-4', value: clamp(progressionScore + 7) },
          { label: 'W-2', value: clamp(progressionScore + 3) },
          { label: 'Now', value: clamp(progressionScore) },
        ]
      : result?.riskLevel === 'Medium'
      ? [
          { label: 'W-6', value: clamp(progressionScore - 6) },
          { label: 'W-4', value: clamp(progressionScore - 4) },
          { label: 'W-2', value: clamp(progressionScore - 2) },
          { label: 'Now', value: clamp(progressionScore) },
        ]
      : [
          { label: 'W-6', value: clamp(progressionScore - 12) },
          { label: 'W-4', value: clamp(progressionScore - 8) },
          { label: 'W-2', value: clamp(progressionScore - 4) },
          { label: 'Now', value: clamp(progressionScore) },
        ];

  return (
    <div className="h-full flex flex-col pt-2 print:pt-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page { size: auto; margin: 10mm; }
          .ocr-print-shell {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .ocr-print-card {
            box-shadow: none !important;
            border-color: #d1d5db !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .ocr-print-table {
            overflow: visible !important;
          }
          .ocr-print-expanded {
            display: table-row !important;
          }
        }
      `}</style>
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={photoInputRef}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
        accept="image/*"
      />
      <input 
        type="file" 
        ref={docInputRef}
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
        accept=".pdf,image/*"
      />

      <AnimatePresence mode="wait">
        {/* Camera Modal */}
        {isCameraOpen && (
          <motion.div 
            key="camera-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-12 flex items-center justify-center gap-8">
              <button 
                onClick={stopCamera}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30"
              >
                <X size={28} />
              </button>
              <button 
                onClick={capturePhoto}
                className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#14453d] shadow-2xl border-4 border-white transform transition-transform active:scale-90"
              >
                <div className="w-16 h-16 rounded-full border-2 border-[#14453d]" />
              </button>
              <div className="w-16 h-16 invisible" /> {/* Spacer */}
            </div>
            <div className="absolute top-8 text-white/60 text-xs font-bold uppercase tracking-widest bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
              Scanning Mode Active
            </div>
          </motion.div>
        )}

        {/* Review Modal */}
        {isReviewing && (
          <motion.div 
            key="review-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] bg-black/95 flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full aspect-[3/4] rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-gray-900 flex items-center justify-center">
              <img src={capturedImage} className="w-full h-full object-contain" alt="Captured" />
            </div>
            <div className="mt-8 flex gap-4 w-full max-w-md">
              <button 
                onClick={() => { setIsReviewing(false); setCapturedImage(null); startCamera(); }}
                className="flex-1 py-4 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-colors"
              >
                Retake
              </button>
              <button 
                onClick={handleReviewConfirm}
                className="flex-1 py-4 rounded-2xl bg-white text-[#14453d] font-bold hover:brightness-90 transition-all shadow-xl shadow-white/5"
              >
                Analyze Now
              </button>
            </div>
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full"
          >
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-16 h-16 bg-[#e8f5f0] rounded-3xl flex items-center justify-center mx-auto mb-6 text-[#14453d] shadow-sm">
                <Sparkles size={32} />
              </div>
              <h1 className="text-3xl font-black text-gray-800 tracking-tight mb-3 uppercase">AI Scan Station</h1>
              <p className="text-gray-500 max-w-md mx-auto">
                Upload reports or prescriptions. Our multimodal Gemini engine transforms raw scans into "AI Scan" reports instantly.
              </p>
            </div>

            <div className="w-full relative">
              <div 
                className={`relative bg-white rounded-[2.5rem] p-4 shadow-xl border-2 transition-all 
                  ${error ? 'border-rose-100' : 'border-gray-100 hover:border-[#14453d]/20'}`}
                style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      readOnly
                      value={file ? file.name : ''}
                      placeholder="Upload report, prescription, or scan..." 
                      className="bg-transparent w-full text-lg outline-none text-gray-700 placeholder-gray-400 cursor-pointer"
                      onClick={() => setShowOptions(!showOptions)}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    {file && (
                      <button 
                        onClick={() => { setFile(null); setImagePreview(null); }}
                        className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 hover:shadow-md transition-all active:scale-95 shadow-sm"
                      >
                        <X size={22} />
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        if (file) {
                          startProcessing(file);
                        } else {
                          setShowOptions(!showOptions);
                        }
                      }}
                      className={`p-3 rounded-2xl border transition-all active:scale-95 shadow-sm 
                        ${showOptions ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-100 text-[#14453d] hover:shadow-md'}`}
                    >
                      <Plus size={22} className={`transition-transform duration-300 ${showOptions ? 'rotate-45' : ''}`} />
                    </button>
                    <button 
                      onClick={() => {
                        if (file) {
                          startProcessing(file);
                        } else {
                          docInputRef.current?.click();
                        }
                      }}
                      style={{ background: PRIMARY }}
                      className="p-3 text-white rounded-2xl shadow-lg hover:opacity-90 transition-all active:scale-95"
                    >
                      <ArrowRight size={22} />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="grid grid-cols-3 gap-3 p-4 mt-4"
                    >
                      {[
                        { icon: Camera, label: 'Camera', color: 'bg-blue-50 text-blue-600', action: startCamera },
                        { icon: ImageIcon, label: 'Photos', color: 'bg-purple-50 text-purple-600', action: () => photoInputRef.current?.click() },
                        { icon: FileText, label: 'Files', color: 'bg-emerald-50 text-emerald-600', action: () => docInputRef.current?.click() }
                      ].map((opt) => (
                        <button 
                          key={opt.label}
                          onClick={() => { setShowOptions(false); opt.action(); }}
                          className={`${opt.color} p-4 rounded-3xl flex flex-col items-center gap-2 hover:scale-[1.02] transition-transform font-bold text-xs uppercase tracking-widest`}
                        >
                          <opt.icon size={20} />
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div className="absolute -bottom-12 left-0 right-0 flex justify-center text-rose-500 text-sm font-bold flex items-center gap-2">
                  <AlertCircle size={16} /> {error}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="flex gap-6">
                <button 
                  onClick={runDemoAiReport}
                  className="text-xs font-bold text-gray-400 hover:text-[#14453d] transition-colors flex items-center gap-2"
                >
                  <Sparkles size={14} className="opacity-50" /> Try Demo Lab Report
                </button>
                <button 
                  onClick={runDemoPrescription}
                  className="text-xs font-bold text-gray-400 hover:text-[#14453d] transition-colors flex items-center gap-2"
                >
                  <Sparkles size={14} className="opacity-50" /> Try Demo Prescription
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'processing' && (
          <motion.div 
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center p-8"
          >
            <div className="relative mb-12">
              <div className="w-32 h-32 rounded-full border-4 border-gray-100 flex items-center justify-center">
                <Loader2 size={48} className="text-[#14453d] animate-spin" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-[#14453d] rounded-full blur-2xl"
              />
            </div>
            
            <h2 className="text-2xl font-black text-gray-800 mb-6">Medical Pipeline Active</h2>
            
            <div className="w-full max-sm space-y-4 mx-auto">
              {processingSteps.map((text, i) => (
                <div key={i} className="flex items-center gap-4 px-4">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 
                    ${subStep > i ? 'bg-emerald-500 text-white shadow-lg' : 
                      subStep === i ? 'bg-[#14453d] text-white animate-pulse' : 'bg-gray-100 text-gray-300'}`}
                  >
                    {subStep > i ? <CheckCircle2 size={16} /> : <div className="text-xs font-bold">{i+1}</div>}
                  </div>
                  <span className={`text-sm font-bold transition-all duration-500 
                    ${subStep === i ? 'text-gray-800 scale-105 origin-left' : 'text-gray-400'}`}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'results' && result && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ocr-print-shell flex-1 flex flex-col p-4 max-w-7xl mx-auto w-full"
          >
            {/* Premium Action Bar */}
            <div className="flex items-center justify-between mb-8 no-print px-2">
              <div className="flex items-center gap-4">
                <button 
                  onClick={reset}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-gray-500 font-bold rounded-xl border border-gray-100 hover:text-[#14453d] hover:border-[#14453d]/40 transition-all text-xs shadow-sm"
                >
                  <Plus size={16} /> New scan
                </button>
              </div>
              <div className="flex gap-2">
                <div className="flex items-center bg-white rounded-xl border border-gray-100 shadow-sm p-1">
                  {[
                    { icon: Download, action: handlePrint, label: 'Save PDF' },
                    { icon: Share2, action: handleShare, label: 'Share' },
                    { icon: Printer, action: handlePrint, label: 'Print' }
                  ].map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={opt.action}
                      title={opt.label}
                      className="p-2 text-gray-400 hover:text-[#14453d] hover:bg-gray-50 rounded-lg transition-all"
                    >
                      <opt.icon size={18} />
                    </button>
                  ))}
                <button 
                  onClick={handleSave}
                  style={{ background: PRIMARY }}
                  className="px-6 py-2.5 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-all text-sm"
                >
                  <Save size={18} /> Save Clinical Analysis
                </button>
              </div>
            </div>
          </div>

            {/* THE REAL AI LAB REPORT (Digital View) */}
            <div className="max-w-4xl mx-auto w-full space-y-10 pb-20">
              
              {/* Report Header / Demographic Card */}
              <div className="ocr-print-card bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#e8f5f0] rounded-3xl flex items-center justify-center text-[#14453d] shadow-sm">
                      <Heart size={32} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-gray-800 tracking-tight">{result.patientInfo?.name}</h2>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">{result.patientInfo?.age} Y / {result.patientInfo?.gender}</span>
                        <span className="text-[11px] font-bold text-emerald-600">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Analysis Date</p>
                    <p className="text-sm font-bold text-gray-700">{result.patientInfo?.date}</p>
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">Status: Clinical Synthesis Complete</p>
                  </div>
                </div>
              </div>
              {/* Comprehensive Medical Panel (Conditional) */}
              {result.type === 'Lab Report' ? (
                <div className="ocr-print-card bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#14453d]">Diagnostic Biomarker Panel</h3>
                     <div className="flex gap-4">
                       <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Normal
                       </span>
                       <span className="flex items-center gap-2 text-[10px] font-black text-rose-600 uppercase tracking-widest">
                         <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Abnormal
                       </span>
                     </div>
                  </div>
                  
                  <div className="overflow-x-auto ocr-print-table">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/30">
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Parameter</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Result</th>
                          <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Units</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Ref. Range</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {parameterList.length > 0 ? parameterList.map((p, i) => {
                          const status = normalizeStatus(p.status);
                          const isSelected = selectedMarkerIndex === i;
                          return (
                            <React.Fragment key={i}>
                              <tr 
                                onClick={() => setSelectedMarkerIndex(isSelected ? -1 : i)}
                                className={`group cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-emerald-50/30' : ''}`}
                              >
                                <td className="px-8 py-6">
                                  <div className="text-sm font-black text-gray-800">{p.name}</div>
                                  <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest group-hover:text-emerald-600 transition-colors">
                                    {isSelected ? 'Click to hide details' : 'Click for AI Insight'}
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <span className={`text-base font-black ${status === 'Abnormal' ? 'text-rose-600' : 'text-gray-900'}`}>{p.value}</span>
                                </td>
                                <td className="px-4 py-6 text-center text-xs font-bold text-gray-400">{p.unit}</td>
                                <td className="px-8 py-6 text-center text-xs font-bold text-gray-400">{p.range}</td>
                                <td className="px-8 py-6 text-right">
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border
                                    ${status === 'Abnormal' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                                      status === 'Borderline' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                                      'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                              <tr className={`${isSelected ? 'table-row' : 'hidden print:table-row ocr-print-expanded'} bg-emerald-50/20`}>
                                <td colSpan={5} className="px-8 pb-10 pt-4">
                                  <motion.div 
                                    initial={{ opacity: 0, y: -10 }} 
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-12"
                                  >
                                    <div className="space-y-6">
                                      <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#14453d] mb-4 opacity-50">AI Interpretation</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{p.insight}</p>
                                      </div>
                                      {p.recommendation && (
                                        <div>
                                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[#14453d] mb-4 opacity-50">Clinical Advice</h4>
                                          <p className="text-sm text-gray-600 leading-relaxed font-medium">{p.recommendation}</p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-6">
                                      <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#14453d] mb-4 opacity-50">Educational Context</h4>
                                        <div className="p-6 bg-white rounded-3xl border border-emerald-100 shadow-sm">
                                          <p className="text-[13px] text-emerald-900 leading-relaxed font-bold italic">
                                            "{p.education || "No medical context provided."}"
                                          </p>
                                        </div>
                                      </div>
                                      <div className="pt-2 no-print">
                                        <RangeIndicator value={p.value} low={p.low} high={p.high} status={p.status} unit={p.unit} />
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            </React.Fragment>
                          );
                        }) : (
                          <tr>
                            <td colSpan={5} className="py-20 text-center">
                              <div className="flex flex-col items-center gap-4">
                                <AlertCircle size={32} className="text-amber-500 opacity-50" />
                                <p className="text-sm font-bold text-gray-400">No diagnostic biomarkers detected in this scan.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : result.type === 'Prescription' ? (
                <div className="ocr-print-card bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                  <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                     <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#14453d]">Medication Intelligence Schedule</h3>
                     <div className="flex gap-4">
                       <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                         <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Regimen
                       </span>
                     </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-gray-50/30">
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Medicine Name</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Dosage</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Frequency</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {result.results?.medicines?.length > 0 ? result.results.medicines.map((m, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-8 py-6">
                              <div className="text-sm font-black text-gray-800">{m.name}</div>
                              {m.duration && <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">For {m.duration}</div>}
                            </td>
                            <td className="px-8 py-6 text-center text-sm font-bold text-gray-700">{m.dosage}</td>
                            <td className="px-8 py-6 text-center">
                              <div className="flex justify-center gap-1.5">
                                {['Morning', 'Afternoon', 'Night'].map(t => (
                                  <div key={t} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter border
                                    ${m.frequency?.includes(t) ? 'bg-[#14453d] text-white border-[#14453d]' : 'bg-white text-gray-300 border-gray-100'}`}>
                                    {t.substring(0, 3)}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="px-8 py-6 text-right text-xs font-bold text-gray-500 max-w-[200px] truncate">{m.purpose}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={4} className="py-20 text-center">
                                <div className="flex flex-col items-center gap-4">
                                  <AlertCircle size={32} className="text-amber-500 opacity-50" />
                                  <p className="text-sm font-bold text-gray-400">No medications identified in this scan.</p>
                                </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="ocr-print-card bg-white rounded-[2.5rem] p-12 border border-gray-100 shadow-xl text-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
                      <FileText size={32} />
                   </div>
                   <h3 className="text-lg font-black text-gray-800 mb-2">General Medical Document</h3>
                   <p className="text-sm text-gray-500 max-w-sm mx-auto">
                     This document doesn't contain standard lab markers or prescriptions. 
                     Please refer to the AI Summary below for interpreted insights.
                   </p>
                </div>
              )}

              {/* Digital Recommendations */}
              <div className="ocr-print-card bg-white rounded-[2.5rem] p-10 shadow-xl border border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#14453d] mb-10 opacity-40">Lifestyle Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.advice?.map((item, i) => (
                    <div key={i} className="flex items-center gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-emerald-50 transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
                        {i === 0 ? <CheckCircle2 size={22} className="text-emerald-500" /> : 
                         i === 1 ? <Sun size={22} className="text-amber-500" /> : 
                         <Sparkles size={22} className="text-blue-500" />}
                      </div>
                      <span className="text-sm font-bold text-gray-700 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Conclusion */}
              <div className="ocr-print-card bg-[#14453d] rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-40 -mt-40 blur-3xl" />
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300 mb-8 opacity-60">Clinical Executive Summary</h3>
                 <p className="text-lg font-medium leading-relaxed text-emerald-50/90 mb-10 relative z-10">
                   {result.summary}
                 </p>
                 <div className="pt-8 border-t border-white/10 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-200/40">
                   <span>© 2026 LabIntel Digital Health</span>
                   <span>Verify through professional consult</span>
                 </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Robust Print Portal */}
      {isPrinting && result && (
        <PrintPortal>
          <PrintReport result={result} />
        </PrintPortal>
      )}
    </div>
  );
};

export default OCRScanningWorkspace;
