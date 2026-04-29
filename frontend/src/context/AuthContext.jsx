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

    return {
      id: authUser?.id,
      authId: authUser?.id,
      patientDbId: profile?.id || authUser?.id,
      name: derivedName,
      email,
      role,
      avatar: String(derivedName || 'U').charAt(0).toUpperCase(),
      avatar_url: profile?.avatar_url || '',
      phone: profile?.phone || authUser?.user_metadata?.phone || '',
      dob: profile?.date_of_birth || profile?.dob || authUser?.user_metadata?.dob || '',
    };
  };

  const hydrateUserFromSession = async (activeSession) => {
    if (!activeSession?.user) {
      setUser(null);
      localStorage.removeItem('labintel_user');
      return;
    }

    const authUser = activeSession.user;
    let profile = null;
    try {
      // Step 1: try matching by auth uid
      profile = await getProfile(authUser.id);

      // Step 2: if not found, look up patient by phone from user metadata
      if (!profile) {
        const metaPhone = authUser.user_metadata?.phone;
        if (metaPhone) {
          const digits = metaPhone.replace(/\D/g, '');
          const normPhone = digits.length === 10 ? '+91' + digits : '+' + digits;
          const { data: byPhone } = await supabase
            .from('patients')
            .select('*')
            .eq('phone', normPhone)
            .maybeSingle();
          if (byPhone) profile = byPhone;
        }
      }

      // Step 3: if still not found, create a minimal record
      if (!profile) {
        try {
          profile = await upsertProfile(authUser.id, {
            role: authUser.user_metadata?.role || 'patient',
            full_name: authUser.user_metadata?.full_name || '',
            phone: authUser.user_metadata?.phone || '',
          });
        } catch {
          profile = null;
        }
      }
    } catch {
      profile = null;
    }

    const uiUser = buildUiUser(authUser, profile);
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
