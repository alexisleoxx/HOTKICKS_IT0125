import { motion } from 'framer-motion';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Check } from 'lucide-react';
import PageTransition from '../components/PageTransition.jsx';
import { peso } from '../../shared/pricing.js';

export default function OrderConfirmed() {
  const { state } = useLocation();
  const order = state?.order;
  if (!order) return <Navigate to="/" replace />;

  return (
    <PageTransition>
      <section className="confirm">
        <motion.div className="confirm__check" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 12 }}>
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>You're all laced up.</motion.h1>
        <p>Thanks, {order.customer.name.split(' ')[0]}! Order <strong>{order.id}</strong> is confirmed. A receipt is on its way to {order.customer.email}.</p>
        <div className="confirm__card">
          {order.items.map((l) => (
            <div key={l.key} className="sum"><span>{l.qty} × {l.name} <small>({l.color}, US {l.size})</small></span><span>{peso(l.qty * l.price, { cents: true })}</span></div>
          ))}
          <div className="sum"><span>Shipping ({order.method})</span><span>{order.shipping ? peso(order.shipping) : 'Free'}</span></div>
          <div className="sum"><span>Tax</span><span>{peso(order.tax, { cents: true })}</span></div>
          <div className="sum sum--total"><span>Total paid</span><span>{peso(order.total, { cents: true })}</span></div>
          <p className="muted small">Shipping to {order.customer.address}, {order.customer.city} {order.customer.zip}</p>
        </div>
        <Link to="/shop" className="btn btn--dark">KEEP SHOPPING</Link>
      </section>
    </PageTransition>
  );
}
