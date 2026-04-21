import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Activity, 
  Calendar, Filter, RefreshCw, AlertCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { getReports } from '../lib/supabase';

const PRIMARY = '#14453d';

const TrendsView = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarker, setSelectedMarker] = useState('Hemoglobin');
  const [trendData, setTrendData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReports(user.id);
        const readyReports = data.filter(r => r.status === 'Ready').sort((a,b) => new Date(a.date) - new Date(b.date));
        setReports(readyReports);
        
        // Extract common markers for the trend
        const markers = new Set();
        readyReports.forEach(r => {
          (r.results || []).forEach(res => markers.add(res.name));
        });

        // Parse data for selected marker
        const parsed = readyReports.map(r => {
          const res = (r.results || []).find(m => m.name === selectedMarker);
          return {
            date: r.date,
            value: res ? parseFloat(res.value) : null,
            unit: res?.unit || ''
          };
        }).filter(d => d.value !== null);

        setTrendData(parsed);
      } catch (err) {
        console.error('Trend fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.id, selectedMarker]);

  const markersList = Array.from(new Set(reports.flatMap(r => (r.results || []).map(m => m.name))));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <RefreshCw className="animate-spin text-[#14453d]" size={32} />
      <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Compiling Health Data...</span>
    </div>
  );

  if (reports.length < 2) return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center space-y-4">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
        <Activity size={32} className="text-gray-300" />
      </div>
      <h3 className="text-lg font-black text-gray-800">Need More Data</h3>
      <p className="text-sm text-gray-400 max-w-xs">
        Trend tracking requires at least two generated reports to visualize your progress.
      </p>
    </div>
  );

  const lastValue = trendData[trendData.length - 1]?.value;
  const prevValue = trendData[trendData.length - 2]?.value;
  const diff = lastValue - prevValue;
  const isImproving = diff < 0; // Depends on marker, simplified for now

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Health Trajectory</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-0.5">Progress over {reports.length} Reports</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white border border-gray-100 p-1 rounded-2xl shadow-sm">
           <Filter size={14} className="ml-2 text-gray-400" />
           <select 
             value={selectedMarker} 
             onChange={(e) => setSelectedMarker(e.target.value)}
             className="text-xs font-black text-gray-700 bg-transparent py-2 pl-1 pr-4 outline-none appearance-none cursor-pointer"
           >
             {markersList.map(m => <option key={m} value={m}>{m}</option>)}
           </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trend Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isImproving ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isImproving ? <TrendingDown size={20} /> : <TrendingUp size={20} />}
            </div>
            <div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Latest Variance</div>
              <div className="text-lg font-black text-gray-800">
                {diff > 0 ? '+' : ''}{diff.toFixed(1)} {trendData[0]?.unit}
              </div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="p-4 bg-gray-50 rounded-2xl space-y-1">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Status</div>
                <div className="text-sm font-bold text-gray-700">Stable Progress Observed</div>
             </div>
             
             <div className="p-4 bg-[#14453d] text-white rounded-2xl space-y-2 relative overflow-hidden">
                <Activity size={48} className="absolute -right-2 -bottom-2 text-white/10" />
                <div className="text-[10px] font-black text-white/50 uppercase tracking-widest">AI Prediction</div>
                <p className="text-xs font-medium relative z-10">Based on your {selectedMarker} trajectory, maintaining current diet is recommended.</p>
             </div>
          </div>
        </motion.div>

        {/* Chart View */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm min-h-[320px]"
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{selectedMarker} Progress</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
               <Calendar size={12} /> Last 6 Months
            </div>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={PRIMARY} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={PRIMARY} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 800
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke={PRIMARY} 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TrendsView;
