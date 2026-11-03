import { AnimatePresence, motion } from 'framer-motion';
import { useShop } from '../hooks/useShop.js';

export default function Toast() {
  const { toast } = useShop();
  return (
    <AnimatePresence>
      {toast && (
        <motion.div key={toast.id} className="toast" role="status" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}>
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
