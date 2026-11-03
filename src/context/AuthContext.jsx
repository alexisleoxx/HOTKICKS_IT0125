import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

export const AuthContext = createContext(null);

// Parses a JSON response and throws its error message on failure
export async function readJSON(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data.code;
    throw err;
  }
  return data;
}

const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export function AuthProvider({ children }) {
  const [session, setSession] = useLocalStorage('hk-session', null);
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const refreshing = useRef(null);

  const signOut = useCallback(() => {
    sessionRef.current = null;
    setSession(null);
    setProfile(null);
  }, [setSession]);

  // Shares one refresh request between parallel callers
  const refresh = useCallback(() => {
    if (!refreshing.current) {
      const token = sessionRef.current?.refresh_token;
      refreshing.current = (token ? post('/api/auth/refresh', { refresh_token: token }).then(readJSON) : Promise.reject())
        .then(({ session: s }) => { sessionRef.current = s; setSession(s); return s; })
        .catch(() => { signOut(); return null; })
        .finally(() => { refreshing.current = null; });
    }
    return refreshing.current;
  }, [setSession, signOut]);

  // fetch() that attaches the access token and refreshes it when it expires
  const authFetch = useCallback(async (url, options = {}) => {
    let s = sessionRef.current;
    if (s?.expires_at && s.expires_at * 1000 < Date.now() + 30_000) s = await refresh();
    const send = (token) => fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    let res = await send(s?.access_token);
    if (res.status === 401 && s) {
      s = await refresh();
      if (s) res = await send(s.access_token);
    }
    return res;
  }, [refresh]);

  // Load the profile whenever the signed-in user changes
  const token = session?.access_token;
  useEffect(() => {
    if (!token) { setProfile(null); setReady(true); return; }
    let alive = true;
    authFetch('/api/auth/me')
      .then(async (res) => {
        if (!alive) return;
        if (res.status === 401) return signOut();
        if (res.ok) setProfile((await res.json()).profile);
      })
      .catch(() => {})
      .finally(() => alive && setReady(true));
    return () => { alive = false; };
  }, [token, authFetch, signOut]);

  const finish = ({ session: s, profile: p }) => {
    sessionRef.current = s;
    setSession(s);
    setProfile(p);
    return p;
  };

  const signIn = useCallback(async (email, password, { adminOnly = false } = {}) => {
    const data = await post('/api/auth/login', { email, password }).then(readJSON);
    if (adminOnly && data.profile.role !== 'admin') throw new Error('This account does not have admin access.');
    return finish(data);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Returns { needsConfirmation, email } when Supabase sends a confirmation email,
  // otherwise signs the new customer in and returns { profile }
  const signUp = useCallback(async (details) => {
    const data = await post('/api/auth/signup', details).then(readJSON);
    if (data.needsConfirmation) return data;
    return { profile: finish(data) };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resendConfirmation = useCallback((email) => post('/api/auth/resend', { email }).then(readJSON), []);
  const requestPasswordReset = useCallback((email) => post('/api/auth/forgot', { email }).then(readJSON), []);

  // Sets a new password using the recovery token from the reset email, then signs in
  const resetPassword = useCallback(async (accessToken, password) => {
    const data = await post('/api/auth/reset-password', { access_token: accessToken, password }).then(readJSON);
    return finish(data);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Signs in with tokens from an email confirmation link
  const adoptSession = useCallback((s) => {
    sessionRef.current = s;
    setSession(s);
  }, [setSession]);

  const updateProfile = useCallback(async (patch) => {
    const data = await authFetch('/api/auth/me', { method: 'PATCH', body: JSON.stringify(patch) }).then(readJSON);
    setProfile(data.profile);
    return data.profile;
  }, [authFetch]);

  const value = {
    user: profile, isAdmin: profile?.role === 'admin', ready: ready || !token,
    signIn, signUp, signOut, updateProfile, authFetch,
    resendConfirmation, requestPasswordReset, resetPassword, adoptSession,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
