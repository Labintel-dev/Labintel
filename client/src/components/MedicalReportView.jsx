import React, { useRef } from 'react';
import { 
  Printer, ArrowLeft, MapPin, 
  Phone, Stethoscope
} from 'lucide-react';

/**
 * Premium Clinical Report View
 * PIXEL PERFECT MATCH to "Drlogy" Clinical Style
 */
const MedicalReportView = ({ data, onBack }) => {
  const reportRef = useRef(null);

  const parameterList = Array.isArray(data.results) ? data.results : (data.results?.parameters || []);
  const patient = data.patientInfo || {};
  const lab = data.labDetails || {};
  const analysisId = data.id?.substring(0, 8).toUpperCase() || `LAB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-in fade-in duration-500 medical-report-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          html, body, #root {
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          body { 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .medical-report-page {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .medical-report-page > div {
            margin: 0 !important;
            max-width: none !important;
          }
          .report-container { 
            box-shadow: none !important; 
            border: none !important; 
            padding: 10mm !important; 
            width: 100% !important;
            margin: 0 !important;
            min-height: auto !important;
            background: white !important;
          }
          .biomarker-card { 
            break-inside: avoid !important; 
            page-break-inside: avoid !important;
            margin-bottom: 2rem !important;
          }
          .dashboard-shell-outer,
          .dashboard-shell,
          .dashboard-main,
          .dashboard-scroll {
            background: white !important;
          }
          @page { size: A4; margin: 0; }
        }
        .clinical-font { font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif !important; }
        .label-tiny { font-family: 'Inter', sans-serif; font-size: 8px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.15em; color: #999; }
        .biomarker-title { color: #1e40af; font-family: ui-serif, serif; font-size: 22px; font-weight: 900; }
      `}</style>

      <div className="max-w-4xl mx-auto mb-10">
        {/* Header Actions */}
        <div className="flex items-center justify-between gap-4 py-4 no-print border-b border-gray-100 mb-8">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-gray-500 font-bold hover:text-black transition-colors"><ArrowLeft size={18} /> Back</button>
          <div className="flex items-center gap-4">
            <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all"><Printer size={18} /> Print Report</button>
          </div>
        </div>

        {/* The Printable Report */}
        <main ref={reportRef} className="report-container bg-white p-8 md:p-12 shadow-2xl border border-gray-100 clinical-font">
          
          {/* 1. Brand Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-black mb-2">Labintel</h1>
              <p className="text-[10px] font-bold text-gray-400">contact.labintel@gmail.com</p>
            </div>
            <div className="text-right">
               <img src="/logo.jpg" alt="Logo" className="w-12 h-12 inline-block object-contain" />
            </div>
          </div>

          <div className="h-0.5 bg-black w-full mb-6" />

          {/* 2. Lab Identification */}
          <div className="mb-6">
            <h2 className="text-xl font-black uppercase tracking-[0.05em] text-black mb-2" style={{ fontFamily: 'Inter, sans-serif' }}>
              {lab.name || 'DRLOGY PATHOLOGY LAB'}
            </h2>
            <div className="flex flex-col gap-0.5">
              <p className="text-[9px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                <MapPin size={9} /> {lab.address || '101-105, SMART VISION COMPLEX, MUMBAI - 400076'}
              </p>
              <p className="text-[9px] font-bold text-gray-500 flex items-center gap-2 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                <Phone size={9} /> {lab.contact || '0123456789 | DRLOGYPATHLAB@DRLOGY.COM'}
              </p>
            </div>
          </div>

          {/* 3. Patient Metadata Row */}
          <div className="grid grid-cols-2 gap-y-6 mb-8 pb-8 border-b border-gray-200 border-dashed">
            <div>
              <p className="label-tiny mb-1.5">Full Patient Name</p>
              <p className="text-xl font-black text-black">{patient.name || 'Yashvi M. Patel'}</p>
            </div>
            <div className="text-right">
              <p className="label-tiny mb-1.5">Report Date</p>
              <p className="text-lg font-black">{patient.date || '28/04/2026'}</p>
            </div>
            <div>
              <p className="label-tiny mb-1.5">Demographics</p>
              <p className="text-sm font-bold text-gray-700">{patient.age ? `${patient.age}Y / ${patient.gender}` : 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="label-tiny mb-1.5">Analysis ID</p>
              <p className="text-xs font-mono font-bold text-gray-400 uppercase">{analysisId}</p>
            </div>
          </div>

          {/* 4. Clinical Header Divider */}
          <div className="mb-10 flex items-center gap-4">
             <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Clinical Biomarker Intelligence</h3>
             <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* 5. Biomarkers List */}
          <div className="space-y-14">
            {parameterList.map((item, idx) => {
              const isAbnormal = (item.status || '').toLowerCase() !== 'normal';
              return (
                <div key={idx} className="biomarker-card break-inside-avoid border-b border-gray-50 pb-12 last:border-0">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="biomarker-title">{item.name || item.parameter}</h3>
                      <div className="flex items-center gap-5 mt-2">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
                          OBSERVED: <span className="text-black ml-1">{item.value} {item.unit}</span>
                        </span>
                        <span className="w-px h-3 bg-gray-200" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>
                          REF: <span className="text-black ml-1">{item.range}</span>
                        </span>
                      </div>
                    </div>
                    <div className="px-5 py-2 border border-gray-300 text-[10px] font-black uppercase tracking-widest text-black" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.status || 'NORMAL'}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="pl-4 border-l-2 border-gray-100"><p className="label-tiny mb-2">Simplification</p><p className="text-sm font-medium italic text-gray-500 leading-relaxed">"{item.insight || item.explanation || 'Interpretation in progress.'}"</p></div>
                    <div className="pl-4 border-l-2 border-gray-100"><p className="label-tiny mb-2">Creative Solution</p><p className="text-sm font-black text-black">{item.creativeSolution || 'Maintain balanced nutrition and regular movement.'}</p></div>
                    <div className="bg-gray-50/40 rounded-2xl p-7 border border-gray-100 mt-4"><p className="label-tiny mb-3 text-gray-400">Suggestive Medicine Ref</p><p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight leading-loose">{item.suggestedMedicine || 'Educational medication groups info provided upon professional consult.'}</p></div>
                    <div className="flex items-center gap-4 pt-3">
                      <div className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center text-gray-300"><Stethoscope size={16} /></div>
                      <div><p className="label-tiny mb-0.5">Recommended Expert</p><p className="text-[10px] font-black text-black uppercase tracking-widest leading-relaxed">{item.suggestedSpecialist || 'General Internal Medicine'}</p></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Clinical Executive Summary Card */}
          {(data.analysis?.summary || data.summary) && (
            <div className="mt-24 break-inside-avoid">
               <div className="bg-gray-50/50 rounded-[3rem] p-12 border border-gray-100 shadow-sm">
                 <p className="label-tiny mb-6 text-gray-400">Clinical Executive Summary</p>
                 <p className="text-base font-bold text-gray-700 leading-relaxed">
                   {typeof data.analysis?.summary === 'object' ? data.analysis.summary.en : (data.analysis?.summary || data.summary)}
                 </p>
               </div>
            </div>
          )}

          {/* 7. Disclaimer Footer */}
          <div className="mt-28 pt-12 text-center">
            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em] max-w-2xl mx-auto leading-loose">
              VALIDATED THROUGH LABINTEL CLINICAL INTELLIGENCE PROTOCOL. THIS IS AN EDUCATIONAL SYNTHESIS. © 2026 LABINTEL.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MedicalReportView;
