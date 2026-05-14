import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, User, Phone, Calendar, Mail, Loader2 } from 'lucide-react';
import { supabase, uploadAvatar } from '../lib/supabase';
import { upsertServerProfile } from '../lib/serverApi';
import { useAuthStore } from '../store/authStore';

const PRIMARY = '#14453d';

const ProfileUpdateModal = ({ user, onClose, onUpdated }) => {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || '');
  const [dob, setDob] = useState(user.dob || '');
  const [email, setEmail] = useState(user.email || '');
  const [gender, setGender] = useState(user.gender || '');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(user.avatar_url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const calculateAge = (birthday) => {
    if (!birthday) return '';
    const ageDifMs = Date.now() - new Date(birthday).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let avatar_url = user.avatar_url;
      if (file) {
        avatar_url = await uploadAvatar(user.id, file);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || useAuthStore.getState().token;

      if (!token) throw new Error("No active session found");

      const response = await upsertServerProfile(token, {
        full_name: name,
        phone,
        dob,
        email,
        gender,
        avatar_url
      });

      if (response && response.data) {
        const currentUser = useAuthStore.getState().user;
        const currentLab = useAuthStore.getState().lab;
        useAuthStore.getState().setAuth(token, {
          ...currentUser,
          ...response.data,
          avatar_url
        }, currentLab);
      }

      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl shadow-black/20"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Update Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              {preview ? (
                <img src={preview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-md grayscale-[0.5]" style={{ background: PRIMARY }}>
                  {user.avatar}
                </div>
              )}
              <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="mt-2 text-xs text-gray-400 font-medium">Click to change profile picture</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Phone Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Gender</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none appearance-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Date of Birth</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[#14453d] focus:ring-2 focus:ring-[#14453d]/10 transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">Calculated Age</label>
                <input
                  type="text"
                  value={dob ? `${calculateAge(dob)} years` : '--'}
                  disabled
                  className="w-full px-4 py-2.5 bg-gray-100 border border-gray-100 rounded-xl text-sm text-gray-500 font-medium cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 font-medium text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#14453d] text-white rounded-2xl text-sm font-bold uppercase tracking-[0.1em] shadow-lg shadow-[#14453d]/20 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Update Profile'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ProfileUpdateModal;
