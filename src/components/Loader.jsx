import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <motion.div
      className="loader"
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="loader__word">
        {'HOTKICKS'.split('').map((ch, i) => (
          <motion.span key={i} initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            {ch}
          </motion.span>
        ))}
      </div>
      <motion.div className="loader__bar" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.4, ease: 'easeInOut' }} />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>STEP UP. STAND OUT.</motion.p>
    </motion.div>
  );
}
