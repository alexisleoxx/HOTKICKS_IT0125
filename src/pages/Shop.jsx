import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import ProductCard from '../components/ProductCard.jsx';
import PageTransition from '../components/PageTransition.jsx';
import { CATEGORIES } from '../components/Navbar.jsx';
import { useProducts } from '../hooks/useProducts.js';

const SORTS = {
  featured: { label: 'Featured', fn: () => 0 },
  'price-asc': { label: 'Price: Low to High', fn: (a, b) => a.price - b.price },
  'price-desc': { label: 'Price: High to Low', fn: (a, b) => b.price - a.price },
  popular: { label: 'Best Selling', fn: (a, b) => b.sold - a.sold },
  rating: { label: 'Top Rated', fn: (a, b) => b.rating - a.rating },
};
const PRICES = { all: [0, Infinity], u6k: [0, 6000], '6k-10k': [6000, 10000], o10k: [10000, Infinity] };

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'All';
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'featured';
  const price = params.get('price') || 'all';
  const { products, loading } = useProducts({ category, q });

  const set = (key, value, def) => {
    const next = new URLSearchParams(params);
    if (value === def || !value) next.delete(key); else next.set(key, value);
    setParams(next, { replace: true });
  };

  const list = useMemo(() => {
    const [min, max] = PRICES[price] || PRICES.all;
    return products.filter((p) => p.price >= min && p.price < max).sort(SORTS[sort]?.fn || SORTS.featured.fn);
  }, [products, price, sort]);

  return (
    <PageTransition>
      <section className="shop">
        <header className="shop__head">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            {category === 'All' ? 'All Sneakers' : category}
          </motion.h1>
          <p>{loading ? 'Loading…' : `${list.length} styles`}{q && <> for “{q}” <button className="clear" onClick={() => set('q', '')}><X size={14} /> clear</button></>}</p>
        </header>

        <div className="shop__bar">
          <div className="chips">
            {['All', ...CATEGORIES].map((c) => (
              <button key={c} className={`chip ${category === c ? 'is-active' : ''}`} onClick={() => set('category', c, 'All')}>
                {category === c && <motion.span layoutId="shop-chip" className="chip__bg" />}
                <span>{c}</span>
              </button>
            ))}
          </div>
          <div className="shop__selects">
            <select value={price} onChange={(e) => set('price', e.target.value, 'all')} aria-label="Price range">
              <option value="all">Any price</option>
              <option value="u6k">Under ₱6,000</option>
              <option value="6k-10k">₱6,000 – ₱10,000</option>
              <option value="o10k">₱10,000+</option>
            </select>
            <select value={sort} onChange={(e) => set('sort', e.target.value, 'featured')} aria-label="Sort">
              {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        </div>

        {!loading && list.length === 0 ? (
          <div className="empty">
            <h3>No sneakers found</h3>
            <button className="btn btn--dark" onClick={() => setParams({})}>Reset filters</button>
          </div>
        ) : (
          <motion.div layout className="grid">
            {list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </motion.div>
        )}
      </section>
    </PageTransition>
  );
}
