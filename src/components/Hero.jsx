import { useRef } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import ShoeImage from './ShoeImage.jsx';
import { peso } from '../../shared/pricing.js';

const HERO_IMG = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=85';
const words = ['STEP', 'INTO', 'YOUR', 'NEXT', 'LEVEL.'];

export default function Hero() {
  const navigate = useNavigate();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const yShoe = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const yText = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Mouse-driven 3D tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 120, damping: 15 });
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 15 });
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const scrollToSlider = () => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section className="hero" ref={ref} onMouseMove={onMove}>
      <div className="hero__glow hero__glow--a" />
      <div className="hero__glow hero__glow--b" />
      <div className="hero__grid" />
      <motion.div className="hero__bigword" style={{ y: yText }}>HOTKICKS</motion.div>

      <motion.div className="hero__content" style={{ y: yText, opacity: fade }}>
        <motion.span className="eyebrow" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.7 }}>
          HOTKICKS · FALL / WINTER 2026 DROP
        </motion.span>
        <h1 className="hero__title">
          {words.map((w, i) => (
            <span className="mask" key={w}>
              <motion.span initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: 1.8 + i * 0.1, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}>
                {w}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p className="hero__sub" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.4 }}>
          Discover the latest sneakers, explore exclusive drops, and find your next favorite pair. Your style starts here.
        </motion.p>
        <motion.div className="hero__ctas" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.6 }}>
          <button className="btn btn--primary" onClick={scrollToSlider}>EXPLORE COLLECTION <ArrowRight size={18} /></button>
          <button className="btn btn--ghost" onClick={() => navigate('/shop')}>SHOP NOW</button>
        </motion.div>
      </motion.div>

      <motion.div className="hero__shoe" style={{ y: yShoe, rotateX: rotX, rotateY: rotY }}
        initial={{ opacity: 0, scale: 0.6, rotate: -30, x: 200 }}
        animate={{ opacity: 1, scale: 1, rotate: -12, x: 0 }}
        transition={{ delay: 1.6, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div animate={{ y: [0, -22, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
          <ShoeImage src={HERO_IMG} alt="HOTKICKS Blaze Runner 01 in Inferno Red" loading="eager" />
        </motion.div>
        <div className="hero__shadow" />
      </motion.div>

      <motion.div className="hero__tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}>
        <span>Blaze Runner 01</span><span>{peso(8995)}</span>
      </motion.div>

      <button className="scroll-ind" onClick={scrollToSlider} aria-label="Scroll to featured sneakers">
        <span className="scroll-ind__mouse"><span /></span>
        SCROLL
      </button>
    </section>
  );
}
