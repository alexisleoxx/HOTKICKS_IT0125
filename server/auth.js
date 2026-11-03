import express from 'express';
import { supabase, authClient } from './supabase.js';
import { getOrdersForUser, addSubscriber } from './db.js';
import { wrap, HttpError } from './util.js';

export const authRouter = express.Router();

// Where links in confirmation / reset emails send the user back to
const SITE_URL = (process.env.SITE_URL || 'http://localhost:5173').trim().replace(/\/+$/, '');
const CALLBACK_URL = `${SITE_URL}/auth/callback`;

export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9][0-9\s-]{6,18}$/;

const sessionOut = (s) => ({ access_token: s.access_token, refresh_token: s.refresh_token, expires_at: s.expires_at });

const profileOut = (p) => p && ({
  id: p.id, email: p.email, name: p.name || '', phone: p.phone || '', gender: p.gender || '',
  address: p.address || {}, newsletter: !!p.newsletter, role: p.role || 'customer', createdAt: p.created_at,
});

function requireSupabase() {
  if (!supabase) throw new HttpError(503, 'Accounts need Supabase. Add your Supabase keys to .env.');
}

// Loads the user's profile row, creating it from their sign-up details the first time
export async function getProfile(user) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw new HttpError(500, 'Profiles table missing. Re-run supabase/schema.sql.');
  if (data) return data;

  const meta = user.user_metadata || {};
  const row = {
    id: user.id, email: user.email, name: meta.name || '', phone: meta.phone || '',
    gender: meta.gender || null, address: meta.address ? { address: meta.address } : {},
    newsletter: !!meta.newsletter, role: 'customer',
  };
  const { data: created, error: insertError } = await supabase.from('profiles').upsert(row).select().single();
  if (insertError) {
    const hint = insertError.code === 'PGRST204' ? ' Re-run supabase/schema.sql.' : '';
    throw new HttpError(500, insertError.message + hint);
  }
  if (row.newsletter) await addSubscriber(user.email.toLowerCase()).catch(() => {});
  return created;
}

async function userFromRequest(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token || !supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email, profile: await getProfile(data.user) };
}

export const optionalUser = wrap(async (req, res, next) => {
  req.user = await userFromRequest(req);
  next();
});

export const requireUser = wrap(async (req, res, next) => {
  requireSupabase();
  req.user = await userFromRequest(req);
  if (!req.user) throw new HttpError(401, 'Please sign in.');
  next();
});

export const requireAdmin = wrap(async (req, res, next) => {
  requireSupabase();
  req.user = await userFromRequest(req);
  if (!req.user) throw new HttpError(401, 'Please sign in.');
  if (req.user.profile.role !== 'admin') throw new HttpError(403, 'Admin access only.');
  next();
});

const isUnconfirmed = (error) => error?.code === 'email_not_confirmed' || /not confirmed/i.test(error?.message || '');

async function signIn(email, password) {
  const { data, error } = await authClient().auth.signInWithPassword({ email, password });
  if (isUnconfirmed(error)) {
    throw new HttpError(403, 'Please confirm your email first. Check your inbox for the link.', 'EMAIL_NOT_CONFIRMED');
  }
  if (error) throw new HttpError(401, 'Incorrect email or password.');
  const profile = await getProfile(data.user);
  return { session: sessionOut(data.session), profile: profileOut(profile) };
}

// Supabase's built-in mailer allows only a few emails per hour
const mailError = (error) => {
  if (error?.status === 429 || /rate limit/i.test(error?.message || '')) {
    return new HttpError(429, 'Too many emails sent. Please wait a few minutes and try again.');
  }
  return new HttpError(400, error.message);
};

