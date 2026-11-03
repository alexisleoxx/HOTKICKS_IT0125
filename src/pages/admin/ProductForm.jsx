import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import ImageUploader from './ImageUploader.jsx';

const CATEGORIES = ['Running', 'Basketball', 'Lifestyle', 'Training', 'Limited Edition'];
const DEFAULT_SIZES = '6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13';

const blank = {
  name: '', model: '', category: 'Running', price: '', stock: 50, tagline: '', description: '',
  isNew: true, limited: false, active: true, sizes: DEFAULT_SIZES,
  colors: [{ name: '', hex: '#111111', images: [] }],
};

// Converts between the API product shape and the form's editable values
const toForm = (p) => p ? {
  ...p, sizes: p.sizes.join(', '),
  colors: p.colors.map((c) => ({ ...c, images: [...c.images] })),
} : blank;

const fromForm = (f) => ({
  name: f.name, model: f.model, category: f.category, price: Number(f.price), stock: Number(f.stock),
  tagline: f.tagline, description: f.description, isNew: f.isNew, limited: f.limited, active: f.active,
  sizes: f.sizes.split(',').map((s) => Number(s.trim())).filter(Boolean),
  colors: f.colors.map((c) => ({ name: c.name, hex: c.hex, images: c.images })),
});

export default function ProductForm({ product, onSave, onClose }) {
  const [form, setForm] = useState(() => toForm(product));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setColor = (i, k, v) => setForm((f) => ({ ...f, colors: f.colors.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }));

  const submit = async (e) => {
    e.preventDefault();
    const missing = form.colors.find((c) => !c.images.length);
    if (missing) { setError(`Upload at least one photo for ${missing.name || 'each color'}.`); return; }
    setBusy(true);
    setError('');
    try {
      await onSave(fromForm(form));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const preview = form.colors[0]?.images[0];

  return (
    <div className="amodal" onClick={onClose}>
      <form className="amodal__card" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header>
          <h3>{product ? `Edit ${product.name}` : 'Add new product'}</h3>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>

        <div className="amodal__body">
          <div className="pform">
            <label className="afield afield--wide"><span>Product name *</span><input required value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
            <label className="afield"><span>Model code</span><input value={form.model} placeholder="HK-R02" onChange={(e) => set('model', e.target.value)} /></label>
            <label className="afield"><span>Category *</span>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
            <label className="afield"><span>Price (₱ PHP) *</span><input required type="number" min="1" step="1" placeholder="e.g. 8995" value={form.price} onChange={(e) => set('price', e.target.value)} /></label>
            <label className="afield"><span>Stock (units) *</span><input required type="number" min="0" step="1" value={form.stock} onChange={(e) => set('stock', e.target.value)} /></label>
            <label className="afield afield--wide"><span>Tagline</span><input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} /></label>
            <label className="afield afield--wide"><span>Description</span><textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></label>
            <label className="afield afield--wide"><span>Sizes (comma separated)</span><input value={form.sizes} onChange={(e) => set('sizes', e.target.value)} /></label>
            <div className="afield afield--wide pform__toggles">
              {[['active', 'Visible in store'], ['isNew', 'New arrival'], ['limited', 'Limited edition']].map(([k, label]) => (
                <label key={k} className="toggle"><input type="checkbox" checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} /><span />{label}</label>
              ))}
            </div>
          </div>

          <div className="pform__colors">
            <div className="pform__colors-head">
              <h4>Colors & images</h4>
              {preview && <img src={preview} alt="" className="pform__preview" />}
            </div>
            {form.colors.map((c, i) => (
              <div key={i} className="cedit">
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : '#111111'} onChange={(e) => setColor(i, 'hex', e.target.value)} aria-label="Color swatch" />
                <input className="cedit__name" required placeholder="Color name (e.g. Inferno Red)" value={c.name} onChange={(e) => setColor(i, 'name', e.target.value)} />
                {form.colors.length > 1 && (
                  <button type="button" className="icon-btn" onClick={() => set('colors', form.colors.filter((_, j) => j !== i))} aria-label="Remove color"><Trash2 size={16} /></button>
                )}
                <div className="cedit__images">
                  <ImageUploader images={c.images} onChange={(imgs) => setColor(i, 'images', imgs)} />
                </div>
              </div>
            ))}
            <button type="button" className="btn btn--sm abtn" onClick={() => set('colors', [...form.colors, { name: '', hex: '#ffffff', images: [] }])}>
              <Plus size={14} /> Add color
            </button>
          </div>
        </div>

        <footer>
          {error && <p className="error-box error-box--inline">{error}</p>}
          <button type="button" className="btn btn--sm abtn" onClick={onClose}>Cancel</button>
          <button className="btn btn--sm btn--primary" disabled={busy}>{busy ? 'Saving…' : product ? 'Save changes' : 'Create product'}</button>
        </footer>
      </form>
    </div>
  );
}
