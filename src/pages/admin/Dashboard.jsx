import { Link } from 'react-router-dom';
import { DollarSign, ShoppingCart, Users, Boxes, AlertTriangle } from 'lucide-react';
import StatusBadge, { STATUSES } from '../../components/StatusBadge.jsx';
import { useAuthData } from '../../hooks/useAuthData.js';
import { peso } from '../../../shared/pricing.js';

const money = (n) => peso(n, { cents: true });

function RevenueChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.revenue));
  return (
    <div className="bars" role="img" aria-label="Revenue over the last 14 days">
      {days.map((d) => (
        <div key={d.date} className="bars__col" title={`${d.date}: ${money(d.revenue)} · ${d.orders} orders`}>
          <div className="bars__bar" style={{ height: `${(d.revenue / max) * 100}%` }} />
          <span>{new Date(d.date + 'T00:00').getDate()}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error, reload } = useAuthData('/api/admin/stats');
  if (loading && !data) return <div className="spinner" />;
  if (error) return <div className="error-box error-box--inline">{error.message} <button className="link" onClick={reload}>Retry</button></div>;

  const cards = [
    { label: 'Revenue', value: money(data.revenue), icon: DollarSign, note: 'excl. cancelled' },
    { label: 'Orders', value: data.orders, icon: ShoppingCart, note: `${data.byStatus.pending} pending` },
    { label: 'Customers', value: data.customers, icon: Users, note: 'registered' },
    { label: 'Units in stock', value: data.unitsInStock.toLocaleString(), icon: Boxes, note: `${data.products} products` },
  ];

  return (
    <div className="dash">
      <div className="kpis">
        {cards.map(({ label, value, icon: Icon, note }) => (
          <div key={label} className="kpi">
            <div className="kpi__icon"><Icon size={18} /></div>
            <span className="kpi__label">{label}</span>
            <strong className="kpi__value">{value}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>

      <div className="dash__grid">
        <section className="panel panel--wide">
          <header><h3>Revenue · last 14 days</h3></header>
          <RevenueChart days={data.daily} />
        </section>

        <section className="panel">
          <header><h3>Orders by status</h3><Link to="/admin/orders">View all</Link></header>
          <ul className="statuslist">
            {STATUSES.map((s) => (
              <li key={s}><Link to={`/admin/orders?status=${s}`}><StatusBadge status={s} /><strong>{data.byStatus[s]}</strong></Link></li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <header><h3><AlertTriangle size={16} /> Low stock</h3><Link to="/admin/add-stock">Restock</Link></header>
          {data.lowStock.length === 0 ? <p className="muted">Everything is well stocked.</p> : (
            <ul className="mini">
              {data.lowStock.slice(0, 6).map((p) => (
                <li key={p.id}><span>{p.name}</span><b className={p.stock === 0 ? 'danger' : 'warn'}>{p.stock === 0 ? 'Sold out' : `${p.stock} left`}</b></li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <header><h3>Top sellers</h3></header>
          {data.topProducts.length === 0 ? <p className="muted">No sales yet.</p> : (
            <ul className="mini">
              {data.topProducts.map((p, i) => (
                <li key={p.id}><span>{i + 1}. {p.name}</span><b>{p.units} sold · {money(p.revenue)}</b></li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel--wide">
          <header><h3>Recent orders</h3><Link to="/admin/orders">View all</Link></header>
          {data.recentOrders.length === 0 ? <p className="muted">No orders yet.</p> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.id}</strong></td>
                      <td>{o.customer?.name}<small>{o.email}</small></td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="num">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
