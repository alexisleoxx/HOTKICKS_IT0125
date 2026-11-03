import { Fragment, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, X, RotateCcw } from 'lucide-react';
import { useChat } from '../hooks/useChat.js';

const SUGGESTIONS = ['Best shoe for running?', "What's limited right now?", 'How do sizes fit?', 'Shipping & returns'];

// Renders [text](/path) markdown links as router links and keeps everything else as plain text
function MessageText({ text, onNavigate }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m && m[2].startsWith('/')) return <Link key={i} to={m[2]} onClick={onNavigate}>{m[1]}</Link>;
    return <Fragment key={i}>{part.replace(/\*\*/g, '')}</Fragment>;
  });
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, error, send, reset } = useChat();
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  const submit = (e) => {
    e.preventDefault();
    send(input);
    setInput('');
  };

  return (
    <>
      <motion.button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Close chat' : 'Chat with HOTKICKS'} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={open ? 'x' : 'chat'} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            {open ? <X size={24} /> : <MessageCircle size={24} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="chat"
            role="dialog"
            aria-label="HOTKICKS assistant"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <header className="chat__head">
              <div>
                <strong>HOT<span>KICKS</span> Assistant</strong>
                <small><i /> Online</small>
              </div>
              <button onClick={reset} aria-label="Restart chat" title="Restart chat"><RotateCcw size={16} /></button>
            </header>

            <div className="chat__list" ref={listRef}>
              {messages.map((m, i) => (
                <motion.div key={i} className={`bubble bubble--${m.role}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <MessageText text={m.content} onNavigate={() => setOpen(false)} />
                </motion.div>
              ))}
              {loading && <div className="bubble bubble--assistant bubble--typing"><span /><span /><span /></div>}
              {error && <div className="chat__error">{error}</div>}
              {messages.length === 1 && !loading && (
                <div className="chat__suggest">
                  {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
                </div>
              )}
            </div>

            <form className="chat__form" onSubmit={submit}>
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about sneakers, sizing, shipping…" aria-label="Message" maxLength={500} />
              <button type="submit" disabled={!input.trim() || loading} aria-label="Send"><Send size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
