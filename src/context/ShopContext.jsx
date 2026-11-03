import { createContext, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useAuth } from '../hooks/useAuth.js';
import { shippingFor, taxFor } from '../../shared/pricing.js';

export const ShopContext = createContext(null);

const lineKey = (id, color, size) => `${id}|${color}|${size}`;

export function ShopProvider({ children }) {
  const [cart, setCart] = useLocalStorage('hk-cart', []);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickView, setQuickView] = useState(null);
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg) => {
    setToast({ msg, id: Date.now() });
    setTimeout(() => setToast(null), 2400);
  }, []);

  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Shopping requires an account: send guests to sign in, then bring them back here
  const requireSignIn = useCallback(() => {
    if (user) return true;
    setQuickView(null);
    setCartOpen(false);
    navigate('/login', { state: { from: pathname, notice: 'Sign in or create an account to start shopping.' } });
    return false;
  }, [user, navigate, pathname]);

  const addToCart = useCallback((product, { color, size, qty = 1 } = {}) => {
    if (!requireSignIn()) return;
    const c = color || product.colors[0];
    const s = size ?? product.sizes[Math.floor(product.sizes.length / 2)];
    const key = lineKey(product.id, c.name, s);
    setCart((prev) => {
      const found = prev.find((l) => l.key === key);
      if (found) return prev.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l));
      return [...prev, {
        key, id: product.id, name: product.name, price: product.price,
        color: c.name, hex: c.hex, image: c.images[0], size: s, qty, sizes: product.sizes,
      }];
    });
    notify(`${product.name} added to bag`);
    setCartOpen(true);
  }, [setCart, notify, requireSignIn]);

  const updateQty = useCallback((key, qty) => {
    setCart((prev) => prev.map((l) => (l.key === key ? { ...l, qty: Math.max(1, qty) } : l)));
  }, [setCart]);

  const updateSize = useCallback((key, size) => {
    setCart((prev) => {
      const line = prev.find((l) => l.key === key);
      if (!line) return prev;
      const newKey = lineKey(line.id, line.color, size);
      const rest = prev.filter((l) => l.key !== key);
      const dup = rest.find((l) => l.key === newKey);
      if (dup) return rest.map((l) => (l.key === newKey ? { ...l, qty: l.qty + line.qty } : l));
      return prev.map((l) => (l.key === key ? { ...l, size, key: newKey } : l));
    });
  }, [setCart]);

  const removeFromCart = useCallback((key) => setCart((prev) => prev.filter((l) => l.key !== key)), [setCart]);
  const clearCart = useCallback(() => setCart([]), [setCart]);

  const totals = useMemo(() => {
    const count = cart.reduce((s, l) => s + l.qty, 0);
    const subtotal = cart.reduce((s, l) => s + l.qty * l.price, 0);
    const shipping = shippingFor(subtotal);
    const tax = taxFor(subtotal);
    return { count, subtotal, shipping, tax, total: +(subtotal + shipping + tax).toFixed(2) };
  }, [cart]);

  const value = {
    cart, totals, addToCart, requireSignIn, updateQty, updateSize, removeFromCart, clearCart,
    cartOpen, setCartOpen, searchOpen, setSearchOpen, quickView, setQuickView, toast, notify,
  };
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
