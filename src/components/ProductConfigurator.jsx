import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import ShoeImage from './ShoeImage.jsx';
import { useShop } from '../hooks/useShop.js';
import { peso, FREE_SHIPPING_OVER } from '../../shared/pricing.js';

// Gallery + color/size/qty selection, shared by the product page and the quick view modal
export default function ProductConfigurator({ product, compact = false, onAdded }) {
  const { addToCart } = useShop();
  const [colorIdx, setColorIdx] = useState(0);
  const [angle, setAngle] = useState(0);
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => { setColorIdx(0); setAngle(0); setSize(null); setQty(1); setError(''); }, [product.id]);

  const color = product.colors[colorIdx];
  const soldOut = product.stock === 0;
  const maxQty = Math.min(10, product.stock ?? 10);
  const add = () => {
    if (!size) { setError('Please select a size'); return; }
    if (qty > maxQty) { setError(`Only ${maxQty} left`); return; }
    addToCart(product, { color, size, qty });
    onAdded?.();
  };

  return (
    <div className={`pd ${compact ? 'pd--compact' : ''}`}>
      <div className="pd__gallery" style={{ background: product.bg }}>
        <AnimatePresence mode="wait">
          <motion.div key={color.name + angle} className="pd__main" initial={{ opacity: 0, x: 40, rotate: -6 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.45 }}>
            <ShoeImage src={color.images[angle]} alt={`${product.name} in ${color.name}, view ${angle + 1}`} loading="eager" />
          </motion.div>
        </AnimatePresence>
        <div className="pd__thumbs">
          {color.images.map((src, i) => (
            <button key={i} className={`pd__thumb ${i === angle ? 'is-active' : ''}`} onClick={() => setAngle(i)} aria-label={`View angle ${i + 1}`}>
              <ShoeImage src={src} alt="" />
            </button>
          ))}
        </div>
      </div>

      <div className="pd__info">
        <span className="eyebrow eyebrow--dark">{product.category} · {product.model}</span>
        <h1 className="pd__name">{product.name}</h1>
        <div className="pd__price">{peso(product.price)}<span>★ {product.rating.toFixed(1)} · {product.sold.toLocaleString()} sold</span></div>
        {soldOut ? <p className="pd__stock">Sold out</p>
          : (product.limited || product.stock <= 10) && product.stock != null && <p className="pd__stock">Only {product.stock} pairs left</p>}
        <p className="pd__desc">{product.description}</p>

        <div className="pd__group">
          <div className="pd__label">Color <strong>{color.name}</strong></div>
          <div className="swatches swatches--lg">
            {product.colors.map((c, i) => (
              <button key={c.name} title={c.name} aria-label={c.name} className={`swatch ${i === colorIdx ? 'is-active' : ''}`} style={{ background: c.hex }} onClick={() => { setColorIdx(i); setAngle(0); }} />
            ))}
          </div>
        </div>

        <div className="pd__group">
          <div className="pd__label">Size (US) {error && <em className="pd__error">{error}</em>}</div>
          <div className="sizes">
            {product.sizes.map((s) => (
              <motion.button whileTap={{ scale: 0.92 }} key={s} className={`size ${size === s ? 'is-active' : ''}`} onClick={() => { setSize(s); setError(''); }}>{s}</motion.button>
            ))}
          </div>
        </div>

        <div className="pd__buy">
          <div className="qty">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity"><Minus size={16} /></button>
            <span>{qty}</span>
            <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))} aria-label="Increase quantity"><Plus size={16} /></button>
          </div>
          {soldOut ? (
            <button className="btn btn--dark btn--block" disabled>SOLD OUT</button>
          ) : (
            <motion.button whileTap={{ scale: 0.97 }} className="btn btn--primary btn--block" onClick={add}>
              <ShoppingBag size={18} /> ADD TO CART · {peso(product.price * qty)}
            </motion.button>
          )}
        </div>

        {!compact && (
          <ul className="pd__perks">
            <li><Truck size={18} /> Free shipping on orders over {peso(FREE_SHIPPING_OVER)}</li>
            <li><RotateCcw size={18} /> Free 30-day returns</li>
            <li><ShieldCheck size={18} /> 100% authentic, verified by HOTKICKS</li>
          </ul>
        )}
      </div>
    </div>
  );
}
