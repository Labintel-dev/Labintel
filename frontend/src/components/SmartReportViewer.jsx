import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Info, Microscope, Pill } from 'lucide-react';

const P = '#14453d'; // Primary dark teal

const SmartReportViewer = ({ isOpen, onClose, originalFileUrl, reportData }) => {
  const [view, setView] = useState('smart'); // 'smart' or 'original'

  if (!isOpen) return null;

  const toggleView = () => {
    setView(v => (v === 'smart' ? 'original' : 'smart'));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 sm:p-6 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-[#f0f9ff] shadow-2xl"
          style={{ backgroundImage: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-blue-100 bg-white/60 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="LabIntel" className="h-10 w-10 rounded-xl object-contain shadow-sm" />
              <div>
                <h2 className="text-xl font-black tracking-tight" style={{ color: P }}>LabIntel</h2>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Smart Report, Smarter You</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800">contact.labintel@gmail.com</span>
                <span className="text-xs font-semibold text-slate-500">www.labintel.com</span>
              </div>
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition-colors hover:bg-rose-50 hover:text-rose-500"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Patient Info Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-blue-100 bg-white/40 px-6 py-3 text-sm">
            <div>
              <span className="text-xs text-slate-500 block">Name</span>
              <span className="font-semibold text-slate-800">{reportData?.patientInfo?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Age/Gender</span>
              <span className="font-semibold text-slate-800">
                {reportData?.patientInfo?.age || '--'} / {reportData?.patientInfo?.gender || '--'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Date of Test</span>
              <span className="font-semibold text-slate-800">{reportData?.patientInfo?.date || '--'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Report Type</span>
              <span className="font-semibold text-slate-800">{reportData?.type || 'Lab Report'}</span>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="relative flex-1 overflow-hidden">
            {/* Slider Controls */}
            <button
              onClick={toggleView}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-r-xl bg-blue-500/90 p-3 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={toggleView}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-l-xl bg-blue-500/90 p-3 text-white shadow-lg backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
            >
              <ChevronRight size={24} />
            </button>

            <div className="flex h-full w-[200%] transition-transform duration-500 ease-in-out" style={{ transform: `translateX(${view === 'smart' ? '0' : '-50%'})` }}>
              
              {/* Slide 1: Smart Report */}
              <div className="h-full w-1/2 overflow-y-auto p-6 md:p-8">
                <div className="mx-auto max-w-4xl space-y-6">
                  
                  {/* Summary Box */}
                  <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                        <Info size={20} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">AI Summary</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-[15px]">
                      {reportData?.summary || "No summary available."}
                    </p>
                  </div>

                  {/* Test Results */}
                  {reportData?.results?.parameters?.length > 0 && (
                    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                            <Microscope size={20} />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800">Test Parameters</h3>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Normal</span>
                          <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">Abnormal</span>
                          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Borderline</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-800 border-b border-slate-100">
                            <tr>
                              <th className="px-4 py-3">Test Name</th>
                              <th className="px-4 py-3">Result</th>
                              <th className="px-4 py-3">Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {reportData.results.parameters.map((param, idx) => {
                              const isAbnormal = param.status === 'Abnormal' || param.status === 'High' || param.status === 'Low';
                              const isBorderline = param.status === 'Borderline';
                              
                              let colorClass = 'bg-white';
                              let textClass = 'text-green-700 font-bold';
                              
                              if (isAbnormal) {
                                colorClass = 'bg-rose-50/30';
                                textClass = 'text-rose-700 font-bold';
                              } else if (isBorderline) {
                                colorClass = 'bg-amber-50/30';
                                textClass = 'text-amber-600 font-bold';
                              }

                              return (
                                <tr key={idx} className={colorClass}>
                                  <td className="px-4 py-4 font-medium text-slate-800">{param.name}</td>
                                  <td className="px-4 py-4">
                                    <span className={textClass}>
                                      {param.value} {param.unit}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 text-xs">
                                    <div className="flex flex-col gap-1">
                                      <div className="flex justify-between w-full max-w-[200px] text-[10px] text-slate-400">
                                        <span>Normal</span>
                                        <span>{param.high || ''}</span>
                                        <span>High</span>
                                      </div>
                                      <div className="relative h-1.5 w-full max-w-[200px] rounded-full bg-slate-200 overflow-hidden">
                                        {/* Simple visualization bar */}
                                        <div className="absolute left-0 top-0 h-full w-3/4 bg-gradient-to-r from-green-400 to-rose-400"></div>
                                        {/* Marker based on result (approximation) */}
                                        <div className="absolute top-0 h-full w-1 bg-slate-800 shadow-sm" style={{ left: isAbnormal ? '80%' : '30%' }}></div>
                                      </div>
                                      <span className="text-[11px] text-slate-500 mt-1">{param.range}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Medicines */}
                  {reportData?.results?.medicines?.length > 0 && (
                    <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-500">
                          <Pill size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Prescribed Medicines</h3>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {reportData.results.medicines.map((med, idx) => (
                          <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <h4 className="font-bold text-slate-800">{med.name}</h4>
                            <p className="text-sm text-slate-500 mt-1">
                              {med.dosage} • {Array.isArray(med.frequency) ? med.frequency.join(', ') : med.frequency}
                            </p>
                            {med.duration && <p className="text-xs text-slate-400 mt-1">Duration: {med.duration}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips / Advice */}
                  {reportData?.advice?.length > 0 && (
                    <div className="rounded-2xl bg-blue-600 p-6 text-white shadow-md">
                      <h3 className="text-lg font-bold mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5">
                        <CheckCircle2 size={18} />
                        Tips & Next Steps
                      </h3>
                      <ul className="space-y-3">
                        {reportData.advice.map((adv, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-blue-50">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300"></span>
                            <span>{adv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>

              {/* Slide 2: Original Report */}
              <div className="h-full w-1/2 p-6 md:p-8 bg-slate-100">
                <div className="mx-auto h-full max-w-4xl rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                  <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Original Document</h3>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</span>
                  </div>
                  <div className="flex-1 bg-slate-200/50 p-4 overflow-auto flex items-start justify-center">
                    {originalFileUrl?.includes('application/pdf') || originalFileUrl?.endsWith('.pdf') ? (
                      <object data={originalFileUrl} type="application/pdf" className="w-full h-full min-h-[600px] rounded-xl shadow-sm">
                        <p className="text-center p-10 text-slate-500">PDF cannot be displayed. <a href={originalFileUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline">Download here</a></p>
                      </object>
                    ) : (
                      <img src={originalFileUrl} alt="Original Report" className="max-w-full rounded-xl shadow-sm" />
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SmartReportViewer;
