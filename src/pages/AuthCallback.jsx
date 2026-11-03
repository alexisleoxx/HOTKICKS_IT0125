import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, Lock } from 'lucide-react';
import PageTransition from '../components/PageTransition.jsx';
import { useAuth } from '../hooks/useAuth.js';

// Supabase email links land here with tokens in the URL hash:
//   #access_token=…&refresh_token=…&expires_at=…&type=signup|recovery
//   #error=…&error_description=…
function readHash() {
  const p = new URLSearchParams(window.location.hash.slice(1));
  return {
    type: p.get('type'),
    error: p.get('error_description') || p.get('error'),
    session: p.get('access_token') && {
      access_token: p.get('access_token'),
      refresh_token: p.get('refresh_token'),
      expires_at: Number(p.get('expires_at')) || Math.floor(Date.now() / 1000) + Number(p.get('expires_in') || 3600),
    },
  };
}

function NewPasswordForm({ token }) {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 8) return setError('Password must be at least 8 characters.');
    if (pw !== confirm) return setError("Passwords don't match.");
    setBusy(true); setError('');
    try {
      await resetPassword(token, pw);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form className="kform" onSubmit={submit}>
      <div className="kicon"><KeyRound size={28} /></div>
      <div className="kform__head">
        <h1>Set a new password.</h1>
        <p>Choose a password you haven't used before. At least 8 characters.</p>
      </div>
      {[['New Password', pw, setPw, 'Min. 8 characters'], ['Confirm Password', confirm, setConfirm, 'Repeat password']].map(([label, v, setV, ph]) => (
        <label key={label} className="kfield">
          <span className="kfield__label">{label}</span>
          <span className="kfield__box">
            <Lock size={17} className="kfield__icon" />
            <input type={show ? 'text' : 'password'} autoComplete="new-password" placeholder={ph} value={v} onChange={(e) => setV(e.target.value)} />
            <button type="button" className="kfield__show" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
          </span>
        </label>
      ))}
      {error && <p className="kalert">{error}</p>}
      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>{busy ? 'SAVING…' : <>SAVE NEW PASSWORD <ArrowRight size={18} /></>}</button>
    </form>
  );
}

export default function AuthCallback() {
  const { adoptSession, user } = useAuth();
  const navigate = useNavigate();
  const link = useMemo(readHash, []);
  const isRecovery = link.type === 'recovery';

  useEffect(() => {
    // Remove tokens from the address bar so they aren't saved in history or shared by accident
    window.history.replaceState(null, '', window.location.pathname);
    if (link.session && !isRecovery) adoptSession(link.session);
  }, [link, isRecovery, adoptSession]);

  // After confirming, head to the account page once the profile has loaded
  useEffect(() => {
    if (!isRecovery && user) {
      const t = setTimeout(() => navigate('/', { replace: true }), 2500);
      return () => clearTimeout(t);
    }
  }, [user, isRecovery, navigate]);

  let content;
  if (link.error || !link.session) {
    content = (
      <div className="kform kform--center">
        <div className="kicon kicon--error"><AlertCircle size={30} /></div>
        <div className="kform__head">
          <h1>Link expired.</h1>
          <p>{link.error ? `${link.error.replace(/\.?$/, '.')}` : 'This link is invalid or was already used.'} Sign in to request a new one.</p>
        </div>
        <Link to="/login" className="btn btn--dark btn--block">BACK TO SIGN IN</Link>
      </div>
    );
  } else if (isRecovery) {
    content = <NewPasswordForm token={link.session.access_token} />;
  } else {
    content = (
      <div className="kform kform--center">
        <motion.div className="kicon kicon--ok" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }}>
          <CheckCircle2 size={32} />
        </motion.div>
        <div className="kform__head">
          <h1>Email confirmed.</h1>
          <p>{user ? `Welcome to HOTKICKS, ${(user.name || '').split(' ')[0] || 'friend'}! Taking you to the store…` : 'Signing you in…'}</p>
        </div>
        <Link to="/account" className="btn btn--primary btn--block">GO TO MY ACCOUNT <ArrowRight size={18} /></Link>
        <Link to="/shop" className="kform__admin">or start shopping →</Link>
      </div>
    );
  }

  return (
    <PageTransition>
      <section className="auth auth--single">
        <div className="auth__panel"><div className="kcard">{content}</div></div>
      </section>
    </PageTransition>
  );
}
