import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { patientService } from '../../services/patientService';
import { PatientLayout } from '../../components/patient/PatientLayout';
import { Card, Button, Input } from '../../components/common';
import { Phone, CheckCircle, ShieldAlert } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const phoneSchema = z.object({
  phone: z.string().regex(/^\+91[6-9]\d{9}$/, 'Format: +91XXXXXXXXXX'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export default function LinkPhone() {
  const navigate = useNavigate();
  const setAuth = usePatientAuthStore((s) => s.setAuth);
  const { user } = usePatientAuthStore((s) => s);
  const { addToast } = useUIStore();
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [phoneToVerify, setPhoneToVerify] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneForm = useForm({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });

  // If they already have a phone, redirect away
  if (user?.phone) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSendOtp = async (data) => {
    try {
      setIsSubmitting(true);
      await patientService.portal.sendLinkPhoneOtp(data.phone);
      setPhoneToVerify(data.phone);
      setStep(2);
      addToast('OTP sent to your phone', 'success');
    } catch (err) {
      addToast(err?.response?.data?.error || 'Failed to send OTP', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (data) => {
    try {
      setIsSubmitting(true);
      const res = await patientService.portal.verifyLinkPhoneOtp(phoneToVerify, data.otp);
      
      // Update the auth store with the new JWT and user object
      setAuth(res.token, res.patient, null, null);
      
      addToast(res.message || 'Phone linked successfully!', 'success');
      navigate('/dashboard');
    } catch (err) {
      addToast(err?.response?.data?.error || 'Failed to verify OTP', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PatientLayout>
      <div className="max-w-md mx-auto pt-10">
        <Card className="p-8 border-t-4 border-t-teal-500 shadow-xl">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="text-teal-600 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Link Your Phone Number</h1>
            <p className="text-sm text-slate-500">
              To access your lab reports, we need to securely link your phone number to your Google account.
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-6">
              <Input
                label="Phone Number"
                placeholder="+919876543210"
                icon={<Phone size={16} />}
                {...phoneForm.register('phone')}
                error={phoneForm.formState.errors.phone?.message}
              />
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Send Verification Code
              </Button>
              <button 
                type="button" 
                onClick={() => navigate('/dashboard')}
                className="w-full text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                Skip for now
              </button>
            </form>
          ) : (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                <p className="text-sm text-slate-600 text-center">
                  Enter the 6-digit code sent to<br />
                  <span className="font-semibold text-slate-800">{phoneToVerify}</span>
                </p>
              </div>
              <Input
                label="Verification Code"
                placeholder="123456"
                type="text"
                maxLength={6}
                icon={<CheckCircle size={16} />}
                {...otpForm.register('otp')}
                error={otpForm.formState.errors.otp?.message}
              />
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Verify & Link
              </Button>
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="w-full text-sm text-teal-600 hover:text-teal-700 transition-colors font-medium"
              >
                Change phone number
              </button>
            </form>
          )}
        </Card>
      </div>
    </PatientLayout>
  );
}
