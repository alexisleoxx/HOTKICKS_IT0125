import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Check, Globe, Hash, LayoutDashboard, LogOut, Mail, MapPin, Package, Phone, Truck, User, UserRound, Users, Wallet } from 'lucide-react';
import PageTransition from '../components/PageTransition.jsx';
import ShoeImage from '../components/ShoeImage.jsx';
import StatusBadge, { STATUSES } from '../components/StatusBadge.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useAuthData } from '../hooks/useAuthData.js';
import { peso } from '../../shared/pricing.js';

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const money = (n) => peso(n, { cents: true });

function OrderTracker({ status }) {
  if (status === 'cancelled') return <p className="tracker__cancelled">This order was cancelled.</p>;
  const steps = STATUSES.slice(0, 4);
  const at = steps.indexOf(status);
  return (
    <ol className="tracker">
      {steps.map((s, i) => <li key={s} className={i <= at ? 'is-done' : ''}><span />{s}</li>)}
    </ol>
  );
}

function Orders({ orders, loading, error }) {
  if (loading && !orders) return <div className="spinner" />;
  if (error) return <p className="kalert">{error.message}</p>;
  if (!orders.length) {
    return (
      <div className="acard acct__empty">
        <div className="kicon"><Package size={28} /></div>
        <h3>No orders yet</h3>
        <p>When you buy a pair, you can track it here from checkout to your doorstep.</p>
        <Link to="/shop" className="btn btn--primary">FIND YOUR NEXT PAIR</Link>
      </div>
    );
  }
  return (
    <div className="myorders">
      {orders.map((o) => (
        <article key={o.id} className="acard myorder">
          <header>
            <div>
              <strong>Order {o.id}</strong>
              <small>Placed {fmtDate(o.createdAt)} · {o.lines.reduce((s, l) => s + l.qty, 0)} item(s)</small>
            </div>
            <StatusBadge status={o.status} />
            <span className="myorder__total">{money(o.total)}</span>
          </header>
          <OrderTracker status={o.status} />
          <div className="myorder__lines">
            {o.lines.map((l, i) => (
              <div key={i} className="myorder__line">
                {l.image && <ShoeImage src={l.image} alt="" />}
                <div><strong>{l.name}</strong><small>{l.color} · US {l.size} · Qty {l.qty}</small></div>
                <span>{money(l.price * l.qty)}</span>
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="kfield">
      <span className="kfield__label">{label}</span>
      <span className="kfield__box">{Icon && <Icon size={17} className="kfield__icon" />}{children}</span>
    </label>
  );
}

function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({});
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ name: user.name, phone: user.phone, gender: user.gender || '', address: '', city: '', zip: '', country: '', ...user.address });
  }, [user]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setStatus({ type: '', msg: '' }); };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { name, phone, gender, ...address } = form;
      await updateProfile({ name, phone, gender, address });
      setStatus({ type: 'ok', msg: 'Saved. We will use these details at checkout.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setBusy(false);
    }
  };

  const input = (k, placeholder, props = {}) => <input value={form[k] || ''} onChange={set(k)} placeholder={placeholder} {...props} />;

  return (
    <form onSubmit={save} className="acct__profile">
      <section className="acard">
        <header className="acard__head"><UserRound size={18} /><div><h3>Personal info</h3><p>How we address you and reach you about orders.</p></div></header>
        <div className="acard__grid">
          <div className="span-2"><Field label="Full Name" icon={User}>{input('name', 'e.g. Maria Santos', { autoComplete: 'name' })}</Field></div>
          <div className="span-2">
            <Field label="Email Address" icon={Mail}><input value={user.email} disabled /></Field>
            <small className="acard__hint">Your sign-in email can't be changed here.</small>
          </div>
          <Field label="Contact Number" icon={Phone}>{input('phone', 'e.g. 09171234567', { type: 'tel', autoComplete: 'tel' })}</Field>
          <Field label="Gender" icon={Users}>
            <select value={form.gender || ''} onChange={set('gender')} className={form.gender ? '' : 'is-placeholder'}>
              <option value="">Select gender</option>
              {GENDERS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
        </div>
      </section>

      <section className="acard">
        <header className="acard__head"><MapPin size={18} /><div><h3>Shipping address</h3><p>Pre-filled at checkout so you can buy in seconds.</p></div></header>
        <div className="acard__grid">
          <div className="span-2"><Field label="Home Address" icon={MapPin}>{input('address', 'e.g. 123 Rizal St, Quezon City', { autoComplete: 'street-address' })}</Field></div>
          <Field label="City" icon={MapPin}>{input('city', 'e.g. Taytay', { autoComplete: 'address-level2' })}</Field>
          <Field label="ZIP / Postal Code" icon={Hash}>{input('zip', 'e.g. 1920', { autoComplete: 'postal-code' })}</Field>
          <div className="span-2"><Field label="Country" icon={Globe}>{input('country', 'e.g. Philippines', { autoComplete: 'country-name' })}</Field></div>
        </div>
      </section>

      <div className="acct__savebar">
        {status.msg && <p className={`kalert ${status.type === 'ok' ? 'kalert--ok' : ''}`}>{status.type === 'ok' && <Check size={16} />} {status.msg}</p>}
        <button className="btn btn--primary" disabled={busy}>{busy ? 'SAVING…' : 'SAVE CHANGES'}</button>
      </div>
    </form>
  );
}

const TABS = [
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'profile', label: 'Profile & Address', icon: UserRound },
];

export default function Account() {
  const { user, ready, isAdmin, signOut } = useAuth();
  const [tab, setTab] = useState('orders');
  const ordersState = useAuthData(user ? '/api/auth/orders' : null);

  if (!ready) return <div className="page-pad"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  const orders = ordersState.data || [];
  const live = orders.filter((o) => o.status !== 'cancelled');
  const stats = [
    { label: 'Orders', value: orders.length, icon: Package },
    { label: 'Total spent', value: money(live.reduce((s, o) => s + o.total, 0)), icon: Wallet },
    { label: 'On the way', value: orders.filter((o) => ['processing', 'shipped'].includes(o.status)).length, icon: Truck },
  ];
  const first = (user.name || 'there').split(' ')[0];

  return (
    <PageTransition>
      <section className="acct">
        <div className="acct__hero">
          <div className="acct__glow" />
          <div className="acct__inner">
            <div className="acct__id">
              <div className="acct__avatar">{first[0]?.toUpperCase()}</div>
              <div>
                <span className="eyebrow">HOTKICKS MEMBER{isAdmin && ' · ADMIN'}</span>
                <h1>Hey, {first}.</h1>
                <p>{user.email} · Member since {fmtDate(user.createdAt)}</p>
              </div>
              <div className="acct__actions">
                {isAdmin && <Link className="btn btn--sm btn--light" to="/admin"><LayoutDashboard size={16} /> Admin panel</Link>}
                <button className="btn btn--sm btn--ghost" onClick={signOut}><LogOut size={16} /> Sign out</button>
              </div>
            </div>
            <div className="acct__stats">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="acct__stat">
                  <Icon size={18} />
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="acct__body">
          <div className="acct__tabs" role="tablist">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>
          {tab === 'orders' ? <Orders {...ordersState} orders={ordersState.data} /> : <ProfileForm />}
        </div>
      </section>
    </PageTransition>
  );
}
