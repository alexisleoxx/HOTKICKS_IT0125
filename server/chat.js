import OpenAI from 'openai';
import { peso, FREE_SHIPPING_OVER, SHIPPING_STANDARD, SHIPPING_EXPRESS } from '../shared/pricing.js';

const { OPENAI_API_KEY, OPENAI_MODEL = 'gpt-4o-mini' } = process.env;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

if (!openai) console.warn('[chat] OPENAI_API_KEY missing: chatbot is disabled.');

const catalogSummary = (products) =>
  products.map((p) =>
    `- ${p.name} (${p.model}) | ${p.category} | ${peso(p.price)} | colors: ${p.colors.map((c) => c.name).join(', ')}` +
    `${p.limited ? ` | LIMITED, ${p.stock} left` : ''} | ${p.tagline} | link: /product/${p.id}`
  ).join('\n');

const systemPrompt = (products) => `You are the HOTKICKS shopping assistant. HOTKICKS is a premium sneaker store (tagline: "STEP UP. STAND OUT.").
Be friendly, short and confident, with a streetwear tone. Help with product recommendations, sizing, shipping and returns.
Only recommend products from this catalog. When you mention one, include its link in markdown like [Blaze Runner 01](/product/hk-blaze-01).

CATALOG:
${catalogSummary(products)}

STORE POLICIES:
- US sizes 6 to 13. Most styles run true to size; for wide feet, suggest going up half a size.
- All prices are in Philippine pesos (PHP, ₱). Always quote prices in pesos.
- Free shipping on orders over ${peso(FREE_SHIPPING_OVER)}, otherwise ${peso(SHIPPING_STANDARD)}. Express (1 to 2 days) is +${peso(SHIPPING_EXPRESS)}.
- Free 30-day returns on unworn pairs. Every pair is verified authentic.
- Support: support@hotkicks.com

If you don't know something (such as an order's status), point the customer to support. Never make up products or prices.`;

export async function chatReply(messages, products) {
  if (!openai) {
    const err = new Error('Chatbot is not configured. Add OPENAI_API_KEY to .env.');
    err.status = 503;
    throw err;
  }
  // Keep only the last 12 user/assistant turns and cap their length
  const history = messages
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  const completion = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: 'system', content: systemPrompt(products) }, ...history],
    temperature: 0.6,
    max_tokens: 400,
  });
  return completion.choices[0]?.message?.content?.trim() || "Sorry, I couldn't come up with an answer. Try again?";
}
