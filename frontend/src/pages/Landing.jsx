import { Link } from 'react-router-dom';
import { FlaskConical, ChevronRight, Activity, Shield, Users, ArrowRight } from 'lucide-react';
import { Button } from '../components/common';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-teal-200">
      {/* Navigation */}
      <nav className="w-full relative z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-teal flex items-center justify-center text-white shadow-lg shadow-teal-500/30">
              <FlaskConical size={20} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-cyan-700">
              LabIntel
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="outline" className="rounded-full px-6 border-slate-300 text-slate-700 hover:text-teal-700 hover:border-teal-600 hover:bg-teal-50 transition-all">
                Patient Login
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        
        <div className="max-w-5xl mx-auto px-6 pt-16 pb-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-100/50 text-teal-700 text-sm font-medium mb-8">
            <span className="flex h-2 w-2 rounded-full bg-teal-500 animate-pulse"></span>
            The Next Generation LIMS
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight mb-8">
            Diagnostic insights, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600">
              delivered beautifully.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            LabIntel provides state-of-the-art reporting and AI-powered insights for modern diagnostic labs. Connect seamlessly with your patients and streamline your lab operations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button className="rounded-full px-8 py-6 text-lg w-full sm:w-auto shadow-xl shadow-teal-500/20 hover:scale-105 transition-all">
                Access Patient Portal <ArrowRight size={20} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="w-full bg-white/60 backdrop-blur-md border-t border-slate-100 py-16">
          <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Activity size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">AI-Powered Insights</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Advanced generative AI helps decode complex lab reports into simple, actionable health summaries.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Secure & Private</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Bank-grade encryption ensures your medical data remains completely private and secure at all times.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Whitelabel Labs</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Labs get their own customized URLs and distinct branding for staff and patient interfaces.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="w-full py-6 text-center text-slate-400 text-sm bg-white/50 border-t border-slate-100">
        &copy; {new Date().getFullYear()} LabIntel Technologies. All rights reserved.
      </footer>
    </div>
  );
}
