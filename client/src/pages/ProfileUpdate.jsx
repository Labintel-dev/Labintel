import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Calendar, ArrowLeft, Camera, 
  Save, Shield, Activity, MapPin, ChevronRight, CheckCircle
} from 'lucide-react';
import { supabase, getProfile, upsertProfile } from '../lib/supabase';

const PRIMARY = "#14453d";

export default function ProfileUpdate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    avatar_url: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        navigate('/');
        return;
      }
      
      const profile = await getProfile(authUser.id);
      setUser(authUser);
      setFormData({
        full_name: profile?.full_name || authUser.user_metadata?.full_name || '',
        email: authUser.email || '',
        phone: profile?.phone || '',
        age: profile?.age || '',
        gender: profile?.gender || '',
        address: profile?.address || '',
        avatar_url: profile?.avatar_url || ''
      });
      setLoading(false);
    };
    fetchUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { email, ...profileData } = formData;
    try {
      await upsertProfile(user.id, profileData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-[#14453d]/20 border-t-[#14453d] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-all font-bold text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h1 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Account Settings</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">
          
          {/* Sidebar / Info */}
          <div className="space-y-8">
            <div className="text-center lg:text-left">
              <div className="relative inline-block group">
                <div className="w-32 h-32 rounded-[40px] overflow-hidden bg-gray-100 border-4 border-white shadow-xl shadow-gray-200/50">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold" style={{ background: PRIMARY }}>
                      {formData.full_name?.charAt(0) || user.email?.charAt(0)}
                    </div>
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-500 hover:text-[#14453d] transition-all">
                  <Camera size={18} />
                </button>
              </div>
              <h2 className="mt-6 text-2xl font-black text-gray-800 leading-tight">
                {formData.full_name || 'Anonymous User'}
              </h2>
              <p className="text-sm text-gray-400 font-medium mt-1">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-white rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4 group hover:border-[#14453d]/20 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Shield size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Security</h4>
                  <p className="text-[10px] text-gray-400 font-medium">Authentication via Supabase</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-gray-300" />
              </div>
              <div className="p-5 bg-white rounded-3xl border border-gray-50 shadow-sm flex items-center gap-4 group hover:border-[#14453d]/20 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Activity size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Privacy</h4>
                  <p className="text-[10px] text-gray-400 font-medium">HIPAA Compliant storage</p>
                </div>
                <ChevronRight size={14} className="ml-auto text-gray-300" />
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-[40px] border border-gray-50 shadow-2xl shadow-gray-200/40 p-8 md:p-12 relative overflow-hidden">
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="text" value={formData.full_name} 
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#14453d]/10 focus:border-[#14453d] transition-all text-sm font-bold text-gray-700"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email (Read Only)</label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="email" value={formData.email} disabled
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      type="tel" value={formData.phone} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#14453d]/10 focus:border-[#14453d] transition-all text-sm font-bold text-gray-700"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Age</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        type="number" value={formData.age} 
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#14453d]/10 focus:border-[#14453d] transition-all text-sm font-bold text-gray-700"
                        placeholder="25"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Gender</label>
                    <select 
                      value={formData.gender} 
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full px-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#14453d]/10 focus:border-[#14453d] transition-all text-sm font-bold text-gray-700 appearance-none"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-5 text-gray-300" size={18} />
                    <textarea 
                      value={formData.address} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      rows={3}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#14453d]/10 focus:border-[#14453d] transition-all text-sm font-bold text-gray-700 resize-none"
                      placeholder="Your full residential address"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={saving}
                  className="w-full bg-[#14453d] text-white py-5 rounded-2xl font-bold shadow-xl shadow-[#14453d]/30 hover:shadow-2xl hover:shadow-[#14453d]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : success ? (
                    <><CheckCircle size={18} /> Profile Saved!</>
                  ) : (
                    <><Save size={18} /> Update Profile</>
                  )}
                </button>
              </div>
            </form>

            {/* Aesthetic accent */}
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] opacity-50 pointer-events-none" />
          </div>
        </div>
      </main>
    </div>
  );
}
