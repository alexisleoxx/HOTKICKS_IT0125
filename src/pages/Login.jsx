import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Lock, Mail, MailCheck, MapPin, Phone, User, Users } from 'lucide-react';
import PageTransition from '../components/PageTransition.jsx';
import ShoeImage from '../components/ShoeImage.jsx';
import { useAuth } from '../hooks/useAuth.js';

const SIDE_IMG = 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80';
const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;

// ---------- Small building blocks ----------

function Field({ label, icon: Icon, error, children, action }) {
  return (
    <label className={`kfield ${error ? 'has-error' : ''}`}>
      <span className="kfield__label">{label}</span>
      <span className="kfield__box">
        {Icon && <Icon size={17} className="kfield__icon" />}
        {children}
        {action}
      </span>
      {error && <em className="kfield__error">{error}</em>}
    </label>
  );
}

function PasswordInput({ value, onChange, placeholder, autoComplete, name }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input name={name} type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} />
      <button type="button" className="kfield__show" onClick={() => setShow((s) => !s)}>{show ? 'Hide' : 'Show'}</button>
    </>
  );
}

// 0 to 4 based on length and character variety
function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH_LABEL = ['Too short', 'Weak', 'Okay', 'Strong', 'Very strong'];

function StrengthMeter({ password }) {
  if (!password) return null;
  const s = password.length < 8 ? 0 : Math.max(1, strength(password));
  return (
    <div className={`meter meter--${s}`}>
      <div className="meter__bars">{[1, 2, 3, 4].map((i) => <span key={i} className={i <= s ? 'on' : ''} />)}</div>
      <small>{STRENGTH_LABEL[s]}</small>
    </div>
  );
}

const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.25 } };

// ---------- Sign in ----------

function SignInForm({ onDone, go, notice }) {
  const { signIn, resendConfirmation } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null); setResent(false);
    try {
      const profile = await signIn(form.email, form.password);
      onDone(profile);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try { await resendConfirmation(form.email); setResent(true); } catch (err) { setError(err); }
  };

  return (
    <motion.form key="signin" className="kform" onSubmit={submit} {...fade}>
      <div className="kform__head">
        <h1>Welcome back.</h1>
        <p>Sign in to track orders and check out faster.</p>
      </div>
      {notice && <p className="kalert kalert--info"><Lock size={16} /> {notice}</p>}

      <Field label="Email Address" icon={Mail}>
        <input type="email" required autoComplete="email" placeholder="you@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </Field>
      <Field label="Password" icon={Lock} action={null}>
        <PasswordInput autoComplete="current-password" placeholder="Your password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      </Field>
      <button type="button" className="kform__forgot" onClick={() => go('forgot', form.email)}>Forgot password?</button>

      {error && (
        <div className="kalert">
          {error.message}
          {error.code === 'EMAIL_NOT_CONFIRMED' && (resent
            ? <span className="kalert__ok"> New link sent.</span>
            : <button type="button" onClick={resend}>Resend confirmation email</button>)}
        </div>
      )}

      <button className="btn btn--primary btn--block btn--lg" disabled={busy}>{busy ? 'SIGNING IN…' : <>SIGN IN <ArrowRight size={18} /></>}</button>
      <p className="kform__switch">New to HOTKICKS? <button type="button" onClick={() => go('signup')}>Create an account</button></p>
      <Link to="/admin/login" className="kform__admin">Staff? Admin sign in →</Link>
    </motion.form>
  );
}

// ---------- Create account ----------

