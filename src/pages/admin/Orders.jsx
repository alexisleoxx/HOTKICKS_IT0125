import { Fragment, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search, Truck } from 'lucide-react';
import StatusBadge, { STATUSES } from '../../components/StatusBadge.jsx';
import { useAuthData, useApi } from '../../hooks/useAuthData.js';
import { useShop } from '../../hooks/useShop.js';
import { useConfirm } from '../../hooks/useConfirm.js';
import { peso } from '../../../shared/pricing.js';

const money = (n) => peso(n, { cents: true });

export default function Orders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const { data: orders, loading, error, setData } = useAuthData(`/api/admin/orders${status ? `?status=${status}` : ''}`);
  const api = useApi();
  const { notify } = useShop();
  const confirm = useConfirm();
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!orders || !s) return orders || [];
    return orders.filter((o) => `${o.id} ${o.email} ${o.customer?.name}`.toLowerCase().includes(s));
  }, [orders, q]);

  const setStatus = async (order, next) => {
    if (next === order.status) return;
    const cancelling = next === 'cancelled';
    const items = order.lines.reduce((s, l) => s + l.qty, 0);
    const ok = await confirm({
      title: cancelling ? `Cancel order ${order.id}?` : `Mark ${order.id} as ${next}?`,
      message: cancelling
        ? `The ${items} item(s) in this order will go back into stock, and the customer will see it as cancelled.`
        : `The customer will see this order as "${next}" in their account.`,
      details: [['Customer', order.customer?.name || order.email], ['Status', `${order.status} → ${next}`], ['Total', money(order.total)]],
      confirmLabel: cancelling ? 'Cancel order' : `Mark ${next}`,
      cancelLabel: cancelling ? 'Keep order' : 'Cancel',
      tone: cancelling ? 'danger' : 'default',
      icon: cancelling ? undefined : Truck,
    });
    if (!ok) return;
    try {
      const updated = await api(`/api/admin/orders/${order.id}`, 'PATCH', { status: next });
      setData((d) => (status && status !== next ? d.filter((o) => o.id !== order.id) : d.map((o) => (o.id === order.id ? updated : o))));
      notify(`${order.id} marked ${next}`);
    } catch (err) { notify(err.message); }
  };

  return (
    <div>
      <div className="toolbar">
        <label className="search-input"><Search size={16} /><input placeholder="Search order #, name or email…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <div className="chips">
          {['', ...STATUSES].map((s) => (
            <button key={s || 'all'} className={`chip chip--sm ${status === s ? 'is-active' : ''}`} onClick={() => setParams(s ? { status: s } : {})}>
              {status === s && <span className="chip__bg" />}<span>{s || 'All'}</span>
            </button>
          ))}
        </div>
      </div>

      {loading && !orders ? <div className="spinner" /> : error ? <p className="error-box error-box--inline">{error.message}</p> : (
        <div className="table-wrap panel">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th className="num">Total</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((o) => (
                <Fragment key={o.id}>
                  <tr className="clickable" onClick={() => setOpen(open === o.id ? null : o.id)}>
                    <td><strong>{o.id}</strong>{!o.userId && <small>Guest</small>}</td>
                    <td>{o.customer?.name}<small>{o.email}</small></td>
                    <td>{new Date(o.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td>{o.lines.reduce((s, l) => s + l.qty, 0)}</td>
                    <td className="num">{money(o.total)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <select className={`status-select status--${o.status}`} value={o.status} onChange={(e) => setStatus(o, e.target.value)} aria-label={`Status of ${o.id}`}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td><ChevronDown size={16} className={`chev ${open === o.id ? 'is-open' : ''}`} /></td>
                  </tr>
                  {open === o.id && (
                    <tr className="detail-row">
                      <td colSpan={7}>
                        <div className="odetail">
                          <div>
                            <h4>Items</h4>
                            {o.lines.map((l, i) => (
                              <div key={i} className="odetail__line">
                                {l.image && <img src={l.image} alt="" />}
                                <span>{l.qty} × {l.name}<small>{l.color} · US {l.size}</small></span>
                                <b>{money(l.qty * l.price)}</b>
                              </div>
                            ))}
                          </div>
                          <div>
                            <h4>Ship to</h4>
                            <p>{o.customer?.name}<br />{o.customer?.address}<br />{o.customer?.city} {o.customer?.zip}<br />{o.customer?.country}</p>
                            <p className="muted">{o.customer?.phone}</p>
                          </div>
                          <div>
                            <h4>Payment</h4>
                            <p className="sum"><span>Subtotal</span><span>{money(o.subtotal)}</span></p>
                            <p className="sum"><span>Shipping</span><span>{money(o.shipping)}</span></p>
                            <p className="sum"><span>Tax</span><span>{money(o.tax)}</span></p>
                            <p className="sum sum--total"><span>Total</span><span>{money(o.total)}</span></p>
                            {o.updatedAt && <p className="muted small">Last update {new Date(o.updatedAt).toLocaleString()}</p>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {!list.length && <tr><td colSpan={7} className="muted center-cell">No orders{status && <> with status <StatusBadge status={status} /></>}.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
