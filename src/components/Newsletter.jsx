import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: 'idle', msg: '' });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ type: 'loading', msg: '' });
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus({ type: 'ok', msg: data.already ? "You're already on the list." : "You're in. Watch your inbox for the next drop." });
      setEmail('');
    } catch (err) {
      setStatus({ type: 'error', msg: err.message || 'Something went wrong' });
    }
  };

  return (
    <section className="newsletter">
      <motion.div className="newsletter__inner" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
        <span className="eyebrow">THE HOTKICKS LIST</span>
        <h2>Never miss a drop.</h2>
        <p>Early access to limited releases, member-only pricing and first word on restocks.</p>
        <form className={`nl-form ${status.type}`} onSubmit={submit}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" aria-label="Email address" />
          <button type="submit" disabled={status.type === 'loading'} aria-label="Subscribe">
            {status.type === 'ok' ? <Check size={20} /> : <ArrowRight size={20} />}
          </button>
        </form>
        {status.msg && <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`nl-msg nl-msg--${status.type}`}>{status.msg}</motion.p>}
      </motion.div>
    </section>
  );
}
