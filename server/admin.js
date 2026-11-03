import express from 'express';
import { supabase, fromRow, toRow, orderFromRow, ORDER_STATUSES } from './db.js';
import { requireAdmin } from './auth.js';
import { wrap, HttpError } from './util.js';

export const adminRouter = express.Router();
adminRouter.use(requireAdmin);

const LOW_STOCK = 10;
const CATEGORIES = ['Running', 'Basketball', 'Lifestyle', 'Training', 'Limited Edition'];
const DEFAULT_SIZES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13];

const check = ({ data, error }) => {
  if (error) throw new HttpError(500, error.message);
  return data;
};

const slug = (s) => 'hk-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

// Validates the admin product form and fills in derived fields
function cleanProduct(body, existing = {}) {
  const p = { ...existing };
  const str = (k, max = 500) => { if (body[k] !== undefined) p[k] = String(body[k]).trim().slice(0, max); };
  ['name', 'model', 'tagline', 'accent'].forEach((k) => str(k, 120));
  str('description', 2000);
  if (body.category !== undefined) {
    if (!CATEGORIES.includes(body.category)) throw new HttpError(400, 'Invalid category.');
    p.category = body.category;
  }
  if (body.price !== undefined) {
    p.price = Number(body.price);
    if (!(p.price > 0)) throw new HttpError(400, 'Price must be greater than 0.');
  }
  if (body.stock !== undefined) {
    p.stock = Math.floor(Number(body.stock));
    if (!(p.stock >= 0)) throw new HttpError(400, 'Stock must be 0 or more.');
  }
  ['isNew', 'limited', 'active'].forEach((k) => { if (body[k] !== undefined) p[k] = !!body[k]; });
  if (body.colors !== undefined) {
    if (!Array.isArray(body.colors) || !body.colors.length) throw new HttpError(400, 'Add at least one color.');
    p.colors = body.colors.map((c) => ({
      name: String(c.name || '').trim() || 'Default',
      hex: /^#[0-9a-f]{3,8}$/i.test(c.hex) ? c.hex : '#111111',
      images: (c.images || []).map((u) => String(u).trim()).filter((u) => /^https?:\/\//.test(u)).slice(0, 6),
    }));
    if (p.colors.some((c) => !c.images.length)) throw new HttpError(400, 'Every color needs at least one image URL.');
  }
  if (body.sizes !== undefined) {
    p.sizes = (Array.isArray(body.sizes) ? body.sizes : []).map(Number).filter((n) => n > 0).sort((a, b) => a - b);
  }
  if (!p.sizes?.length) p.sizes = DEFAULT_SIZES;
  if (!p.name || !p.category || !p.price || !p.colors) throw new HttpError(400, 'Name, category, price and colors are required.');
  if (!/^#[0-9a-f]{3,8}$/i.test(p.accent || '')) p.accent = p.colors[0].hex;
  p.bg = `linear-gradient(135deg,#0b0b0b 0%,${p.accent}66 55%,${p.accent} 100%)`;
  p.model = p.model || 'HK-' + Math.random().toString(36).slice(2, 5).toUpperCase();
  return p;
}

// ---------- Image uploads (Supabase Storage) ----------
const BUCKET = 'product-images';
const IMAGE_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif', 'image/gif': 'gif' };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
let bucketReady = false;

// Creates the public bucket the first time an admin uploads, so there's no manual setup
async function ensureBucket() {
  if (bucketReady) return;
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true, fileSizeLimit: MAX_IMAGE_BYTES, allowedMimeTypes: Object.keys(IMAGE_TYPES),
    });
    if (error && !/exist/i.test(error.message)) throw new HttpError(500, `Couldn't set up image storage: ${error.message}`);
  }
  bucketReady = true;
}

