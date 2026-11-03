import { useEffect, useState } from 'react';

// url -> { data, at }. Cached data is shown instantly, then refreshed in the background
// once it's older than MAX_AGE, so admin changes (deletes, stock) reach shoppers quickly.
const cache = new Map();
const MAX_AGE = 30_000;
const listeners = new Set();

// Call after admin changes or a failed checkout so every product list refetches now
export const clearProductCache = () => {
  cache.clear();
  listeners.forEach((fn) => fn());
};

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  const data = await res.json();
  cache.set(url, { data, at: Date.now() });
  return data;
}

function useFetch(url) {
  const cached = url ? cache.get(url) : null;
  const [state, setState] = useState({ data: cached?.data ?? null, loading: !cached, error: null });
  const [version, setVersion] = useState(0);

  // Refetch when the cache is cleared or the shopper comes back to the tab
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1);
    const onVisible = () => document.visibilityState === 'visible' && bump();
    listeners.add(bump);
    document.addEventListener('visibilitychange', onVisible);
    return () => { listeners.delete(bump); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    const hit = cache.get(url);
    if (hit) setState({ data: hit.data, loading: false, error: null });
    else setState((s) => ({ ...s, loading: true, error: null }));
    if (hit && Date.now() - hit.at < MAX_AGE) return;
    fetchJSON(url)
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState((s) => ({ data: s.data, loading: false, error: s.data ? null : error })));
    return () => { alive = false; };
  }, [url, version]);

  return state;
}

export function useProducts({ category = 'All', q = '' } = {}) {
  const params = new URLSearchParams();
  if (category !== 'All') params.set('category', category);
  if (q) params.set('q', q);
  const { data, loading, error } = useFetch(`/api/products?${params}`);
  return { products: data || [], loading, error };
}

export function useProduct(id) {
  const { data, loading, error } = useFetch(id ? `/api/products/${id}` : null);
  return { product: data, loading, error };
}
