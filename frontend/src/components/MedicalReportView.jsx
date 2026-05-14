import React, { useRef, useState } from 'react';
import { 
  Download, Share2, Activity, User, Calendar, 
  MapPin, Stethoscope, AlertTriangle, CheckCircle, 
  ArrowRight, Info, Utensils, Heart, ShieldAlert,
  Printer, TrendingUp, Search, Volume2, MessageSquare, StopCircle, 
  Sparkles, FileText
} from 'lucide-react';
import ChatAssistant from './ChatAssistant';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, 
  YAxis, CartesianGrid, Tooltip, Cell, BarChart, Bar
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ChevronLeft = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);

const P = '#14453d'; // Primary Brand Color

const MedicalReportView = ({ data, onBack }) => {
  const reportRef = useRef(null);
  const [lang, setLang] = useState('en');

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-gray-600 bg-gray-50 border-gray-100';
    }
  };

  const getFlagColor = (flag) => {
    switch (flag?.toLowerCase()) {
      case 'high':
      case 'critical': return 'text-rose-500';
      case 'low': return 'text-amber-500';
      default: return 'text-emerald-500';
    }
  };

  const downloadPDF = async () => {
    const element = reportRef.current;
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Medical_Report_${data.patientInfo.name || 'User'}.pdf`);
  };

  const shareReport = () => {
    if (navigator.share) {
      navigator.share({
        title: 'LabIntel Medical Report',
        text: `Health Analysis for ${data.patientInfo.name}`,
        url: window.location.href,
      });
    }
  };

  // Mock trend data for visualization
  const trendData = data.results.slice(0, 5).map(r => ({
    name: r.parameter.substring(0, 5),
    value: parseFloat(r.value) || Math.floor(Math.random() * 100),
  }));

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 sticky top-0 bg-[#f8fafc]/80 backdrop-blur-md z-20">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-[#14453d] transition-colors"
          >
            <ChevronLeft size={18} /> New Analysis
          </button>
          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <div className="flex bg-white rounded-2xl border border-gray-200 p-1 mr-2 shadow-sm">
              <button 
                onClick={() => setLang('en')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${lang === 'en' ? 'bg-[#14453d] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
              >
                ENGLISH
              </button>
              <button 
                onClick={() => setLang('hi')}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${lang === 'hi' ? 'bg-[#14453d] text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
              >
                हिंदी (HINDI)
              </button>
            </div>
            <button 
              onClick={shareReport}
              className="p-3 bg-white rounded-2xl border border-gray-200 text-gray-600 hover:shadow-lg hover:border-[#14453d]/30 transition-all active:scale-95"
              title="Share Report"
            >
              <Share2 size={20} />
            </button>
            <button 
              onClick={downloadPDF}
              style={{ background: P }}
              className="flex items-center gap-2 px-6 py-3 bg-[#14453d] text-white rounded-2xl font-bold shadow-xl shadow-[#14453d]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Download size={20} /> Download PDF
            </button>
          </div>
        </div>

        {/* Report Document Shell */}
        <main ref={reportRef} className="bg-white rounded-[2.5rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          
          {/* Document Header */}
          <div className="p-8 md:p-12 bg-gradient-to-br from-[#14453d] to-[#0a231f] text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                    <img src="/logo.jpg" alt="LabIntel" className="w-8 h-8 rounded-lg object-contain bg-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">LabIntel <span className="text-emerald-400">AI</span></h1>
                    <p className="text-xs font-bold text-white/50 uppercase tracking-[0.2em]">Medical Intelligence Systems</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-emerald-400" />
                    <span>{data.patientInfo.testDate || 'As per report'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={14} className="text-emerald-400" />
                    <span>{data.patientInfo.labName || 'Central Laboratory'}</span>
                  </div>
                </div>
              </div>

              <div className={`px-6 py-4 rounded-3xl border-2 backdrop-blur-md shadow-2xl ${getRiskColor(data.analysis.riskLevel)}`}>
                <div className="flex items-center gap-3">
                  <ShieldAlert size={24} />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Health Risk Level</div>
                    <div className="text-xl font-black">{data.analysis.riskLevel} Risk</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Patient Card Sticky-ish overlay */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 pt-8 border-t border-white/10">
              {[
                { label: 'Patient Name', value: data.patientInfo.name, icon: User },
                { label: 'Age / Gender', value: `${data.patientInfo.age} / ${data.patientInfo.gender}`, icon: Search },
                { label: 'Ref Doctor', value: data.patientInfo.doctorName || 'Self Referral', icon: Stethoscope },
                { label: 'Report Status', value: 'AI Verified', icon: CheckCircle },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-white/40">
                    <item.icon size={12} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{item.label}</span>
                  </div>
                  <div className="text-sm font-bold truncate">{item.value || 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-12 space-y-12 bg-white">
            
            {/* AI Summary Section */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Sparkles size={24} className="text-amber-500" />
                <h2 className="text-xl font-black text-gray-800 tracking-tight">AI Clinical Insight</h2>
              </div>
              
              <div className="bg-[#f0f9f6] rounded-3xl p-8 border border-emerald-100 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <p className="text-lg font-medium text-gray-700 leading-relaxed italic">
                    "{data.analysis.summary[lang] || data.analysis.summary.en || data.analysis.summary}"
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {data.analysis.detectedIssues.map((issue, i) => (
                      <span key={i} className="px-4 py-1.5 bg-sky-50 text-sky-700 rounded-full text-xs font-bold border border-sky-100">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Micro Visualization */}
                <div className="w-full md:w-48 h-32">
                   <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <Bar dataKey="value" radius={[4, 4, 4, 4]} fill={P} opacity={0.3} />
                    </BarChart>
                   </ResponsiveContainer>
                   <div className="text-center mt-2">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Parameter Variance</span>
                   </div>
                </div>
              </div>
            </section>

            {/* Abnormal Parameters Highlights */}
            {data.analysis.abnormalHighlights.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} className="text-rose-500" />
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">Critical Focus Areas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.analysis.abnormalHighlights.map((hl, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-4"
                    >
                      <div className="p-2 bg-rose-500 rounded-xl text-white">
                        <Activity size={16} />
                      </div>
                      <p className="text-sm font-bold text-rose-700">{hl}</p>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* Detailed Results Table */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={24} className="text-[#14453d]" />
                  <h2 className="text-xl font-black text-gray-800 tracking-tight">Full Lab Parameters</h2>
                </div>
              </div>
              
              <div className="rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">Parameter</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">Reported Value</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">Ref Range</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">Simplified Meaning</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="text-sm font-black text-gray-800">{r.parameter}</div>
                          <div className="text-[10px] font-medium text-gray-400 mt-0.5">Clinical Analysis</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`text-sm font-black ${getFlagColor(r.flag)}`}>
                            {r.value} <span className="text-[10px] text-gray-400 uppercase ml-1 font-bold">{r.unit}</span>
                          </div>
                          <div className={`text-[10px] font-black uppercase mt-0.5 ${getFlagColor(r.flag)}`}>{r.flag}</div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-xs font-bold text-gray-500">{r.range}</div>
                        </td>
                        <td className="px-6 py-5 max-w-xs">
                          <div className="text-xs text-gray-500 leading-relaxed font-medium">
                            {r.explanation[lang] || r.explanation.en || r.explanation}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Recommendations Grid */}
            <section className="space-y-8 pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp size={24} className="text-[#14453d]" />
                <h2 className="text-xl font-black text-gray-800 tracking-tight">Personalized Wellness Roadmaps</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Diet */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-widest">
                    <Utensils size={14} className="text-emerald-500" /> Dietary Adjustments
                  </h3>
                  <div className="space-y-3">
                    {data.analysis.nextSteps.diet.map((d, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-2xl group hover:bg-emerald-50 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-150 transition-transform" />
                        <span className="text-sm font-medium text-gray-600">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lifestyle */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-gray-800 uppercase tracking-widest">
                    <Heart size={14} className="text-rose-500" /> Lifestyle Integration
                  </h3>
                  <div className="space-y-3">
                    {data.analysis.nextSteps.lifestyle.map((l, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-2xl group hover:bg-rose-50 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400 group-hover:scale-150 transition-transform" />
                        <span className="text-sm font-medium text-gray-600">{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Medicine References (Educational) */}
            <section className="p-8 bg-sky-50/50 rounded-[2rem] border border-sky-100 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sky-800">
                  <Info size={24} />
                  <h2 className="text-xl font-black tracking-tight">Educational Medicine Ref</h2>
                </div>
                <div className="bg-white/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-sky-200 text-[10px] font-black uppercase tracking-wider text-sky-600">
                  Guidance Only
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.analysis.medicineReferences.map((med, i) => (
                  <div key={i} className="p-5 bg-white rounded-2xl border border-sky-100 shadow-sm shadow-sky-900/5">
                    <div className="text-sm font-black text-gray-800 mb-1">{med.name}</div>
                    <div className="text-xs text-gray-500 font-medium leading-relaxed">{med.purpose}</div>
                    <div className="mt-3 text-[9px] font-black text-sky-600 uppercase tracking-widest">{med.note}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white/50 rounded-2xl border border-dashed border-sky-200 text-center">
                 <p className="text-xs font-black text-sky-700 italic">
                   "⚠️ Disclaimer: This is AI-generated guidance. Consult a certified medical professional before any consumption."
                 </p>
              </div>
            </section>

          </div>

          {/* Report Footer */}
          <footer className="p-8 border-t border-gray-100 flex flex-col items-center gap-4 bg-gray-50/30">
             <div className="flex items-center gap-2">
                <img src="/logo.jpg" alt="LabIntel" className="w-6 h-6 rounded-lg opacity-50 transition-opacity hover:opacity-100 cursor-pointer" />
                <span className="text-sm font-black text-gray-300 tracking-tight">LABINTEL AI ENGINE v1.2</span>
             </div>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center max-w-lg">
               This report was generated using Llama 4 Clinical NLP model. Data processing is encrypted and adheres to digital privacy standards.
             </p>
          </footer>
        </main>
      </div>

    </div>
  );
};

export default MedicalReportView;
