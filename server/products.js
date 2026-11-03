// HOTKICKS product catalog (prices in Philippine pesos). Loaded into Supabase by `npm run seed`.
const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`;

const IMG = {
  red: img('1542291026-7eec264c27ff'),
  white: img('1600185365483-26d7a4cc7519'),
  blue: img('1606107557195-0e29a4b5b4aa'),
  green: img('1608231387042-66d1773070a5'),
  pink: img('1595950653106-6c9ebd614d3a'),
  grey: img('1549298916-b41d501d3772'),
  black: img('1597045566677-8cf032ed6634'),
  orange: img('1460353581641-37baddab0fa2'),
  classic: img('1525966222134-fcfa99b8ae77'),
  high: img('1551107696-a4b0c5a0d9a2'),
  vintage: img('1491553895911-0055eca6402d'),
  court: img('1560769629-975ec94e6a86'),
  street: img('1539185441755-769473a23570'),
  trail: img('1514989940723-e8e51635b782'),
  mono: img('1600269452121-4f2416e55c28'),
};

const SIZES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12, 13];

export const products = [
  {
    id: 'hk-blaze-01', name: 'Blaze Runner 01', model: 'HK-R01', category: 'Running',
    price: 8995, rating: 4.9, sold: 12840, isNew: true, limited: false,
    accent: '#e63b2e', bg: 'linear-gradient(135deg,#2a0b08 0%,#7a1a12 55%,#e63b2e 100%)',
    tagline: 'Built for speed. Born on the street.',
    description: 'A responsive foam midsole with a carbon-infused plate propels every stride. The engineered knit upper breathes and locks you in for long runs and late nights.',
    colors: [
      { name: 'Inferno Red', hex: '#e63b2e', images: [IMG.red, IMG.orange, IMG.street] },
      { name: 'Cloud White', hex: '#f1f1f1', images: [IMG.white, IMG.mono, IMG.classic] },
      { name: 'Midnight', hex: '#1b1b1b', images: [IMG.black, IMG.grey, IMG.high] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-aero-court', name: 'Aero Court Elite', model: 'HK-B22', category: 'Basketball',
    price: 10495, rating: 4.8, sold: 9310, isNew: false, limited: false,
    accent: '#2f6bff', bg: 'linear-gradient(135deg,#050c22 0%,#0f2a6b 55%,#2f6bff 100%)',
    tagline: 'Own the paint. Rule the court.',
    description: 'Dual-density cushioning and a reinforced heel counter deliver explosive take-offs and controlled landings. Herringbone traction grips every hardwood.',
    colors: [
      { name: 'Royal Blue', hex: '#2f6bff', images: [IMG.blue, IMG.court, IMG.high] },
      { name: 'Chalk', hex: '#e9e6df', images: [IMG.classic, IMG.white, IMG.mono] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-volt-trainer', name: 'Volt Trainer X', model: 'HK-T09', category: 'Training',
    price: 7495, rating: 4.7, sold: 7020, isNew: true, limited: false,
    accent: '#3ccf6e', bg: 'linear-gradient(135deg,#04170b 0%,#0f4a26 55%,#3ccf6e 100%)',
    tagline: 'Lift heavier. Move faster.',
    description: 'A wide, stable platform for heavy lifts with a flexible forefoot for agility work. Rope-guard sidewalls keep it fresh through every session.',
    colors: [
      { name: 'Volt Green', hex: '#3ccf6e', images: [IMG.green, IMG.trail, IMG.street] },
      { name: 'Graphite', hex: '#55585e', images: [IMG.grey, IMG.black, IMG.mono] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-bloom-low', name: 'Bloom Low', model: 'HK-L14', category: 'Lifestyle',
    price: 6495, rating: 4.8, sold: 15400, isNew: false, limited: false,
    accent: '#ff6fa8', bg: 'linear-gradient(135deg,#25070f 0%,#7a1f45 55%,#ff6fa8 100%)',
    tagline: 'Soft tones. Loud attitude.',
    description: 'Premium suede overlays on a soft leather base, finished with a cushioned cupsole. A day-to-night silhouette that goes with everything.',
    colors: [
      { name: 'Blush Pink', hex: '#ff6fa8', images: [IMG.pink, IMG.vintage, IMG.classic] },
      { name: 'Bone', hex: '#ece3d4', images: [IMG.mono, IMG.white, IMG.classic] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-phantom-ltd', name: 'Phantom Zero LTD', model: 'HK-X00', category: 'Limited Edition',
    price: 16995, rating: 5.0, sold: 2400, isNew: true, limited: true, stock: 87,
    accent: '#c9a45c', bg: 'linear-gradient(135deg,#0b0b0b 0%,#2a2416 55%,#c9a45c 100%)',
    tagline: 'Only 500 pairs. Ever.',
    description: 'Full-grain Italian leather, gold-plated aglets and a numbered heel tab. The Phantom Zero is HOTKICKS craftsmanship at its most uncompromising.',
    colors: [
      { name: 'Obsidian Gold', hex: '#c9a45c', images: [IMG.high, IMG.black, IMG.grey] },
      { name: 'Ghost', hex: '#d9d9d9', images: [IMG.mono, IMG.white, IMG.classic] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-retro-88', name: 'Retro 88', model: 'HK-L88', category: 'Lifestyle',
    price: 5995, rating: 4.6, sold: 11020, isNew: false, limited: false,
    accent: '#f2a03d', bg: 'linear-gradient(135deg,#1e1004 0%,#6b3c0c 55%,#f2a03d 100%)',
    tagline: 'Heritage lines. Modern soul.',
    description: 'An archive runner silhouette reborn with recycled mesh, a vintage-cream midsole and a gum rubber outsole.',
    colors: [
      { name: 'Sunset', hex: '#f2a03d', images: [IMG.orange, IMG.vintage, IMG.street] },
      { name: 'Classic Cream', hex: '#efe6d2', images: [IMG.vintage, IMG.classic, IMG.mono] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-trailhawk', name: 'Trailhawk GTX', model: 'HK-R31', category: 'Running',
    price: 9495, rating: 4.7, sold: 5400, isNew: true, limited: false,
    accent: '#8a6cff', bg: 'linear-gradient(135deg,#0d0820 0%,#2e2166 55%,#8a6cff 100%)',
    tagline: 'Any terrain. Any weather.',
    description: 'Waterproof membrane, aggressive 5mm lugs and a rock plate make the Trailhawk ready for mud, rock and rain.',
    colors: [
      { name: 'Ultraviolet', hex: '#8a6cff', images: [IMG.trail, IMG.street, IMG.green] },
      { name: 'Slate', hex: '#4b5563', images: [IMG.grey, IMG.black, IMG.trail] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-skyline-hi', name: 'Skyline Hi', model: 'HK-B07', category: 'Basketball',
    price: 8495, rating: 4.6, sold: 6800, isNew: false, limited: false,
    accent: '#ececec', bg: 'linear-gradient(135deg,#0c0c0c 0%,#2b2b2b 55%,#8c8c8c 100%)',
    tagline: 'Classic high-top. Zero compromise.',
    description: 'Padded high-top collar, full-length air cushioning and a durable leather upper. A court legend that never left the street.',
    colors: [
      { name: 'Triple White', hex: '#ececec', images: [IMG.white, IMG.court, IMG.classic] },
      { name: 'Shadow', hex: '#2b2b2b', images: [IMG.black, IMG.high, IMG.grey] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-eclipse-ltd', name: 'Eclipse Gold LTD', model: 'HK-X12', category: 'Limited Edition',
    price: 13995, rating: 4.9, sold: 1800, isNew: false, limited: true, stock: 142,
    accent: '#ff3d3d', bg: 'linear-gradient(135deg,#080808 0%,#3a0d0d 55%,#ff3d3d 100%)',
    tagline: 'Drop 012. Numbered release.',
    description: 'A reflective upper that shifts under light, with a translucent icy sole and a custom HOTKICKS dust bag.',
    colors: [
      { name: 'Blood Moon', hex: '#ff3d3d', images: [IMG.red, IMG.black, IMG.orange] },
    ],
    sizes: SIZES,
  },
  {
    id: 'hk-flex-core', name: 'Flex Core', model: 'HK-T15', category: 'Training',
    price: 5495, rating: 4.5, sold: 8900, isNew: false, limited: false,
    accent: '#22c3d6', bg: 'linear-gradient(135deg,#031417 0%,#0b4650 55%,#22c3d6 100%)',
    tagline: 'Everyday training, elevated.',
    description: 'Lightweight, flexible and ready for HIIT. A sock-like fit with a grippy multi-directional outsole.',
    colors: [
      { name: 'Aqua', hex: '#22c3d6', images: [IMG.street, IMG.blue, IMG.green] },
      { name: 'Onyx', hex: '#111111', images: [IMG.black, IMG.grey, IMG.mono] },
    ],
    sizes: SIZES,
  },
];
