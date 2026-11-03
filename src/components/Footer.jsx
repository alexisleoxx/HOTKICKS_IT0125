import { Link } from 'react-router-dom';
import { Instagram, Youtube, Twitter, Facebook } from 'lucide-react';
import { CATEGORIES } from './Navbar.jsx';
import { useShop } from '../hooks/useShop.js';

export default function Footer() {
  const { notify } = useShop();
  const help = (topic) => () => notify(`${topic}: support@hotkicks.com · 1-800-HOT-KICK`);

  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Link to="/" className="logo logo--lg">HOT<span>KICKS</span></Link>
          <p>STEP UP. STAND OUT.</p>
          <div className="footer__social">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a>
            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X"><Twitter size={18} /></a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><Youtube size={18} /></a>
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={18} /></a>
          </div>
        </div>
        <div className="footer__col">
          <h4>Shop</h4>
          <Link to="/shop">All Sneakers</Link>
          {CATEGORIES.map((c) => <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`}>{c}</Link>)}
        </div>
        <div className="footer__col">
          <h4>HOTKICKS</h4>
          <Link to="/#story">Our Story</Link>
          <Link to="/#new-arrivals">New Arrivals</Link>
          <Link to="/#limited">Limited Drops</Link>
          <Link to="/account">My Account</Link>
        </div>
        <div className="footer__col">
          <h4>Support</h4>
          <button onClick={help('Order status')}>Order Status</button>
          <button onClick={help('Shipping')}>Shipping & Delivery</button>
          <button onClick={help('Returns')}>Returns</button>
          <button onClick={help('Size guide')}>Size Guide</button>
          <button onClick={help('Contact')}>Contact Us</button>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© {new Date().getFullYear()} HOTKICKS. All rights reserved.</span>
        <div className="pay">
          {['VISA', 'MASTERCARD', 'AMEX', 'PAYPAL', 'APPLE PAY'].map((p) => <span key={p}>{p}</span>)}
        </div>
      </div>
    </footer>
  );
}
