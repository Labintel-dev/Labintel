import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/reportService';
import { useUIStore } from '../../store/uiStore';
import { Skeleton } from '../../components/common';
import { PatientLayout } from '../../components/patient/PatientLayout';

export default function GoogleCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    async function processHash() {
      // Supabase OAuth implicit flow redirects with token in hash fragment
      const hash = window.location.hash;
      if (!hash) {
        navigate('/login');
        return;
      }
      
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const errorStr = params.get('error_description') || params.get('error');

      if (errorStr) {
        addToast(errorStr.replace(/\+/g, ' '), 'error');
        navigate('/login');
        return;
      }

      if (!accessToken) {
        navigate('/login');
        return;
      }

      try {
        // Exchange Supabase token for LabIntel custom JWT
        const { token, patient } = await authService.verifyGoogle(accessToken);
        setAuth(token, patient, null, null); // user=patient, lab=null, slug=null
        
        if (!patient.phone) {
          addToast('Please link your phone number to view your lab reports.', 'warning');
          navigate('/link-phone');
        } else {
          addToast(`Welcome back, ${patient.full_name || 'Patient'}!`, 'success');
          navigate('/dashboard');
        }
      } catch (err) {
        addToast(err?.response?.data?.error || 'Authentication failed. Please try again.', 'error');
        navigate('/login');
      }
    }

    processHash();
  }, [navigate, setAuth, addToast]);

  return (
    <PatientLayout>
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 border-4 border-slate-100 border-t-teal-500 rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-semibold text-slate-800">Authenticating with Google...</h2>
        <p className="text-slate-500 mt-2 text-center max-w-sm">Please wait while we securely connect your account to the patient portal.</p>
        
        <div className="w-full max-w-md space-y-4 mt-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </PatientLayout>
  );
}
