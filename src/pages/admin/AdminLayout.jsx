import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, PencilLine, Boxes, ClipboardList, Users, LogOut, Store, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/add-stock', label: 'Add Stock', icon: PackagePlus },
  { to: '/admin/products', label: 'Update Products', icon: PencilLine },
  { to: '/admin/inventory', label: 'Check Inventory', icon: Boxes },
  { to: '/admin/orders', label: 'Order Status', icon: ClipboardList },
  { to: '/admin/customers', label: 'Customers', icon: Users },
];

export default function AdminLayout() {
  const { user, isAdmin, ready, signOut } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  if (!ready) return <div className="admin-loading"><div className="spinner" /></div>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin">
      <aside className={`admin__side ${open ? 'is-open' : ''}`}>
        <Link to="/admin" className="logo">HOT<span>KICKS</span><small>ADMIN</small></Link>
        <nav>
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="admin__link"><Icon size={18} /> {label}</NavLink>
          ))}
        </nav>
        <div className="admin__side-foot">
          <Link to="/" className="admin__link"><Store size={18} /> View store</Link>
          <button className="admin__link" onClick={signOut}><LogOut size={18} /> Sign out</button>
          <div className="admin__me">
            <span>{(user.name || user.email)[0].toUpperCase()}</span>
            <div><strong>{user.name || 'Admin'}</strong><small>{user.email}</small></div>
          </div>
        </div>
      </aside>
      {open && <div className="admin__scrim" onClick={() => setOpen(false)} />}

      <div className="admin__main">
        <header className="admin__top">
          <button className="admin__burger" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">{open ? <X size={20} /> : <Menu size={20} />}</button>
          <h2>{NAV.find((n) => (n.end ? pathname === n.to : pathname.startsWith(n.to)))?.label || 'Admin'}</h2>
        </header>
        <div className="admin__content"><Outlet /></div>
      </div>
    </div>
  );
}
