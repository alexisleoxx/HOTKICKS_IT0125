import { useEffect, useRef } from 'react';

// Calls `tick` every `delay` ms unless paused; resets whenever `resetKey` changes.
export function useAutoplay(tick, delay, paused, resetKey) {
  const saved = useRef(tick);
  saved.current = tick;
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => saved.current(), delay);
    return () => clearInterval(t);
  }, [delay, paused, resetKey]);
}
