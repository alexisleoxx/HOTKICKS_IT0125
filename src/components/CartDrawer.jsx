import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, X, ShoppingBag } from 'lucide-react';
import ShoeImage from './ShoeImage.jsx';
import { useShop } from '../hooks/useShop.js';
import { useLockBody } from '../hooks/useLockBody.js';
import { peso, FREE_SHIPPING_OVER } from '../../shared/pricing.js';

export default function CartDrawer() {
  const { cart, totals, cartOpen, setCartOpen, updateQty, updateSize, removeFromCart } = useShop();
  const navigate = useNavigate();
  useLockBody(cartOpen);
  const close = () => setCartOpen(false);
  const freeLeft = Math.max(0, FREE_SHIPPING_OVER - totals.subtotal);

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.aside
            className="drawer"
            role="dialog"
            aria-label="Shopping bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="drawer__head">
              <h2>Your Bag <span>({totals.count})</span></h2>
              <button onClick={close} aria-label="Close bag"><X size={22} /></button>
            </header>

            {cart.length > 0 && (
              <div className="drawer__ship">
                {freeLeft > 0 ? <>Add <strong>{peso(Math.ceil(freeLeft))}</strong> more for free shipping</> : <>You unlocked <strong>free shipping</strong></>}
                <div className="drawer__shipbar"><motion.span animate={{ scaleX: Math.min(1, totals.subtotal / FREE_SHIPPING_OVER) }} /></div>
              </div>
            )}

            <div className="drawer__items">
              {cart.length === 0 ? (
                <div className="drawer__empty">
                  <ShoppingBag size={48} strokeWidth={1.2} />
                  <p>Your bag is empty.</p>
                  <button className="btn btn--primary" onClick={() => { close(); navigate('/shop'); }}>SHOP SNEAKERS</button>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {cart.map((l) => (
                    <motion.div key={l.key} layout className="line" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0 }}>
                      <div className="line__img"><ShoeImage src={l.image} alt={l.name} /></div>
                      <div className="line__info">
                        <div className="line__top">
                          <h4>{l.name}</h4>
                          <span>{peso(l.price * l.qty, { cents: true })}</span>
                        </div>
                        <p className="line__meta"><i style={{ background: l.hex }} /> {l.color}</p>
                        <div className="line__controls">
                          <label className="line__size">
                            Size
                            <select value={l.size} onChange={(e) => updateSize(l.key, Number(e.target.value))}>
                              {l.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </label>
                          <div className="qty qty--sm">
                            <button onClick={() => updateQty(l.key, l.qty - 1)} aria-label="Decrease"><Minus size={14} /></button>
                            <span>{l.qty}</span>
                            <button onClick={() => updateQty(l.key, l.qty + 1)} aria-label="Increase"><Plus size={14} /></button>
                          </div>
                          <button className="line__remove" onClick={() => removeFromCart(l.key)} aria-label={`Remove ${l.name}`}><Trash2 size={16} /></button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {cart.length > 0 && (
              <footer className="drawer__foot">
                <div className="sum"><span>Subtotal</span><span>{peso(totals.subtotal, { cents: true })}</span></div>
                <div className="sum"><span>Shipping</span><span>{totals.shipping ? peso(totals.shipping) : 'Free'}</span></div>
                <div className="sum"><span>Est. tax</span><span>{peso(totals.tax, { cents: true })}</span></div>
                <div className="sum sum--total"><span>Total</span><span>{peso(totals.total, { cents: true })}</span></div>
                <button className="btn btn--primary btn--block" onClick={() => { close(); navigate('/checkout'); }}>CHECKOUT</button>
                <button className="btn btn--text btn--block" onClick={close}>Continue shopping</button>
              </footer>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
