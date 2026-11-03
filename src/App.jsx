import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Loader from './components/Loader.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import SearchOverlay from './components/SearchOverlay.jsx';
import QuickView from './components/QuickView.jsx';
import Toast from './components/Toast.jsx';
import Chatbot from './components/Chatbot.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductPage from './pages/ProductPage.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderConfirmed from './pages/OrderConfirmed.jsx';
import Account from './pages/Account.jsx';
import Login from './pages/Login.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import Inventory from './pages/admin/Inventory.jsx';
import AddStock from './pages/admin/AddStock.jsx';
import Orders from './pages/admin/Orders.jsx';
import Customers from './pages/admin/Customers.jsx';

// Scrolls to #hash targets (e.g. /#new-arrivals) or to top on page change
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 400);
      return () => clearTimeout(t);
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);
  return null;
}

function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="add-stock" element={<AddStock />} />
        <Route path="products" element={<Inventory mode="update" />} />
        <Route path="inventory" element={<Inventory mode="inventory" />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

function StoreApp() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1600); return () => clearTimeout(t); }, []);

  return (
    <>
      <AnimatePresence>{loading && <Loader key="loader" />}</AnimatePresence>
      <Navbar />
      {/* Keyed by path so each page remounts and replays its enter animation */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmed" element={<OrderConfirmed />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <QuickView />
      <Chatbot />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<StoreApp />} />
      </Routes>
      <Toast />
    </>
  );
}
