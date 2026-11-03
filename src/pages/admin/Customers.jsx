import { useMemo, useState } from 'react';
import { Search, ShieldCheck, ShieldOff, X } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge.jsx';
import { useAuthData, useApi } from '../../hooks/useAuthData.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useShop } from '../../hooks/useShop.js';
import { useConfirm } from '../../hooks/useConfirm.js';
import { peso } from '../../../shared/pricing.js';

const money = (n) => peso(n, { cents: true });
const date = (d) => (d ? new Date(d).toLocaleDateString() : '—');

function CustomerOrders({ customer, onClose }) {
  const { data: orders, loading, error } = useAuthData(`/api/admin/customers/${encodeURIComponent(customer.id)}/orders`);
  return (
    <div className="amodal" onClick={onClose}>
      <div className="amodal__card amodal__card--narrow" onClick={(e) => e.stopPropagation()}>
        <header>
          <div><h3>{customer.name || customer.email}</h3><small className="muted">{customer.email} {customer.phone && `· ${customer.phone}`}</small></div>
          <button onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>
        <div className="amodal__body">
          <div className="kpis kpis--sm">
            <div className="kpi"><span className="kpi__label">Orders</span><strong className="kpi__value">{customer.orders}</strong></div>
            <div className="kpi"><span className="kpi__label">Total spent</span><strong className="kpi__value">{money(customer.spent)}</strong></div>
            <div className="kpi"><span className="kpi__label">{customer.guest ? 'First order' : 'Joined'}</span><strong className="kpi__value">{date(customer.joined)}</strong></div>
          </div>
          {loading ? <div className="spinner" /> : error ? <p className="error-box error-box--inline">{error.message}</p> : !orders.length ? <p className="muted">No orders yet.</p> : (
            <table className="table">
              <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Status</th><th className="num">Total</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.id}</strong></td>
                    <td>{date(o.createdAt)}</td>
                    <td>{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="num">{money(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Customers() {
  const { data: customers, loading, error, setData } = useAuthData('/api/admin/customers');
  const { user } = useAuth();
  const api = useApi();
  const { notify } = useShop();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [viewing, setViewing] = useState(null);

  const list = useMemo(() => {
    let l = customers || [];
    if (type !== 'all') l = l.filter((c) => c.role === type);
    const s = q.trim().toLowerCase();
    if (s) l = l.filter((c) => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(s));
    return l;
  }, [customers, q, type]);

  const setRole = async (c, role) => {
    const promote = role === 'admin';
    const who = c.name || c.email;
    const ok = await confirm({
      title: promote ? `Make ${who} an admin?` : `Remove admin access from ${who}?`,
      message: promote
        ? 'They will be able to change stock, products, orders and other customers in the admin panel.'
        : 'They will become a regular customer and lose access to the admin panel.',
      details: [['Email', c.email], ['Role', promote ? 'customer → admin' : 'admin → customer']],
      confirmLabel: promote ? 'Make admin' : 'Remove admin',
      tone: promote ? 'warning' : 'danger',
      icon: promote ? ShieldCheck : ShieldOff,
    });
    if (!ok) return;
    try {
      await api(`/api/admin/customers/${c.id}`, 'PATCH', { role });
      setData((d) => d.map((x) => (x.id === c.id ? { ...x, role } : x)));
      notify(`${c.email} is now ${role === 'admin' ? 'an admin' : 'a customer'}`);
    } catch (err) { notify(err.message); }
  };

  if (loading && !customers) return <div className="spinner" />;
  if (error) return <p className="error-box error-box--inline">{error.message}</p>;

  return (
    <div>
      <div className="toolbar">
        <label className="search-input"><Search size={16} /><input placeholder="Search name, email or phone…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Customer type">
          <option value="all">Everyone ({customers.length})</option>
          <option value="customer">Registered</option>
          <option value="guest">Guest checkouts</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="table-wrap panel">
        <table className="table">
          <thead><tr><th>Customer</th><th>Type</th><th>Joined</th><th className="num">Orders</th><th className="num">Spent</th><th>Last order</th><th /></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className="clickable" onClick={() => setViewing(c)}>
                <td>
                  <div className="prodcell">
                    <span className="avatar">{(c.name || c.email || '?')[0].toUpperCase()}</span>
                    <div><strong>{c.name || '—'}</strong><small>{c.email}</small></div>
                  </div>
                </td>
                <td><span className={`pill ${c.role === 'admin' ? 'pill--gold' : c.role === 'customer' ? 'pill--ok' : ''}`}>{c.role === 'customer' ? 'Registered' : c.role}</span></td>
                <td>{date(c.joined)}</td>
                <td className="num">{c.orders}</td>
                <td className="num">{money(c.spent)}</td>
                <td>{date(c.lastOrder)}</td>
                <td className="actions" onClick={(e) => e.stopPropagation()}>
                  {!c.guest && c.id !== user.id && (
                    c.role === 'admin'
                      ? <button className="btn btn--sm abtn" onClick={() => setRole(c, 'customer')}>Remove admin</button>
                      : <button className="btn btn--sm abtn" onClick={() => setRole(c, 'admin')}>Make admin</button>
                  )}
                </td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan={7} className="muted center-cell">No customers found.</td></tr>}
          </tbody>
        </table>
      </div>

      {viewing && <CustomerOrders customer={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