// Body is the raw image file; Content-Type tells us its format
adminRouter.post('/uploads', express.raw({ type: Object.keys(IMAGE_TYPES), limit: MAX_IMAGE_BYTES }), wrap(async (req, res) => {
  const type = req.headers['content-type'];
  if (!IMAGE_TYPES[type] || !Buffer.isBuffer(req.body) || !req.body.length) {
    throw new HttpError(400, 'Choose a JPG, PNG, WebP, AVIF or GIF image up to 5 MB.');
  }
  await ensureBucket();
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${IMAGE_TYPES[type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, req.body, { contentType: type, cacheControl: '31536000' });
  if (error) throw new HttpError(500, `Upload failed: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  res.status(201).json({ url: data.publicUrl });
}));

// ---------- Dashboard ----------
adminRouter.get('/stats', wrap(async (req, res) => {
  const [products, orders, { count: customers }] = await Promise.all([
    supabase.from('products').select('*').then(check),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(check),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
  ]);
  const live = orders.filter((o) => o.status !== 'cancelled');
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, orders.filter((o) => (o.status || 'pending') === s).length]));

  const sales = {};
  live.forEach((o) => o.lines.forEach((l) => {
    sales[l.id] = sales[l.id] || { id: l.id, name: l.name, units: 0, revenue: 0 };
    sales[l.id].units += l.qty;
    sales[l.id].revenue += l.qty * l.price;
  }));

  // Revenue for the last 14 days
  const days = [...Array(14)].map((_, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (13 - i));
    return { date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 };
  });
  live.forEach((o) => {
    const day = days.find((d) => d.date === o.created_at.slice(0, 10));
    if (day) { day.revenue += Number(o.total); day.orders += 1; }
  });

  res.json({
    revenue: +live.reduce((s, o) => s + Number(o.total), 0).toFixed(2),
    orders: orders.length,
    customers: customers || 0,
    products: products.length,
    unitsInStock: products.reduce((s, p) => s + (p.stock || 0), 0),
    byStatus,
    lowStock: products.filter((p) => (p.stock ?? 0) <= LOW_STOCK).map(fromRow).sort((a, b) => a.stock - b.stock),
    topProducts: Object.values(sales).sort((a, b) => b.units - a.units).slice(0, 5),
    recentOrders: orders.slice(0, 6).map(orderFromRow),
    daily: days,
  });
}));

// ---------- Inventory ----------
adminRouter.get('/products', wrap(async (req, res) => {
  const rows = check(await supabase.from('products').select('*').order('sort_order'));
  res.json(rows.map(fromRow));
}));

adminRouter.post('/products', wrap(async (req, res) => {
  const p = cleanProduct(req.body || {});
  p.id = slug(p.name);
  const exists = check(await supabase.from('products').select('id').eq('id', p.id).maybeSingle());
  if (exists) p.id += '-' + Math.random().toString(36).slice(2, 5);
  const { count } = await supabase.from('products').select('id', { count: 'exact', head: true });
  const row = check(await supabase.from('products').insert(toRow(p, count || 0)).select().single());
  res.status(201).json(fromRow(row));
}));

adminRouter.put('/products/:id', wrap(async (req, res) => {
  const current = check(await supabase.from('products').select('*').eq('id', req.params.id).maybeSingle());
  if (!current) throw new HttpError(404, 'Product not found.');
  const p = cleanProduct(req.body || {}, fromRow(current));
  const row = toRow(p, current.sort_order);
  delete row.id;
  delete row.sort_order;
  const updated = check(await supabase.from('products').update(row).eq('id', req.params.id).select().single());
  res.json(fromRow(updated));
}));

// Restock: { delta: 25 } adds units, { delta: -3 } removes them
adminRouter.patch('/products/:id/stock', wrap(async (req, res) => {
  const delta = Math.trunc(Number(req.body?.delta));
  if (!delta) throw new HttpError(400, 'Enter how many units to add or remove.');
  const stock = check(await supabase.rpc('adjust_stock', { pid: req.params.id, delta }));
  if (stock === null) throw new HttpError(404, 'Product not found.');
  res.json({ id: req.params.id, stock });
}));

adminRouter.delete('/products/:id', wrap(async (req, res) => {
  check(await supabase.from('products').delete().eq('id', req.params.id));
  res.json({ ok: true });
}));

// ---------- Orders ----------
adminRouter.get('/orders', wrap(async (req, res) => {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  if (ORDER_STATUSES.includes(req.query.status)) query = query.eq('status', req.query.status);
  res.json(check(await query).map(orderFromRow));
}));

adminRouter.patch('/orders/:id', wrap(async (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, 'Invalid status.');
  const current = check(await supabase.from('orders').select('*').eq('id', req.params.id).maybeSingle());
  if (!current) throw new HttpError(404, 'Order not found.');

  // Put stock back when an order is cancelled, and take it again if it's un-cancelled
  const was = current.status || 'pending';
  if (was !== status && (was === 'cancelled' || status === 'cancelled')) {
    const sign = status === 'cancelled' ? 1 : -1;
    await Promise.all(current.lines.map((l) => supabase.rpc('adjust_stock', { pid: l.id, delta: sign * l.qty })));
  }
  const row = check(await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single());
  res.json(orderFromRow(row));
}));

// ---------- Customers ----------
adminRouter.get('/customers', wrap(async (req, res) => {
  const [profiles, orders] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(check),
    supabase.from('orders').select('id,user_id,email,customer,total,status,created_at').then(check),
  ]);
  const stats = (list) => {
    const live = list.filter((o) => o.status !== 'cancelled');
    return {
      orders: list.length,
      spent: +live.reduce((s, o) => s + Number(o.total), 0).toFixed(2),
      lastOrder: list.map((o) => o.created_at).sort().pop() || null,
    };
  };

  const registered = profiles.map((p) => ({
    id: p.id, name: p.name, email: p.email, phone: p.phone, role: p.role, guest: false,
    joined: p.created_at, ...stats(orders.filter((o) => o.user_id === p.id)),
  }));

  // Guests: checked out without an account, grouped by email
  const guestEmails = [...new Set(orders.filter((o) => !o.user_id).map((o) => (o.email || o.customer?.email || '').toLowerCase()))].filter(Boolean);
  const guests = guestEmails.map((email) => {
    const list = orders.filter((o) => !o.user_id && (o.email || o.customer?.email || '').toLowerCase() === email);
    return { id: 'guest:' + email, name: list[0].customer?.name, email, phone: list[0].customer?.phone, role: 'guest', guest: true, joined: list.map((o) => o.created_at).sort()[0], ...stats(list) };
  });

  res.json([...registered, ...guests]);
}));

adminRouter.get('/customers/:id/orders', wrap(async (req, res) => {
  const id = req.params.id;
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  query = id.startsWith('guest:') ? query.is('user_id', null).ilike('email', id.slice(6)) : query.eq('user_id', id);
  res.json(check(await query).map(orderFromRow));
}));

adminRouter.patch('/customers/:id', wrap(async (req, res) => {
  const { role } = req.body || {};
  if (!['customer', 'admin'].includes(role)) throw new HttpError(400, 'Invalid role.');
  if (req.params.id === req.user.id && role !== 'admin') throw new HttpError(400, "You can't remove your own admin access.");
  check(await supabase.from('profiles').update({ role }).eq('id', req.params.id));
  res.json({ ok: true });
}));
