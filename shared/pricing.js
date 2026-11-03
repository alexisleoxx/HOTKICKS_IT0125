// HOTKICKS pricing rules, in Philippine pesos (PHP).
// Shared by the React app and the Node server so totals always match.

export const CURRENCY = 'PHP';
export const FREE_SHIPPING_OVER = 5000; // ₱5,000
export const SHIPPING_STANDARD = 150;   // ₱150, 3–5 business days
export const SHIPPING_EXPRESS = 300;    // ₱300 extra, 1–2 business days
export const TAX_RATE = 0.08;

const fmt = (digits) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const whole = fmt(0);
const cents = fmt(2);

// peso(8995) → "₱8,995"   peso(9714.6, { cents: true }) → "₱9,714.60"
// Whole numbers drop the centavos unless { cents: true } is passed (use it for totals).
export function peso(amount, { cents: forceCents = false } = {}) {
  const n = Number(amount) || 0;
  const showCents = forceCents || !Number.isInteger(n);
  return '₱' + (showCents ? cents : whole).format(n);
}

export const shippingFor = (subtotal) => (subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_STANDARD);
export const taxFor = (subtotal) => +(subtotal * TAX_RATE).toFixed(2);
