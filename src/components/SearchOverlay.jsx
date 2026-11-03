import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import ShoeImage from './ShoeImage.jsx';
import { useShop } from '../hooks/useShop.js';
import { useProducts } from '../hooks/useProducts.js';
import { useLockBody } from '../hooks/useLockBody.js';
import { peso } from '../../shared/pricing.js';

const POPULAR = ['Running', 'Basketball', 'LTD', 'Retro', 'Trainer'];

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useShop();
  const [q, setQ] = useState('');
  const { products } = useProducts();
  const navigate = useNavigate();
  const input = useRef(null);
  useLockBody(searchOpen);

  useEffect(() => {
    if (searchOpen) setTimeout(() => input.current?.focus(), 200);
    else setQ('');
    const onKey = (e) => e.key === 'Escape' && setSearchOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, setSearchOpen]);

  const s = q.trim().toLowerCase();
  const results = s ? products.filter((p) => `${p.name} ${p.model} ${p.category}`.toLowerCase().includes(s)) : [];
  const go = (path) => { setSearchOpen(false); navigate(path); };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div className="search" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ y: '-100%' }} transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}>
          <button className="search__close" onClick={() => setSearchOpen(false)} aria-label="Close search"><X size={26} /></button>
          <form className="search__bar" onSubmit={(e) => { e.preventDefault(); if (s) go(`/shop?q=${encodeURIComponent(q.trim())}`); }}>
            <Search size={28} />
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search sneakers, models, categories…" aria-label="Search" />
          </form>
          {!s && (
            <div className="search__popular">
              <span>Popular:</span>
              {POPULAR.map((t) => <button key={t} onClick={() => setQ(t)}>{t}</button>)}
            </div>
          )}
          <div className="search__results">
            {s && results.length === 0 && <p className="search__none">No sneakers match “{q}”.</p>}
            {results.map((p, i) => (
              <motion.button key={p.id} className="search__item" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} onClick={() => go(`/product/${p.id}`)}>
                <ShoeImage src={p.colors[0].images[0]} alt="" />
                <div><strong>{p.name}</strong><span>{p.category} · {peso(p.price)}</span></div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
