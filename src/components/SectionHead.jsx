import { motion } from 'framer-motion';

// The in-view trigger sits on the heading itself: the sliding text starts clipped
// by .mask, so observing the text would never report it as visible.
const reveal = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } },
};

export default function SectionHead({ eyebrow, title, children, light }) {
  return (
    <div className={`shead ${light ? 'shead--light' : ''}`}>
      <div>
        <motion.span className="eyebrow eyebrow--dark" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>{eyebrow}</motion.span>
        <motion.h2 className="shead__title" initial="hidden" whileInView="show" viewport={{ once: true, margin: '-40px' }}>
          <span className="mask">
            <motion.span variants={reveal}>{title}</motion.span>
          </span>
        </motion.h2>
      </div>
      {children}
    </div>
  );
}
