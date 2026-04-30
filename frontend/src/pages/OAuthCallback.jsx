import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/reportService';
import { FlaskConical } from 'lucide-react';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function processCallback() {
      const hash = window.location.hash;
      if (!hash) {
        navigate('/');
        return;
      }

      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      const errorStr = params.get('error_description') || params.get('error');

      if (errorStr) {
        setError(errorStr.replace(/\+/g, ' '));
        setTimeout(() => navigate('/'), 3000);
        return;
      }

      if (!accessToken) {
        navigate('/');
        return;
      }

      try {
        const { token, patient } = await authService.verifyGoogle(accessToken);
        setAuth(token, { ...patient, role: 'patient' }, null);
        // Redirect to patient portal
        navigate('/patient');
      } catch (err) {
        setError(err?.response?.data?.error || 'Authentication failed. Please try again.');
        setTimeout(() => navigate('/'), 3000);
      }
    }

    processCallback();
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-xl shadow-teal-500/30 mb-6">
          <FlaskConical size={30} className="text-white" />
        </div>

        {error ? (
          <>
            <h2 className="text-xl font-bold text-red-600 mb-2">Authentication Error</h2>
            <p className="text-slate-500 text-sm">{error}</p>
            <p className="text-slate-400 text-xs mt-2">Redirecting back...</p>
          </>
        ) : (
          <>
            <div className="w-10 h-10 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Signing you in...</h2>
            <p className="text-slate-500 text-sm mt-1">Connecting your Google account</p>
          </>
        )}
      </div>
    </div>
  );
}