function SignUpForm({ onDone, go, onConfirm }) {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', gender: '', address: '', password: '', confirm: '', newsletter: null });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!EMAIL_RE.test(form.email)) e.email = 'Enter a valid email';
    if (!PHONE_RE.test(form.phone.trim())) e.phone = 'Enter a valid number';
    if (!form.gender) e.gender = 'Select one';
    if (!form.address.trim()) e.address = 'Required';
    if (form.password.length < 8) e.password = 'At least 8 characters';
    if (form.confirm !== form.password || !form.confirm) e.confirm = "Passwords don't match";
    if (form.newsletter === null) e.newsletter = 'Choose Yes or No';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true); setServerError('');
    try {
      const { confirm, ...details } = form;
      const result = await signUp(details);
      if (result.needsConfirmation) onConfirm(result.email);
      else onDone();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.form key="signup" className="kform" onSubmit={submit} noValidate {...fade}>
      <div className="kform__head">
        <h1>Create Account</h1>
        <p>Join HOTKICKS as a member.</p>
      </div>

      <Field label="Full Name" icon={User} error={errors.name}>
        <input autoComplete="name" placeholder="e.g. Maria Santos" value={form.name} onChange={set('name')} />
      </Field>
      <Field label="Email Address" icon={Mail} error={errors.email}>
        <input type="email" autoComplete="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
      </Field>

      <div className="kform__row">
        <Field label="Contact Number" icon={Phone} error={errors.phone}>
          <input type="tel" autoComplete="tel" placeholder="e.g. 09171234567" value={form.phone} onChange={set('phone')} />
        </Field>
        <Field label="Gender" icon={Users} error={errors.gender}>
          <select value={form.gender} onChange={set('gender')} className={form.gender ? '' : 'is-placeholder'}>
            <option value="" disabled>Select gender</option>
            {GENDERS.map((g) => <option key={g}>{g}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Home Address" icon={MapPin} error={errors.address}>
        <input autoComplete="street-address" placeholder="e.g. 123 Rizal St, Quezon City" value={form.address} onChange={set('address')} />
      </Field>

      <div className="kform__row">
        <div>
          <Field label="Password" icon={Lock} error={errors.password}>
            <PasswordInput autoComplete="new-password" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} />
          </Field>
          <StrengthMeter password={form.password} />
        </div>
        <Field label="Confirm Password" icon={Lock} error={errors.confirm}>
          <PasswordInput autoComplete="new-password" placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
        </Field>
      </div>

      <fieldset className={`kchoice ${errors.newsletter ? 'has-error' : ''}`}>
        <legend>Do you want to receive updates by email?</legend>
        <small>Drops, restocks and member-only offers. No spam.</small>
        <div className="kchoice__opts">
          {[[true, 'Yes'], [false, 'No']].map(([v, label]) => (
            <button type="button" key={label} className={form.newsletter === v ? 'is-active' : ''} aria-pressed={form.newsletter === v}
              onClick={() => { setForm((f) => ({ ...f, newsletter: v })); setErrors((er) => ({ ...er, newsletter: undefined })); }}>
              <span>{label}</span>
            </button>
          ))}
        </div>
        {errors.newsletter && <em className="kfield__error">{errors.newsletter}</em>}
      </fieldset>

      {serverError && <p className="kalert">{serverError}</p>}

      <div className="kform__actions">
        <button type="button" className="kform__back" onClick={() => (window.history.length > 1 ? navigate(-1) : go('signin'))}>
          <ArrowLeft size={18} /> Back
        </button>
        <button className="btn btn--primary btn--lg kform__continue" disabled={busy}>
          {busy ? 'CREATING…' : <>Continue <ArrowRight size={18} /></>}
        </button>
      </div>
      <p className="kform__switch">Already have an account? <button type="button" onClick={() => go('signin')}>Sign In</button></p>
    </motion.form>
  );
}

// ---------- Forgot password ----------

function ForgotForm({ go, initialEmail }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(initialEmail || '');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await requestPasswordReset(email); setSent(true); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  if (sent) {
    return (
      <motion.div key="forgot-sent" className="kform kform--center" {...fade}>
        <div className="kicon"><MailCheck size={30} /></div>
        <div className="kform__head">
          <h1>Check your email.</h1>
          <p>If an account exists for <strong>{email}</strong>, we sent a link to reset your password. It expires in 1 hour.</p>
        </div>
        <button className="btn btn--dark btn--block" onClick={() => go('signin')}>BACK TO SIGN IN</button>
        <p className="kform__switch">Didn't get it? Check spam, or <button type="button" onClick={() => setSent(false)}>try again</button></p>
      </motion.div>
    );
  }

  return (
    <motion.form key="forgot" className="kform" onSubmit={submit} {...fade}>
      <div className="kform__head">
        <h1>Reset password.</h1>
        <p>Enter your email and we'll send you a link to set a new password.</p>
      </div>
      <Field label="Email Address" icon={Mail}>
        <input type="email" required autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      {error && <p className="kalert">{error}</p>}
      <div className="kform__actions">
        <button type="button" className="kform__back" onClick={() => go('signin')}><ArrowLeft size={18} /> Back</button>
        <button className="btn btn--primary btn--lg kform__continue" disabled={busy}>{busy ? 'SENDING…' : <>Send reset link <ArrowRight size={18} /></>}</button>
      </div>
    </motion.form>
  );
}

