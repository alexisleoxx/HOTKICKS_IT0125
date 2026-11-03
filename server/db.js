import { supabase } from './supabase.js';
import { products as localProducts } from './products.js';
import { HttpError } from './util.js';

export { supabase };

// Log each distinct Supabase problem once instead of on every request
const warned = new Set();
export function fallback(where, error) {
  const key = `${where}:${error.code || error.message}`;
  if (warned.has(key)) return;
  warned.add(key);
  const hint = ['PGRST205', 'PGRST202', '42703'].includes(error.code)
    ? ' Re-run supabase/schema.sql in the Supabase SQL Editor.'
    : '';
  console.warn(`[db] ${where} failed (${error.code || 'error'}: ${error.message}). Using local fallback.${hint}`);
}

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

// DB rows use snake_case; the frontend expects the camelCase shape from products.js
export const fromRow = (r) => ({
  id: r.id, name: r.name, model: r.model, category: r.category, price: Number(r.price),
  rating: Number(r.rating), sold: r.sold, isNew: r.is_new, limited: r.limited, stock: r.stock,
  active: r.active !== false, accent: r.accent, bg: r.bg, tagline: r.tagline,
  description: r.description, colors: r.colors, sizes: r.sizes,
});

export const toRow = (p, i = 0) => ({
  id: p.id, name: p.name, model: p.model, category: p.category, price: p.price,
  rating: p.rating ?? 0, sold: p.sold ?? 0, is_new: !!p.isNew, limited: !!p.limited,
  stock: p.stock ?? 60, active: p.active !== false, accent: p.accent, bg: p.bg,
  tagline: p.tagline, description: p.description, colors: p.colors, sizes: p.sizes, sort_order: i,
});

export const orderFromRow = (r) => ({
  id: r.id, userId: r.user_id, email: r.email || r.customer?.email, customer: r.customer,
  lines: r.lines, subtotal: Number(r.subtotal), shipping: Number(r.shipping), tax: Number(r.tax),
  total: Number(r.total), status: r.status || 'pending', createdAt: r.created_at, updatedAt: r.updated_at,
});

const memory = { orders: [], subscribers: new Set() };

// The built-in catalog is only a demo for when Supabase isn't configured at all.
// Once Supabase is connected, the products table is the single source of truth:
// an empty table means an empty store. `strict` (used for orders) never falls back.
export async function getProducts({ includeInactive = false, strict = false } = {}) {
  if (!supabase) return localProducts;
  const { data, error } = await supabase.from('products').select('*').order('sort_order');
  if (error) {
    if (strict) throw new HttpError(503, 'The store is temporarily unavailable. Please try again in a moment.');
    fallback('Loading products', error);
    return [];
  }
  const list = data.map(fromRow);
  return includeInactive ? list : list.filter((p) => p.active);
}

export async function getProduct(id) {
  const list = await getProducts();
  return list.find((p) => p.id === id) || null;
}

// Reserves stock for every line, then stores the order. Throws 409 if something sold out.
export async function saveOrder(order) {
  if (!supabase) { memory.orders.push(order); return order; }

  const reserved = [];
  for (const line of order.lines) {
    const { data, error } = await supabase.rpc('decrement_stock', { pid: line.id, amount: line.qty });
    if (error) { fallback('Reserving stock', error); break; }
    if (data === false) {
      await Promise.all(reserved.map((l) => supabase.rpc('adjust_stock', { pid: l.id, delta: l.qty })));
      throw new HttpError(409, `Sorry, there isn't enough stock left for ${line.name}. Please lower the quantity.`);
    }
    reserved.push(line);
  }

  const { error } = await supabase.from('orders').insert({
    id: order.id, user_id: order.userId || null, email: order.customer.email,
    customer: order.customer, lines: order.lines, subtotal: order.subtotal,
    shipping: order.shipping, tax: order.tax, total: order.total, status: 'pending',
  });
  if (error) {
    await Promise.all(reserved.map((l) => supabase.rpc('adjust_stock', { pid: l.id, delta: l.qty })));
    fallback('Saving order', error);
    memory.orders.push(order);
  }
  return order;
}

export async function getOrdersForUser(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) { fallback('Loading your orders', error); return []; }
  return data.map(orderFromRow);
}

// Returns true if the email was already subscribed
export async function addSubscriber(email) {
  if (supabase) {
    const { data, error } = await supabase.from('subscribers').select('email').eq('email', email).maybeSingle();
    if (!error) {
      if (data) return true;
      const { error: insertError } = await supabase.from('subscribers').insert({ email });
      if (!insertError) return false;
      fallback('Saving subscriber', insertError);
    } else {
      fallback('Checking subscriber', error);
    }
  }
  const already = memory.subscribers.has(email);
  memory.subscribers.add(email);
  return already;
}
