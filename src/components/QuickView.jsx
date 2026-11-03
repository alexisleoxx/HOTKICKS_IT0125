import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useShop } from '../hooks/useShop.js';
import { useLockBody } from '../hooks/useLockBody.js';
import ProductConfigurator from './ProductConfigurator.jsx';

export default function QuickView() {
  const { quickView, setQuickView } = useShop();
  useLockBody(!!quickView);
  const close = () => setQuickView(null);

  return (
    <AnimatePresence>
      {quickView && (
        <motion.div className="overlay overlay--center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${quickView.name} quick view`}
            initial={{ y: 60, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="modal__close" onClick={close} aria-label="Close"><X size={22} /></button>
            <ProductConfigurator product={quickView} compact onAdded={close} />
            <Link className="modal__more" to={`/product/${quickView.id}`} onClick={close}>View full details →</Link>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
