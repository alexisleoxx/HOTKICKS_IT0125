import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth.js';
import { readJSON } from '../context/AuthContext.jsx';

// Loads a signed-in API resource (e.g. /api/admin/orders) and exposes reload()
export function useAuthData(url) {
  const { authFetch } = useAuth();
  const [state, setState] = useState({ data: null, loading: true, error: null });

  const load = useCallback(async () => {
    if (!url) { setState({ data: null, loading: false, error: null }); return; }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await authFetch(url).then(readJSON);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, [url, authFetch]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load, setData: (fn) => setState((s) => ({ ...s, data: typeof fn === 'function' ? fn(s.data) : fn })) };
}

// Sends a JSON request with the user's token; returns parsed JSON or throws
export function useApi() {
  const { authFetch } = useAuth();
  return useCallback((url, method = 'GET', body) =>
    authFetch(url, { method, body: body === undefined ? undefined : JSON.stringify(body) }).then(readJSON), [authFetch]);
}
