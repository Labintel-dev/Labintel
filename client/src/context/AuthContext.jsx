import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getProfile, upsertProfile, isSupabaseConfigured } from '../lib/supabase.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const buildUiUser = (authUser, profile = null) => {
    const email = authUser?.email || '';
    const derivedName =
      profile?.full_name ||
      profile?.name ||
      authUser?.user_metadata?.full_name ||
      authUser?.user_metadata?.name ||
      (email ? email.split('@')[0] : 'User');
    const role = profile?.role || authUser?.user_metadata?.role || 'patient';
    const mappedPatientId = email.toLowerCase() === 'rahul@email.com'
      ? 'P001'
      : email.toLowerCase() === 'divya@email.com'
        ? 'P002'
        : authUser?.id;

    return {
      id: role === 'patient' ? mappedPatientId : authUser?.id,
      authId: authUser?.id,
      name: derivedName,
      email,
      role,
      avatar: String(derivedName || 'U').charAt(0).toUpperCase(),
      avatar_url: profile?.avatar_url || '',
      phone: profile?.phone || '',
      dob: profile?.dob || '',
    };
  };

  const hydrateUserFromSession = async (activeSession) => {
    if (!activeSession?.user) {
      setUser(null);
      localStorage.removeItem('labintel_user');
      return;
    }

    let profile = null;
    try {
      profile = await getProfile(activeSession.user.id);
      if (!profile) {
        profile = await upsertProfile(activeSession.user.id, {
          role: activeSession.user.user_metadata?.role || 'patient',
          full_name: activeSession.user.user_metadata?.full_name || '',
          phone: activeSession.user.user_metadata?.phone || '',
          dob: activeSession.user.user_metadata?.dob || '',
        });
      }
    } catch {
      profile = null;
    }

    const uiUser = buildUiUser(activeSession.user, profile);
    setUser(uiUser);
    localStorage.setItem('labintel_user', JSON.stringify(uiUser));
  };

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      const loadLocalSession = () => {
        const stored = localStorage.getItem('labintel_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser(parsed);
            setSession({ user: parsed });
          } catch (e) {
            setUser(null);
            setSession(null);
          }
        } else {
          setUser(null);
          setSession(null);
        }
      };

      loadLocalSession();
      setLoading(false);
      window.addEventListener('labintel_local_auth_change', loadLocalSession);

      return () => {
        mounted = false;
        window.removeEventListener('labintel_local_auth_change', loadLocalSession);
      };
    }

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);
      await hydrateUserFromSession(initialSession);
      if (mounted) {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      if (event === 'SIGNED_OUT' || !nextSession) {
        setUser(null);
        localStorage.removeItem('labintel_user');
        setLoading(false);
        return;
      }
      setLoading(true);
      setTimeout(() => {
        hydrateUserFromSession(nextSession).finally(() => {
          if (mounted) {
            setLoading(false);
          }
        });
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('labintel_user');
  };

  const value = {
    session,
    user,
    loading,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
