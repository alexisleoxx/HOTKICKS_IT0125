import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play, ShoppingBag } from 'lucide-react';
import ShoeImage from './ShoeImage.jsx';
import { useShop } from '../hooks/useShop.js';
import { useAutoplay } from '../hooks/useAutoplay.js';
import { peso } from '../../shared/pricing.js';

const DELAY = 6500;
const ease = [0.76, 0, 0.24, 1];

const shoeVariants = {
  enter: (dir) => ({ x: dir > 0 ? '70vw' : '-70vw', rotate: dir > 0 ? 35 : -35, scale: 0.5, opacity: 0 }),
  center: { x: 0, rotate: -14, scale: 1, opacity: 1, transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ x: dir > 0 ? '-80vw' : '80vw', rotate: dir > 0 ? -50 : 50, scale: 0.6, opacity: 0, transition: { duration: 0.8, ease } }),
};

const textParent = { center: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } }, exit: { transition: { staggerChildren: 0.03 } } };
const textChild = {
  enter: { y: 60, opacity: 0 },
  center: { y: 0, opacity: 1, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
  exit: { y: -40, opacity: 0, transition: { duration: 0.35 } },
};

export default function ShoeSlider({ products }) {
  const navigate = useNavigate();
  const { addToCart } = useShop();
  const [[index, dir], setState] = useState([0, 1]);
  const [colorIdx, setColorIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);

  const count = products.length;
  const go = useCallback((d) => {
    setState(([i]) => [(i + d + count) % count, d]);
    setColorIdx(0);
  }, [count]);
  const goTo = (i) => { if (i !== index) { setState([i, i > index ? 1 : -1]); setColorIdx(0); } };

  useAutoplay(() => go(1), DELAY, paused || hover, index);

  if (!count) return null;
  const p = products[index];
  const color = p.colors[colorIdx] || p.colors[0];

  const onDragEnd = (_, info) => {
    if (info.offset.x < -80 || info.velocity.x < -500) go(1);
    else if (info.offset.x > 80 || info.velocity.x > 500) go(-1);
  };

  return (
    <section
      id="featured"
      className="slider"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); }}
      tabIndex={0}
      aria-roledescription="carousel"
      aria-label="Featured sneakers"
    >
      {/* Background morph: each new gradient is revealed with an expanding circle */}
      <AnimatePresence initial={false}>
        <motion.div
          key={p.id}
          className="slider__bg"
          style={{ background: p.bg }}
          initial={{ clipPath: 'circle(0% at 65% 50%)' }}
          animate={{ clipPath: 'circle(150% at 65% 50%)', transition: { duration: 1.2, ease } }}
          exit={{ opacity: 1, transition: { duration: 1.2 } }}
        />
      </AnimatePresence>
      <div className="slider__noise" />

      {/* Giant outlined model name with parallax */}
      <AnimatePresence initial={false} custom={dir}>
        <motion.div
          key={p.id + '-ghost'}
          className="slider__ghost"
          custom={dir}
          initial={{ x: dir > 0 ? 300 : -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1, transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] } }}
          exit={{ x: dir > 0 ? -300 : 300, opacity: 0, transition: { duration: 0.8 } }}
        >
          {p.model}
        </motion.div>
      </AnimatePresence>

      <div className="slider__inner">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={p.id} className="slider__text" variants={textParent} initial="enter" animate="center" exit="exit">
            <motion.span variants={textChild} className="eyebrow">
              {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')} · {p.category}
            </motion.span>
            <motion.h2 variants={textChild} className="slider__name">{p.name}</motion.h2>
            <motion.p variants={textChild} className="slider__tagline">{p.tagline}</motion.p>
            <motion.p variants={textChild} className="slider__desc">{p.description}</motion.p>
            <motion.div variants={textChild} className="slider__meta">
              <span className="slider__price">{peso(p.price)}</span>
              <div className="swatches" role="radiogroup" aria-label="Color">
                {p.colors.map((c, i) => (
                  <button
                    key={c.name}
                    role="radio"
                    aria-checked={i === colorIdx}
                    title={c.name}
                    className={`swatch ${i === colorIdx ? 'is-active' : ''}`}
                    style={{ background: c.hex }}
                    onClick={() => setColorIdx(i)}
                  />
                ))}
                <span className="swatches__label">{color.name}</span>
              </div>
            </motion.div>
            <motion.div variants={textChild} className="slider__ctas">
              <button className="btn btn--light" onClick={() => navigate(`/product/${p.id}`)}>VIEW DETAILS</button>
              <button className="btn btn--outline" onClick={() => addToCart(p, { color })}>
                <ShoppingBag size={18} /> ADD TO CART
              </button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <motion.div className="slider__stage" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.35} onDragEnd={onDragEnd}>
          <div className="slider__ring" style={{ borderColor: p.accent }} />
          <AnimatePresence initial={false} custom={dir}>
            <motion.div key={p.id} className="slider__shoe" custom={dir} variants={shoeVariants} initial="enter" animate="center" exit="exit">
              <AnimatePresence mode="wait">
                <motion.div key={color.name} initial={{ opacity: 0, scale: 0.9, rotate: 6 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.4 }}>
                  <motion.div animate={{ y: [0, -18, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}>
                    <ShoeImage src={color.images[0]} alt={`${p.name} in ${color.name}`} />
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
          <div className="slider__shadow" />
        </motion.div>
      </div>

      <div className="slider__controls">
        <div className="slider__dots">
          {products.map((x, i) => (
            <button key={x.id} className={`dot ${i === index ? 'is-active' : ''}`} onClick={() => goTo(i)} aria-label={`Go to ${x.name}`}>
              {i === index && (
                <motion.span
                  key={`${index}-${paused || hover}`}
                  className="dot__fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: paused || hover ? 0.0 : 1 }}
                  transition={{ duration: paused || hover ? 0.2 : DELAY / 1000, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
        <div className="slider__arrows">
          <button onClick={() => setPaused((v) => !v)} aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}>
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
          <button onClick={() => go(-1)} aria-label="Previous sneaker"><ChevronLeft size={22} /></button>
          <button onClick={() => go(1)} aria-label="Next sneaker"><ChevronRight size={22} /></button>
        </div>
      </div>
    </section>
  );
}
