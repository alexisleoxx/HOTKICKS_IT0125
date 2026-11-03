import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

export default function AdminLogin() {
  const { isAdmin, user, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (isAdmin) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(form.email, form.password, { adminOnly: true });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="alogin">
      <motion.form className="alogin__card" onSubmit={submit} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="alogin__badge"><ShieldCheck size={22} /></div>
        <span className="logo">HOT<span>KICKS</span></span>
        <h1>Admin Console</h1>
        <p>Sign in with an admin account to manage inventory, orders and customers.</p>

        {user && !isAdmin && (
          <p className="error-box error-box--inline">
            You're signed in as {user.email}, which isn't an admin.{' '}
            <button type="button" className="link" onClick={signOut}>Sign out</button>
          </p>
        )}

        <label className="afield">
          <span>Email</span>
          <input type="email" required autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="afield">
          <span>Password</span>
          <input type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {error && <p className="error-box error-box--inline">{error}</p>}
        <button className="btn btn--primary btn--block" disabled={busy}>{busy ? 'SIGNING IN…' : 'SIGN IN TO ADMIN'}</button>
        <Link to="/" className="alogin__back">← Back to store</Link>
      </motion.form>
    </div>
  );
}
