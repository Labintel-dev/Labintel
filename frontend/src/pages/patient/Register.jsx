import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useUIStore } from '../../store/uiStore';
import api from '../../services/api';
import { FlaskConical, Mail, Lock, User, Phone, Calendar } from 'lucide-react';

const schema = z.object({
  full_name:        z.string().min(2, 'Full name required'),
  phone:            z.string().regex(/^\+91[6-9]\d{9}$/, 'Format: +91XXXXXXXXXX'),
  date_of_birth:    z.string().optional(),
  gender:           z.enum(['male', 'female', 'other']).optional(),
});

export default function PatientRegister() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Call backend to create patient record
      const response = await api.post('/auth/patient/register', {
        phone: data.phone,
        full_name: data.full_name,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender || null,
      });

      if (response.data?.data?.patient) {
        addToast('Registration successful! You can now log in.', 'success');
        navigate('/login');
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Registration failed. Please try again.';
      addToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-teal shadow-xl shadow-teal-500/30 mb-4">
            <FlaskConical size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">LabIntel</h1>
          <p className="text-slate-400 mt-1">Create your patient account</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-xl font-bold text-white mb-1 text-center">Create Account</h2>
          <p className="text-slate-400 text-sm mb-8 text-center">Register to access your lab reports</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div>
              <div
                className={`flex items-center border-2 rounded-xl bg-white/10 transition-all overflow-hidden ${
                  errors.full_name ? 'border-red-400' : 'border-white/20 focus-within:border-teal-400'
                }`}
              >
                <div className="flex items-center gap-2 px-4 py-3 border-r border-white/20">
                  <User size={16} className="text-teal-400" />
                </div>
                <input
                  {...register('full_name')}
                  type="text"
                  placeholder="Your full name"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </div>
              {errors.full_name && <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <div
                className={`flex items-center border-2 rounded-xl bg-white/10 transition-all overflow-hidden ${
                  errors.phone ? 'border-red-400' : 'border-white/20 focus-within:border-teal-400'
                }`}
              >
                <div className="flex items-center gap-2 px-4 py-3 border-r border-white/20">
                  <Phone size={16} className="text-teal-400" />
                </div>
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+919876543210"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone.message}</p>}
            </div>

            {/* Date of Birth */}
            <div>
              <div className="flex items-center border-2 rounded-xl bg-white/10 border-white/20 focus-within:border-teal-400 transition-all overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-r border-white/20">
                  <Calendar size={16} className="text-teal-400" />
                </div>
                <input
                  {...register('date_of_birth')}
                  type="date"
                  className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <select
                {...register('gender')}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-teal-400 text-sm"
              >
                <option value="">Select gender (optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white gradient-teal hover:opacity-90 transition-all disabled:opacity-60 shadow-lg shadow-teal-700/30 mt-2"
            >
              {isSubmitting
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : null
              }
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

        </motion.div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Already have an account? <a href="/login" className="text-teal-400 hover:text-teal-300 font-medium">Sign in</a>
        </p>

        <p className="text-center text-xs text-slate-500 mt-2">
          LabIntel · Secure Health Data · 2025
        </p>
      </div>
    </div>
  );
}
