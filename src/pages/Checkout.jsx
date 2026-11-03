import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import PageTransition from '../components/PageTransition.jsx';
import ShoeImage from '../components/ShoeImage.jsx';
import { useShop } from '../hooks/useShop.js';
import { useAuth } from '../hooks/useAuth.js';
import { clearProductCache, useProducts } from '../hooks/useProducts.js';
import { peso, SHIPPING_EXPRESS } from '../../shared/pricing.js';

const FIELDS = [
  { name: 'name', label: 'Full name', auto: 'name', span: 2 },
  { name: 'email', label: 'Email', type: 'email', auto: 'email' },
  { name: 'phone', label: 'Phone', type: 'tel', auto: 'tel' },
  { name: 'address', label: 'Street address', auto: 'street-address', span: 2 },
  { name: 'city', label: 'City', auto: 'address-level2' },
  { name: 'zip', label: 'ZIP / Postal code', auto: 'postal-code' },
  { name: 'country', label: 'Country', auto: 'country-name', span: 2 },
];

export default function Checkout() {
  const { cart, totals, clearCart, removeFromCart, updateQty } = useShop();
  const navigate = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const [serverIssues, setServerIssues] = useState({}); // productId -> problem reported by the server
  const [form, setForm] = useState({ country: 'United States', shipping: 'standard', payment: 'card' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const { user, ready, authFetch } = useAuth();

  // Prefill empty fields from the signed-in customer's saved profile
  useEffect(() => {
    if (!user) return;
    const saved = { name: user.name, email: user.email, phone: user.phone, ...user.address };
    setForm((f) => {
      const next = { ...f };
      FIELDS.forEach(({ name }) => { if (!next[name] && saved[name]) next[name] = saved[name]; });
      return next;
    });
  }, [user]);

  const express = form.shipping === 'express' ? SHIPPING_EXPRESS : 0;
  const grand = totals.total + express;

  // Compare the bag with the live catalog: products can be deleted, hidden or sell out after being added
  const issueFor = (line) => {
    const fromServer = serverIssues[line.id];
    if (productsLoading) return fromServer || null;
    const p = products.find((x) => x.id === line.id);
    if (!p) return { text: 'No longer available', fix: 'remove' };
    if (p.stock === 0) return { text: 'Sold out', fix: 'remove' };
    if (p.stock != null && line.qty > p.stock) return { text: `Only ${p.stock} left`, fix: 'lower', max: p.stock };
    return fromServer || null;
  };
  const blocked = cart.some((l) => issueFor(l));

  if (!ready) return <div className="page-pad"><div className="spinner" /></div>;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/checkout', notice: 'Please sign in to check out.' }} />;
  }

  if (!cart.length) {
    return (
      <PageTransition>
        <div className="page-pad empty">
          <h3>Your bag is empty</h3>
          <Link to="/shop" className="btn btn--dark">Find your next pair</Link>
        </div>
      </PageTransition>
    );
  }

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const e = {};
    FIELDS.forEach((f) => { if (!String(form[f.name] || '').trim()) e[f.name] = 'Required'; });
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email';
    if (form.payment === 'card') {
      if (!/^\d{13,19}$/.test((form.card || '').replace(/\s/g, ''))) e.card = 'Invalid card number';
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.exp || '')) e.exp = 'MM/YY';
      if (!/^\d{3,4}$/.test(form.cvc || '')) e.cvc = 'Invalid';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setServerError('');
    try {
      const customer = Object.fromEntries(FIELDS.map((f) => [f.name, form[f.name]]));
      const res = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ customer, items: cart.map(({ id, qty, size, color }) => ({ id, qty, size, color })) }),
      });
      const order = await res.json();
      if (!res.ok) {
        if (order.code === 'UNAVAILABLE') {
          setServerIssues(Object.fromEntries(order.items.map((i) => [i.id, i.reason === 'stock'
            ? { text: `Only ${i.stock} left`, fix: 'lower', max: i.stock }
            : { text: 'No longer available', fix: 'remove' }])));
          clearProductCache();
        }
        throw new Error(order.error);
      }
      const shipping = order.shipping + express;
      const full = { ...order, shipping, total: +(order.total + express).toFixed(2), method: form.shipping, items: cart };
      clearCart();
      clearProductCache();
      navigate('/order-confirmed', { state: { order: full } });
    } catch (err) {
      setServerError(err.message || 'Could not place order');
    } finally {
      setSubmitting(false);
    }
  };

  const field = (f) => (
    <label key={f.name} className={`field ${f.span === 2 ? 'field--full' : ''} ${errors[f.name] ? 'has-error' : ''}`}>
      <input name={f.name} type={f.type || 'text'} autoComplete={f.auto} value={form[f.name] || ''} onChange={change} placeholder=" " />
      <span>{f.label}</span>
      {errors[f.name] && <em>{errors[f.name]}</em>}
    </label>
  );

  return (
    <PageTransition>
      <section className="checkout">
        <form className="checkout__form" onSubmit={submit} noValidate>
          <h1>Checkout</h1>
          <p className="muted">Signed in as <strong>{user.email}</strong>. This order will appear in your account.</p>
          <h3>1. Contact & shipping</h3>
          <div className="fields">{FIELDS.map(field)}</div>

          <h3>2. Delivery</h3>
          <div className="radios">
            {[
              ['standard', 'Standard', '3–5 business days', totals.shipping ? peso(totals.shipping) : 'Free'],
              ['express', 'Express', '1–2 business days', `+${peso(SHIPPING_EXPRESS)}`],
            ].map(([v, t, d, p]) => (
              <label key={v} className={`radio ${form.shipping === v ? 'is-active' : ''}`}>
                <input type="radio" name="shipping" value={v} checked={form.shipping === v} onChange={change} />
                <div><strong>{t}</strong><span>{d}</span></div><b>{p}</b>
              </label>
            ))}
          </div>

          <h3>3. Payment</h3>
          <div className="radios radios--row">
            {[['card', 'Credit card'], ['paypal', 'PayPal'], ['applepay', 'Apple Pay']].map(([v, t]) => (
              <label key={v} className={`radio ${form.payment === v ? 'is-active' : ''}`}>
                <input type="radio" name="payment" value={v} checked={form.payment === v} onChange={change} />
                <strong>{t}</strong>
              </label>
            ))}
          </div>
          {form.payment === 'card' ? (
            <div className="fields">
              {field({ name: 'card', label: 'Card number', auto: 'cc-number', span: 2 })}
              {field({ name: 'exp', label: 'Expiry (MM/YY)', auto: 'cc-exp' })}
              {field({ name: 'cvc', label: 'CVC', auto: 'cc-csc' })}
            </div>
          ) : (
            <p className="muted">You'll confirm payment with {form.payment === 'paypal' ? 'PayPal' : 'Apple Pay'} after placing your order.</p>
          )}
          {blocked && <p className="error-box">Some items in your bag are no longer available. Fix them in the order summary to continue.</p>}
          {!blocked && serverError && <p className="error-box">{serverError}</p>}
          <button className="btn btn--primary btn--block btn--lg" disabled={submitting || blocked}>
            <Lock size={18} /> {submitting ? 'PLACING ORDER…' : `PLACE ORDER · ${peso(grand, { cents: true })}`}
          </button>
          <p className="muted small">Demo store: no real payment is processed.</p>
        </form>

        <aside className="summary">
          <h3>Order summary</h3>
          {cart.map((l) => {
            const issue = issueFor(l);
            return (
              <div key={l.key} className={`summary__line ${issue ? 'is-unavailable' : ''}`}>
                <div className="summary__img"><ShoeImage src={l.image} alt={l.name} /><span>{l.qty}</span></div>
                <div>
                  <strong>{l.name}</strong><small>{l.color} · US {l.size}</small>
                  {issue && (
                    <span className="summary__issue">
                      {issue.text} ·{' '}
                      {issue.fix === 'lower'
                        ? <button type="button" onClick={() => { updateQty(l.key, issue.max); setServerIssues((s) => ({ ...s, [l.id]: undefined })); }}>Set to {issue.max}</button>
                        : <button type="button" onClick={() => removeFromCart(l.key)}>Remove</button>}
                    </span>
                  )}
                </div>
                <span>{peso(l.price * l.qty, { cents: true })}</span>
              </div>
            );
          })}
          <div className="sum"><span>Subtotal</span><span>{peso(totals.subtotal, { cents: true })}</span></div>
          <div className="sum"><span>Shipping</span><span>{totals.shipping + express ? peso(totals.shipping + express) : 'Free'}</span></div>
          <div className="sum"><span>Tax</span><span>{peso(totals.tax, { cents: true })}</span></div>
          <div className="sum sum--total"><span>Total</span><span>{peso(grand, { cents: true })}</span></div>
        </aside>
      </section>
    </PageTransition>
  );
}
