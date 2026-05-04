import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, X, Bot, User, 
  Sparkles, RefreshCw, ChevronRight, HelpCircle
} from 'lucide-react';
import apiClient from '../services/apiClient';

const ChatAssistant = ({ reportData, onClose }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: `Hello! I'm your LabIntel AI assistant. I've analyzed your ${reportData.patientInfo.testDate} report. How can I help you understand your results today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiClient.post('/chat-report', {
        message: input,
        reportData: reportData,
        history: messages
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I'm having trouble connecting to my medical brain right now. Please try again in a moment." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Explain my abnormal values",
    "What should I eat?",
    "When should I see a doctor?",
    "Is this report better than last one?"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-x-3 bottom-3 z-[100] flex h-[80vh] max-h-[500px] w-auto flex-col overflow-hidden rounded-[1.5rem] border border-gray-100 bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-96 sm:rounded-[2rem]"
      style={{ boxShadow: '0 24px 80px rgba(20,69,61,0.2)' }}
    >
      {/* Header */}
      <div className="p-5 bg-[#14453d] text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
            <Bot size={20} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight">Health Assistant</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">AI Online</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-4 bg-gray-50/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed
              ${m.role === 'user' 
                ? 'bg-[#14453d] text-white rounded-tr-none' 
                : 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-tl-none'}`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <RefreshCw className="animate-spin text-emerald-500" size={14} />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Input */}
      <div className="p-5 bg-white border-t border-gray-100 space-y-4">
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                onClick={() => { setInput(s); }}
                className="px-3 py-1.5 bg-gray-50 hover:bg-emerald-50 text-[10px] font-bold text-gray-500 hover:text-emerald-700 rounded-full border border-gray-100 hover:border-emerald-200 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        
        <div className="relative">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your report..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 pr-12 text-xs font-medium outline-none focus:border-emerald-500 transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`absolute right-2 top-2 p-2 rounded-xl transition-all
              ${!input.trim() || loading ? 'text-gray-300' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'}`}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest text-center">
          AI-generated Guidance • Consult your Doctor
        </p>
      </div>
    </motion.div>
  );
};

export default ChatAssistant;
