import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, ChevronDown, CircleHelp, CreditCard, Goal, LayoutDashboard, LogOut, Menu, Moon, Plus, Sparkles, Sun, UserRound, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const links = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/expenses', label: 'Transactions', icon: CreditCard },
  { to: '/budgets', label: 'Budgets', icon: BarChart3 },
  { to: '/savings', label: 'Savings goals', icon: Goal },
  { to: '/smart-spending', label: 'Smart Spending', icon: Sparkles },
];

export default function Frame() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(localStorage.getItem('pennywise_theme') === 'dark');
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    localStorage.setItem('pennywise_theme', next ? 'dark' : 'light');
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
  }
  function signOut() { logout(); navigate('/login'); }
  return <div className="app-frame">
    {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><span className="brand-mark"><Wallet size={20} strokeWidth={2.4} /></span><span>pennywise<span className="brand-dot">.</span></span><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
      <p className="nav-caption">YOUR MONEY</p>
      <nav className="main-nav">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'Smart Spending' && <span className="nav-new"><Sparkles size={11} /></span>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-nudge"><span className="nudge-icon"><CircleHelp size={16} /></span><strong>Small steps count.</strong><span>Every choice helps you understand your money a little better.</span></div>
        <NavLink to="/profile" className={({ isActive }) => `account-link ${isActive ? 'account-active' : ''}`} onClick={() => setMobileOpen(false)}><span className="avatar">{user?.full_name?.slice(0, 1).toUpperCase() || 'Y'}</span><span className="account-name">{user?.full_name || 'Your account'}<small>Personal account</small></span><ChevronDown size={15} /></NavLink>
      </div>
    </aside>
    <main className="main-area"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="breadcrumb"><span>My space</span><span className="crumb-slash">/</span><span className="crumb-current">{links.find((item) => item.to === window.location.pathname)?.label || (window.location.pathname === '/profile' ? 'Profile' : 'Your money')}</span></div><div className="top-actions"><span className="privacy-note"><span className="privacy-dot" /> Private space</span><button className="icon-button theme-toggle" title={`Switch to ${dark ? 'light' : 'dark'} mode`} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`} onClick={toggleTheme}>{dark ? <Sun size={18} /> : <Moon size={18} />}</button><button className="top-profile" onClick={() => navigate('/profile')} title="Profile"><UserRound size={17} /></button></div></header><div className="page-content"><Outlet /></div></main>
    <button className="mobile-add" aria-label="Add transaction" onClick={() => navigate('/expenses?new=1')}><Plus size={22} /></button>
  </div>;
}