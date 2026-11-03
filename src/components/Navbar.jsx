import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, ShoppingBag, User, Menu, X, ChevronDown } from 'lucide-react';
import { useShop } from '../hooks/useShop.js';
import { useAuth } from '../hooks/useAuth.js';
import { useScrolled } from '../hooks/useScrolled.js';
import { useLockBody } from '../hooks/useLockBody.js';

export const CATEGORIES = ['Running', 'Basketball', 'Lifestyle', 'Training', 'Limited Edition'];

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Shop', to: '/shop', dropdown: true },
  { label: 'Collections', to: '/#collections' },
  { label: 'New Arrivals', to: '/#new-arrivals' },
  { label: 'About', to: '/#story' },
];

export default function Navbar() {
  const { totals, setCartOpen, setSearchOpen } = useShop();
  const { isAdmin } = useAuth();
  const scrolled = useScrolled(30);
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(false);
  const [drop, setDrop] = useState(false);
  useLockBody(mobile);
  useEffect(() => { setMobile(false); setDrop(false); }, [pathname]);

  const solid = scrolled || pathname !== '/';

  return (
    <header className={`nav ${solid ? 'nav--solid' : ''}`}>
      <div className="nav__inner">
        <Link to="/" className="logo" aria-label="HOTKICKS home">
          HOT<span>KICKS</span>
        </Link>

        <nav className="nav__links" aria-label="Main">
          {LINKS.map((l) =>
            l.dropdown ? (
              <div key={l.label} className="nav__drop" onMouseEnter={() => setDrop(true)} onMouseLeave={() => setDrop(false)}>
                <NavLink to={l.to} className="nav__link">
                  {l.label} <ChevronDown size={14} />
                </NavLink>
                <AnimatePresence>
                  {drop && (
                    <motion.div
                      className="dropdown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link to="/shop">All Sneakers</Link>
                      {CATEGORIES.map((c) => (
                        <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`}>{c}</Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink key={l.label} to={l.to} end className="nav__link">{l.label}</NavLink>
            )
          )}
        </nav>

        <div className="nav__icons">
          <button aria-label="Search" onClick={() => setSearchOpen(true)}><Search size={20} /></button>
          {isAdmin && <Link to="/admin" className="nav__admin" aria-label="Admin panel">ADMIN</Link>}
          <Link to="/account" aria-label="Account"><User size={20} /></Link>
          <button aria-label="Open bag" className="nav__cart" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={20} />
            <AnimatePresence>
              {totals.count > 0 && (
                <motion.span key={totals.count} className="badge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  {totals.count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button className="nav__burger" aria-label="Menu" onClick={() => setMobile(true)}><Menu size={22} /></button>
        </div>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div className="mobile-menu" initial={{ clipPath: 'circle(0% at 100% 0%)' }} animate={{ clipPath: 'circle(150% at 100% 0%)' }} exit={{ clipPath: 'circle(0% at 100% 0%)' }} transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}>
            <button className="mobile-menu__close" aria-label="Close menu" onClick={() => setMobile(false)}><X size={26} /></button>
            {[...LINKS, { label: 'Account', to: '/account' }].map((l, i) => (
              <motion.div key={l.label} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.07 }}>
                <Link to={l.to} onClick={() => setMobile(false)}>{l.label}</Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
