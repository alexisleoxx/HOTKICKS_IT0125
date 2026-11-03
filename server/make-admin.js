// Gives a user admin access.
//   npm run make-admin -- you@email.com              (existing account)
//   npm run make-admin -- you@email.com MyPassword1  (creates the account if needed)
import { supabase } from './supabase.js';

const [email, password] = process.argv.slice(2);
if (!supabase) { console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.'); process.exit(1); }
if (!email) { console.error('Usage: npm run make-admin -- you@email.com [password]'); process.exit(1); }

async function findUser(target) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (user || data.users.length < 200) return user;
  }
  return null;
}

try {
  let user = await findUser(email);
  if (!user) {
    if (!password) { console.error(`No account for ${email}. Pass a password to create one.`); process.exit(1); }
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name: 'Admin' } });
    if (error) throw error;
    user = data.user;
    console.log(`Created account ${email}.`);
  }
  const { error } = await supabase.from('profiles').upsert({ id: user.id, email: user.email, name: user.user_metadata?.name || 'Admin', role: 'admin' });
  if (error) throw error;
  console.log(`${email} is now an admin. Sign in at /admin/login`);
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