// ---------- Confirmation sent ----------

function CheckEmail({ email, go }) {
  const { resendConfirmation } = useAuth();
  const [status, setStatus] = useState('');
  const resend = async () => {
    setStatus('sending');
    try { await resendConfirmation(email); setStatus('sent'); } catch (err) { setStatus(err.message); }
  };
  return (
    <motion.div key="check" className="kform kform--center" {...fade}>
      <motion.div className="kicon" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}>
        <MailCheck size={30} />
      </motion.div>
      <div className="kform__head">
        <h1>Confirm your email.</h1>
        <p>We sent a confirmation link to <strong>{email}</strong>. Click it to activate your HOTKICKS account.</p>
      </div>
      <ol className="ksteps">
        <li><span>1</span>Open the email from HOTKICKS</li>
        <li><span>2</span>Click <b>Confirm your email</b></li>
        <li><span>3</span>You'll be signed in automatically</li>
      </ol>
      <button className="btn btn--dark btn--block" onClick={() => go('signin')}>I'VE CONFIRMED, SIGN IN</button>
      <p className="kform__switch">
        Didn't get it? Check spam, or{' '}
        {status === 'sent' ? <span className="kalert__ok">a new link was sent.</span>
          : <button type="button" onClick={resend} disabled={status === 'sending'}>{status === 'sending' ? 'sending…' : 'resend the email'}</button>}
      </p>
      {status && !['sent', 'sending'].includes(status) && <p className="kalert">{status}</p>}
    </motion.div>
  );
}

// ---------- Page ----------

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from || '/';
  const [view, setView] = useState({ mode: state?.mode || 'signin', email: '' });

  if (user) return <Navigate to={!state?.from && user.role === 'admin' ? '/admin' : from} replace />;

  const go = (mode, email = '') => setView({ mode, email });
  // Admins land on the dashboard, customers on the homepage, unless they were sent here from a specific page
  const done = (profile) => navigate(!state?.from && profile?.role === 'admin' ? '/admin' : from, { replace: true });

  return (
    <PageTransition>
      <section className="auth">
        <div className="auth__visual">
          <ShoeImage src={SIDE_IMG} alt="" loading="eager" />
          <div className="auth__visual-text">
            <span className="logo logo--lg">HOT<span>KICKS</span></span>
            <p>Members get early access to drops, faster checkout and order tracking.</p>
            <ul className="auth__perks">
              <li><Check size={15} /> Early access to limited releases</li>
              <li><Check size={15} /> Track every order in one place</li>
              <li><Check size={15} /> Saved address for 1-click checkout</li>
            </ul>
          </div>
        </div>

        <div className="auth__panel">
          <div className={`kcard ${view.mode === 'signup' ? 'kcard--wide' : ''}`}>
            {['signin', 'signup'].includes(view.mode) && (
              <div className="auth__tabs" role="tablist">
                {[['signin', 'Sign in'], ['signup', 'Create account']].map(([m, label]) => (
                  <button key={m} role="tab" aria-selected={view.mode === m} className={view.mode === m ? 'is-active' : ''} onClick={() => go(m)}>
                    {view.mode === m && <motion.span layoutId="auth-tab" className="auth__tab-bg" />}
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            )}
            {/* Keyed forms animate in; no exit wait, so the card can never get stuck empty */}
            <>
              {view.mode === 'signin' && <SignInForm key="signin" go={go} onDone={done} notice={state?.notice} />}
              {view.mode === 'signup' && <SignUpForm key="signup" go={go} onDone={done} onConfirm={(email) => go('check', email)} />}
              {view.mode === 'forgot' && <ForgotForm key="forgot" go={go} initialEmail={view.email} />}
              {view.mode === 'check' && <CheckEmail key="check" email={view.email} go={go} />}
            </>
          </div>
        </div>
      </section>
    </PageTransition>
  );
}