authRouter.post('/signup', wrap(async (req, res) => {
  requireSupabase();
  const b = req.body || {};
  const name = String(b.name || '').trim().slice(0, 100);
  const email = String(b.email || '').trim().toLowerCase();
  const phone = String(b.phone || '').trim();
  const gender = String(b.gender || '');
  const address = String(b.address || '').trim().slice(0, 200);
  const password = String(b.password || '');
  const newsletter = b.newsletter === true;

  if (!name) throw new HttpError(400, 'Please enter your full name.');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email.');
  if (!PHONE_RE.test(phone)) throw new HttpError(400, 'Please enter a valid contact number.');
  if (!GENDERS.includes(gender)) throw new HttpError(400, 'Please select a gender option.');
  if (!address) throw new HttpError(400, 'Please enter your home address.');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (b.newsletter !== true && b.newsletter !== false) throw new HttpError(400, 'Let us know if you want email updates.');

  const { data, error } = await authClient().auth.signUp({
    email, password,
    options: { emailRedirectTo: CALLBACK_URL, data: { name, phone, gender, address, newsletter } },
  });
  if (error) {
    if (/already|registered|exists/i.test(error.message)) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
    throw mailError(error);
  }
  // Supabase hides existing accounts by returning a user with no identities
  if (data.user && !data.user.identities?.length) {
    throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
  }
  // Email confirmation turned off in Supabase: the user is signed in straight away
  if (data.session) {
    const profile = await getProfile(data.user);
    return res.status(201).json({ session: sessionOut(data.session), profile: profileOut(profile) });
  }
  res.status(201).json({ needsConfirmation: true, email });
}));

authRouter.post('/resend', wrap(async (req, res) => {
  requireSupabase();
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email.');
  const { error } = await authClient().auth.resend({ type: 'signup', email, options: { emailRedirectTo: CALLBACK_URL } });
  if (error) throw mailError(error);
  res.json({ ok: true });
}));

authRouter.post('/login', wrap(async (req, res) => {
  requireSupabase();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) throw new HttpError(400, 'Enter your email and password.');
  res.json(await signIn(email, password));
}));

// Sends a reset link. Always answers OK so nobody can probe which emails have accounts.
authRouter.post('/forgot', wrap(async (req, res) => {
  requireSupabase();
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email.');
  const { error } = await authClient().auth.resetPasswordForEmail(email, { redirectTo: CALLBACK_URL });
  if (error && (error.status === 429 || /rate limit/i.test(error.message))) throw mailError(error);
  res.json({ ok: true });
}));

// Called from the reset page with the recovery token from the email link
authRouter.post('/reset-password', wrap(async (req, res) => {
  requireSupabase();
  const token = String(req.body?.access_token || '');
  const password = String(req.body?.password || '');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'This reset link is invalid or has expired. Request a new one.');
  const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, { password });
  if (updateError) throw new HttpError(400, updateError.message);
  res.json(await signIn(data.user.email, password));
}));

authRouter.post('/refresh', wrap(async (req, res) => {
  requireSupabase();
  const refresh_token = String(req.body?.refresh_token || '');
  const { data, error } = await authClient().auth.refreshSession({ refresh_token });
  if (error || !data.session) throw new HttpError(401, 'Session expired. Please sign in again.');
  res.json({ session: sessionOut(data.session) });
}));

authRouter.get('/me', requireUser, (req, res) => {
  res.json({ profile: profileOut(req.user.profile) });
});

authRouter.patch('/me', requireUser, wrap(async (req, res) => {
  const { name, phone, gender, address } = req.body || {};
  const patch = {};
  if (typeof name === 'string') patch.name = name.trim().slice(0, 100);
  if (typeof phone === 'string') patch.phone = phone.trim().slice(0, 40);
  if (typeof gender === 'string' && (gender === '' || GENDERS.includes(gender))) patch.gender = gender || null;
  if (address && typeof address === 'object') {
    patch.address = Object.fromEntries(['address', 'city', 'zip', 'country'].map((k) => [k, String(address[k] || '').slice(0, 200)]));
  }
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', req.user.id).select().single();
  if (error) throw new HttpError(500, error.message);
  res.json({ profile: profileOut(data) });
}));

authRouter.get('/orders', requireUser, wrap(async (req, res) => {
  res.json(await getOrdersForUser(req.user.id));
}));
