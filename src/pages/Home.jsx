import { useMemo, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Hero from '../components/Hero.jsx';
import ShoeSlider from '../components/ShoeSlider.jsx';
import ProductCard from '../components/ProductCard.jsx';
import ShoeImage from '../components/ShoeImage.jsx';
import SectionHead from '../components/SectionHead.jsx';
import Newsletter from '../components/Newsletter.jsx';
import PageTransition from '../components/PageTransition.jsx';
import { CATEGORIES } from '../components/Navbar.jsx';
import { useProducts } from '../hooks/useProducts.js';
import { useShop } from '../hooks/useShop.js';
import { peso, FREE_SHIPPING_OVER } from '../../shared/pricing.js';

const FEATURED_IDS = ['hk-blaze-01', 'hk-aero-court', 'hk-volt-trainer', 'hk-bloom-low', 'hk-phantom-ltd', 'hk-trailhawk'];

function Marquee() {
  const items = [`FREE SHIPPING OVER ${peso(FREE_SHIPPING_OVER)}`, 'NEW DROPS EVERY FRIDAY', 'STEP UP. STAND OUT.', '100% AUTHENTIC', 'MEMBERS GET EARLY ACCESS'];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee__track">
        {[...items, ...items, ...items].map((t, i) => <span key={i}>{t} <b>✦</b></span>)}
      </div>
    </div>
  );
}

function Collections({ products }) {
  const [cat, setCat] = useState('All');
  const list = cat === 'All' ? products : products.filter((p) => p.category === cat);
  return (
    <section id="collections" className="section">
      <SectionHead eyebrow="FEATURED COLLECTIONS" title="Find your fit.">
        <div className="chips" role="tablist">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} role="tab" aria-selected={cat === c} className={`chip ${cat === c ? 'is-active' : ''}`} onClick={() => setCat(c)}>
              {cat === c && <motion.span layoutId="chip-bg" className="chip__bg" />}
              <span>{c}</span>
            </button>
          ))}
        </div>
      </SectionHead>
      <motion.div layout className="grid">
        {list.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </motion.div>
      <div className="center"><Link to={cat === 'All' ? '/shop' : `/shop?category=${encodeURIComponent(cat)}`} className="btn btn--dark">VIEW ALL {cat === 'All' ? '' : cat.toUpperCase()} <ArrowRight size={18} /></Link></div>
    </section>
  );
}

function CategoryTiles({ products }) {
  const navigate = useNavigate();
  return (
    <section className="section tiles">
      {CATEGORIES.map((c, i) => {
        const p = products.find((x) => x.category === c);
        if (!p) return null;
        return (
          <motion.button key={c} className="tile" style={{ background: p.bg }} onClick={() => navigate(`/shop?category=${encodeURIComponent(c)}`)}
            initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.7 }}>
            <ShoeImage src={p.colors[0].images[0]} alt="" />
            <span className="tile__label">{c}</span>
            <span className="tile__go"><ArrowRight size={18} /></span>
          </motion.button>
        );
      })}
    </section>
  );
}

function BestSellers({ products }) {
  const top = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);
  return (
    <section className="section section--grey">
      <SectionHead eyebrow="BEST SELLERS" title="The ones everyone wants." />
      <div className="grid">
        {top.map((p, i) => <ProductCard key={p.id} product={p} rank={i + 1} index={i} />)}
      </div>
    </section>
  );
}

function LimitedEdition({ products }) {
  const { addToCart } = useShop();
  const navigate = useNavigate();
  const limited = products.filter((p) => p.limited);
  return (
    <section id="limited" className="limited">
      <div className="limited__head">
        <span className="eyebrow">HOTKICKS VAULT</span>
        <h2>LIMITED<br /><em>EDITION</em></h2>
        <p>Numbered releases. Small batches. Once they're gone, they're gone.</p>
      </div>
      <div className="limited__list">
        {limited.map((p, i) => (
          <motion.div key={p.id} className="lcard" initial={{ opacity: 0, x: i % 2 ? 80 : -80 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
            <div className="lcard__img" style={{ '--accent': p.accent }}>
              <ShoeImage src={p.colors[0].images[0]} alt={p.name} />
            </div>
            <div className="lcard__info">
              <span className="lcard__no">DROP {p.model}</span>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="lcard__stock"><span style={{ width: `${Math.round((p.stock / 500) * 100)}%`, background: p.accent }} /></div>
              <small>{p.stock} of 500 pairs remaining</small>
              <div className="lcard__ctas">
                <span className="lcard__price">{peso(p.price)}</span>
                <button className="btn btn--light" onClick={() => addToCart(p)}>SECURE A PAIR</button>
                <button className="btn btn--text btn--text-light" onClick={() => navigate(`/product/${p.id}`)}>Details →</button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function BrandStory() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [80, -120]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-40, 120]);
  return (
    <section id="story" className="story">
      <div className="story__text">
        <span className="eyebrow eyebrow--dark">OUR STORY</span>
        <motion.h2 initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
          Born on the court.<br />Raised on the street.
        </motion.h2>
        <p>HOTKICKS started in 2014 as a 200-square-foot shop with one rule: only sell what we'd wear ourselves. A decade later we're still obsessed with the details: the stitch count, the foam, the way a colorway catches the light.</p>
        <p>Every pair we carry is verified authentic, and every drop is curated by people who live sneaker culture.</p>
        <div className="story__stats">
          <div><strong>12</strong><span>Years in the game</span></div>
          <div><strong>480K</strong><span>Pairs delivered</span></div>
          <div><strong>4.9★</strong><span>Customer rating</span></div>
        </div>
      </div>
      <div className="story__media">
        <motion.div className="story__img story__img--a" style={{ y: y1 }}>
          <ShoeImage src="https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&w=900&q=80" alt="Sneaker store wall" />
        </motion.div>
        <motion.div className="story__img story__img--b" style={{ y: y2 }}>
          <ShoeImage src="https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80" alt="Sneakers on the street" />
        </motion.div>
      </div>
    </section>
  );
}

export default function Home() {
  const { products, loading, error } = useProducts();
  const featured = useMemo(() => FEATURED_IDS.map((id) => products.find((p) => p.id === id)).filter(Boolean), [products]);
  const newest = products.filter((p) => p.isNew);

  return (
    <PageTransition>
      <Hero />
      <Marquee />
      {error && <p className="error-box">Couldn't reach the HOTKICKS API. Is the server running? ({error.message})</p>}
      {!loading && !error && products.length === 0 && (
        <section className="section empty">
          <span className="eyebrow eyebrow--dark">HOTKICKS</span>
          <h3>New drops are on the way.</h3>
          <p className="muted">Our shelves are being restocked. Check back soon, or join the list below to hear first.</p>
        </section>
      )}
      {!loading && products.length > 0 && (
        <>
          <ShoeSlider products={featured} />
          <Collections products={products} />
          <CategoryTiles products={products} />
          <section id="new-arrivals" className="section">
            <SectionHead eyebrow="NEW ARRIVALS" title="Fresh out the box.">
              <Link to="/shop" className="btn btn--text">Shop all new →</Link>
            </SectionHead>
            <div className="grid">{newest.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div>
          </section>
          <BestSellers products={products} />
          <LimitedEdition products={products} />
          <BrandStory />
        </>
      )}
      <Newsletter />
    </PageTransition>
  );
}
