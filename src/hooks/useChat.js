import { useCallback, useState } from 'react';

const GREETING = { role: 'assistant', content: "Yo! I'm the HOTKICKS assistant. Looking for a running shoe, a court shoe, or something limited? Ask me anything." };

export function useChat() {
  const [messages, setMessages] = useState([GREETING]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const send = useCallback(async (text) => {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err.message || 'Chat is unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  const reset = useCallback(() => { setMessages([GREETING]); setError(''); }, []);

  return { messages, loading, error, send, reset };
}
