import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, PackagePlus } from 'lucide-react';
import ProductForm from './ProductForm.jsx';
import { useAuthData, useApi } from '../../hooks/useAuthData.js';
import { clearProductCache } from '../../hooks/useProducts.js';
import { useShop } from '../../hooks/useShop.js';
import { useConfirm } from '../../hooks/useConfirm.js';
import { peso } from '../../../shared/pricing.js';

export const LOW = 10;
export const stockLevel = (stock) => (stock === 0 ? 'danger' : stock <= LOW ? 'warn' : 'ok');
const LEVEL_LABEL = { ok: 'In stock', warn: 'Low stock', danger: 'Sold out' };

// mode="inventory": read-only stock check · mode="update": edit, hide and delete products
export default function Inventory({ mode = 'inventory' }) {
  const { data: products, loading, error, setData } = useAuthData('/api/admin/products');
  const api = useApi();
  const { notify } = useShop();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null); // product, 'new', or null
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const update = mode === 'update';

  const list = useMemo(() => {
    let l = products || [];
    const s = q.trim().toLowerCase();
    if (s) l = l.filter((p) => `${p.name} ${p.model} ${p.category}`.toLowerCase().includes(s));
    if (filter === 'low') l = l.filter((p) => (p.stock ?? 0) <= LOW);
    if (filter === 'hidden') l = l.filter((p) => !p.active);
    if (!update) l = [...l].sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
    return l;
  }, [products, q, filter, update]);

  const save = async (body) => {
    if (editing === 'new') {
      const p = await api('/api/admin/products', 'POST', body);
      setData((d) => [...d, p]);
      notify(`${p.name} added`);
    } else {
      const p = await api(`/api/admin/products/${editing.id}`, 'PUT', body);
      setData((d) => d.map((x) => (x.id === p.id ? p : x)));
      notify(`${p.name} updated`);
    }
    clearProductCache();
    setEditing(null);
  };

  const toggleActive = async (p) => {
    const ok = await confirm(p.active
      ? { title: `Hide ${p.name}?`, message: 'It will disappear from the store, but stays in your inventory. You can show it again anytime.', confirmLabel: 'Hide from store', tone: 'warning', icon: EyeOff }
      : { title: `Show ${p.name}?`, message: 'It will be visible and available to buy in the store again.', confirmLabel: 'Show in store', tone: 'success', icon: Eye });
    if (!ok) return;
    try {
      const updated = await api(`/api/admin/products/${p.id}`, 'PUT', { active: !p.active });
      setData((d) => d.map((x) => (x.id === p.id ? updated : x)));
      notify(updated.active ? `${p.name} is visible` : `${p.name} hidden from store`);
      clearProductCache();
    } catch (err) { notify(err.message); }
  };

  const remove = async (p) => {
    const ok = await confirm({
      title: `Delete ${p.name}?`,
      message: "This permanently removes the product and its stock from HOTKICKS. This can't be undone.",
      details: [['Model', p.model], ['Category', p.category], ['Units in stock', p.stock ?? 0]],
      tip: 'Tip: hide it instead if you might sell it again.',
      confirmLabel: 'Delete product',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await api(`/api/admin/products/${p.id}`, 'DELETE');
      setData((d) => d.filter((x) => x.id !== p.id));
      notify(`${p.name} deleted`);
      clearProductCache();
    } catch (err) { notify(err.message); }
  };

  if (loading && !products) return <div className="spinner" />;
  if (error) return <p className="error-box error-box--inline">{error.message}</p>;

  const lowCount = products.filter((p) => (p.stock ?? 0) <= LOW).length;
  const units = products.reduce((s, p) => s + (p.stock || 0), 0);
  const maxStock = Math.max(1, ...products.map((p) => p.stock || 0));

  return (
    <div>
      {!update && (
        <div className="kpis">
          <div className="kpi"><span className="kpi__label">Products</span><strong className="kpi__value">{products.length}</strong></div>
          <div className="kpi"><span className="kpi__label">Units in stock</span><strong className="kpi__value">{units.toLocaleString()}</strong></div>
          <div className="kpi"><span className="kpi__label">Low stock</span><strong className="kpi__value">{lowCount}</strong></div>
          <div className="kpi"><span className="kpi__label">Sold out</span><strong className="kpi__value">{products.filter((p) => p.stock === 0).length}</strong></div>
        </div>
      )}

      <div className="toolbar">
        <label className="search-input"><Search size={16} /><input placeholder="Search products…" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter">
          <option value="all">All products ({products.length})</option>
          <option value="low">Low stock ({lowCount})</option>
          <option value="hidden">Hidden ({products.filter((p) => !p.active).length})</option>
        </select>
        {update
          ? <button className="btn btn--sm btn--primary" onClick={() => setEditing('new')}><Plus size={16} /> Add new product</button>
          : <Link className="btn btn--sm btn--primary" to="/admin/add-stock"><PackagePlus size={16} /> Add stock</Link>}
      </div>

      <div className="table-wrap panel">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th><th>Category</th><th className="num">Price</th><th>Stock</th><th>Status</th>
              {update && <th />}
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              const level = stockLevel(p.stock);
              return (
                <tr key={p.id} className={p.active ? '' : 'is-muted'}>
                  <td>
                    <div className="prodcell">
                      <img src={p.colors[0]?.images[0]} alt="" />
                      <div><strong>{p.name}</strong><small>{p.model} · {p.colors.length} color{p.colors.length > 1 ? 's' : ''}</small></div>
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td className="num">{peso(p.price)}</td>
                  <td>
                    <div className="stockcell">
                      <span className={`stock stock--${level}`}>{p.stock ?? 0}</span>
                      {!update && (
                        <div className="stockbar"><span className={`stock--${level}`} style={{ width: `${((p.stock || 0) / maxStock) * 100}%` }} /></div>
                      )}
                    </div>
                  </td>
                  <td>
                    {!update && <span className={`pill pill--${level}`}>{LEVEL_LABEL[level]}</span>}
                    <span className={`pill ${p.active ? 'pill--ok' : ''}`}>{p.active ? 'Live' : 'Hidden'}</span>
                    {p.limited && <span className="pill pill--gold">LTD</span>}
                    {update && p.isNew && <span className="pill">New</span>}
                  </td>
                  {update && (
                    <td className="actions">
                      <button className="icon-btn" onClick={() => toggleActive(p)} title={p.active ? 'Hide from store' : 'Show in store'}>{p.active ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      <button className="icon-btn" onClick={() => setEditing(p)} title="Edit"><Pencil size={16} /></button>
                      <button className="icon-btn icon-btn--danger" onClick={() => remove(p)} title="Delete"><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              );
            })}
            {!list.length && <tr><td colSpan={6} className="muted center-cell">No products match.</td></tr>}
          </tbody>
        </table>
      </div>

      {editing && <ProductForm product={editing === 'new' ? null : editing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}
