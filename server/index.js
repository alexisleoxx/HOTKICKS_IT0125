import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getProducts, getProduct, saveOrder, addSubscriber } from './db.js';
import { chatReply } from './chat.js';
import { authRouter, requireUser } from './auth.js';
import { adminRouter } from './admin.js';
import { wrap } from './util.js';
import { shippingFor, taxFor } from '../shared/pricing.js';

const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.get('/api/products', wrap(async (req, res) => {
  const { category, q } = req.query;
  let list = await getProducts();
  if (category && category !== 'All') list = list.filter((p) => p.category === category);
  if (q) {
    const s = String(q).toLowerCase();
    list = list.filter((p) => `${p.name} ${p.model} ${p.category}`.toLowerCase().includes(s));
  }
  res.json(list);
}));

app.get('/api/products/:id', wrap(async (req, res) => {
  const p = await getProduct(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
}));

// Only signed-in customers can place orders
app.post('/api/orders', requireUser, wrap(async (req, res) => {
  const { customer, items } = req.body || {};
  if (!customer?.email || !customer?.name || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Missing customer details or items' });
  }
  // Check every item against the live catalog (strict: never the demo fallback) and recompute prices
  const catalog = await getProducts({ strict: true });
  const unavailable = [];
  const lines = items.map((i) => {
    const p = catalog.find((x) => x.id === i.id);
    const qty = Math.min(20, Math.max(1, Math.floor(Number(i.qty)) || 1));
    if (!p || p.stock === 0) { unavailable.push({ id: i.id, reason: 'unavailable' }); return null; }
    if (p.stock != null && qty > p.stock) { unavailable.push({ id: i.id, reason: 'stock', stock: p.stock }); return null; }
    return {
      id: p.id, name: p.name, price: p.price, qty,
      size: String(i.size ?? '').slice(0, 10), color: String(i.color ?? '').slice(0, 60),
      image: p.colors.find((c) => c.name === i.color)?.images[0] || p.colors[0]?.images[0],
    };
  });
  if (unavailable.length) {
    return res.status(409).json({
      error: 'Some items in your bag are no longer available. Remove them or lower the quantity, then try again.',
      code: 'UNAVAILABLE', items: unavailable,
    });
  }
  const cleanCustomer = Object.fromEntries(
    ['name', 'email', 'phone', 'address', 'city', 'zip', 'country'].map((k) => [k, String(customer[k] || '').trim().slice(0, 200)])
  );
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = shippingFor(subtotal);
  const tax = taxFor(subtotal);
  const order = {
    id: 'HK-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    userId: req.user?.id || null, status: 'pending',
    customer: cleanCustomer, lines, subtotal, shipping, tax,
    total: +(subtotal + shipping + tax).toFixed(2),
    createdAt: new Date().toISOString(),
  };
  await saveOrder(order);
  res.status(201).json(order);
}));

app.post('/api/newsletter', wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email' });
  const already = await addSubscriber(email);
  res.json({ ok: true, already });
}));

app.post('/api/chat', wrap(async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'No messages' });
  const reply = await chatReply(messages, await getProducts());
  res.json({ reply });
}));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'That file is too large. Images must be 5 MB or smaller.' });
  }
  if (!err.status || err.status >= 500) console.error(err);
  res.status(err.status || 500).json(err.status
    ? { error: err.message, ...(err.code && { code: err.code }) }
    : { error: 'Server error. Please try again.' });
});

// Serve the built React app in production
const dist = path.join(__dirname, '..', 'dist');
app.use(express.static(dist));
app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, () => console.log(`HOTKICKS API running on http://localhost:${PORT}`));
