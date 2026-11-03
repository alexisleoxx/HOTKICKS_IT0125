import { useMemo, useState } from 'react';
import { PackagePlus, Plus } from 'lucide-react';
import ProductForm from './ProductForm.jsx';
import { LOW, stockLevel } from './Inventory.jsx';
import { useAuthData, useApi } from '../../hooks/useAuthData.js';
import { clearProductCache } from '../../hooks/useProducts.js';
import { useShop } from '../../hooks/useShop.js';
import { useConfirm } from '../../hooks/useConfirm.js';

export default function AddStock() {
  const { data: products, loading, error, setData } = useAuthData('/api/admin/products');
  const api = useApi();
  const { notify } = useShop();
  const confirm = useConfirm();
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [history, setHistory] = useState([]);

  const selected = products?.find((p) => p.id === productId);
  const lowList = useMemo(() => (products || []).filter((p) => (p.stock ?? 0) <= LOW).sort((a, b) => a.stock - b.stock), [products]);

  const restock = async (product, amount) => {
    const n = parseInt(amount, 10);
    if (!product || !(n > 0)) { notify('Choose a product and a quantity above 0'); return; }
    const ok = await confirm({
      title: `Add ${n} units to ${product.name}?`,
      message: 'The new stock is available to customers right away.',
      details: [['Current stock', product.stock ?? 0], ['Adding', `+${n}`], ['New stock', (product.stock || 0) + n]],
      confirmLabel: 'Add stock',
      tone: 'success',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { stock } = await api(`/api/admin/products/${product.id}/stock`, 'PATCH', { delta: n });
      setData((d) => d.map((x) => (x.id === product.id ? { ...x, stock } : x)));
      setHistory((h) => [{ name: product.name, added: n, stock, at: new Date() }, ...h].slice(0, 8));
      notify(`Added ${n} to ${product.name}. Now ${stock} in stock.`);
      clearProductCache();
      setQty('');
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  };

  const create = async (body) => {
    const p = await api('/api/admin/products', 'POST', body);
    setData((d) => [...d, p]);
    clearProductCache();
    notify(`${p.name} added with ${p.stock} in stock`);
    setCreating(false);
  };

  if (loading && !products) return <div className="spinner" />;
  if (error) return <p className="error-box error-box--inline">{error.message}</p>;

  return (
    <div className="addstock">
      <section className="panel">
        <header><h3><PackagePlus size={16} /> Restock an existing product</h3></header>
        <form className="addstock__form" onSubmit={(e) => { e.preventDefault(); restock(selected, qty); }}>
          <label className="afield">
            <span>Product</span>
            <select required value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.model}). {p.stock ?? 0} in stock</option>)}
            </select>
          </label>
          <label className="afield">
            <span>Quantity to add</span>
            <input required type="number" min="1" step="1" placeholder="e.g. 25" value={qty} onChange={(e) => setQty(e.target.value)} />
          </label>
          <div className="addstock__quick">
            {[5, 10, 25, 50].map((n) => <button type="button" key={n} className="chip chip--sm" onClick={() => setQty(String(n))}><span>+{n}</span></button>)}
          </div>
          {selected && (
            <div className="addstock__preview">
              <img src={selected.colors[0]?.images[0]} alt="" />
              <div>
                <strong>{selected.name}</strong>
                <small>Current: <b className={`stock stock--${stockLevel(selected.stock)}`}>{selected.stock ?? 0}</b>{qty > 0 && <> → After: <b className="stock stock--ok">{(selected.stock || 0) + Number(qty)}</b></>}</small>
              </div>
            </div>
          )}
          <button className="btn btn--primary" disabled={busy}><PackagePlus size={16} /> {busy ? 'Adding…' : 'Add stock'}</button>
        </form>
      </section>

      <section className="panel">
        <header><h3>New product?</h3></header>
        <p className="muted">Add a brand-new sneaker to the catalog with its price, colors, images and starting stock.</p>
        <button className="btn btn--sm btn--dark" style={{ marginTop: 16 }} onClick={() => setCreating(true)}><Plus size={16} /> Add new product</button>
      </section>

      <section className="panel">
        <header><h3>Needs restocking ({lowList.length})</h3></header>
        {lowList.length === 0 ? <p className="muted">Nothing is low on stock.</p> : (
          <ul className="mini">
            {lowList.map((p) => (
              <li key={p.id}>
                <span>{p.name} <b className={`stock stock--${stockLevel(p.stock)}`}>{p.stock ?? 0}</b></span>
                <button className="btn btn--sm abtn" disabled={busy} onClick={() => restock(p, 25)}>+25</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <header><h3>Added this session</h3></header>
        {history.length === 0 ? <p className="muted">Restocks you make will show here.</p> : (
          <ul className="mini">
            {history.map((h, i) => (
              <li key={i}><span>{h.name} <small className="muted">· {h.at.toLocaleTimeString()}</small></span><b>+{h.added} → {h.stock}</b></li>
            ))}
          </ul>
        )}
      </section>

      {creating && <ProductForm product={null} onSave={create} onClose={() => setCreating(false)} />}
    </div>
  );
}
