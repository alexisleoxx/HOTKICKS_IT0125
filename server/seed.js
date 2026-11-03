// Loads server/products.js into the Supabase `products` table. Run: npm run seed
import { supabase, toRow } from './db.js';
import { products } from './products.js';

if (!supabase) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.');
  process.exit(1);
}

// ignoreDuplicates: products that already exist (and any admin edits to them) are left alone
const { data, error } = await supabase
  .from('products')
  .upsert(products.map(toRow), { onConflict: 'id', ignoreDuplicates: true })
  .select('id');
if (error) {
  console.error('Seed failed:', error.message);
  process.exit(1);
}
console.log(`Seeded ${data.length} new products into Supabase (${products.length - data.length} already existed).`);
