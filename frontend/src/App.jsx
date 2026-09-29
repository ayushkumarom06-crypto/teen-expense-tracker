import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Frame from './components/Frame.jsx';
import AuthPage from './components/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Expenses from './pages/Expenses.jsx';
import Budgets from './pages/Budgets.jsx';
import Savings from './pages/Savings.jsx';
import SmartSpending from './pages/SmartSpending.jsx';
import Profile from './pages/Profile.jsx';
import './styles.css';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><span className="loading-mark">p.</span><span>Getting your space ready…</span></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return <Routes><Route path="/login" element={<AuthPage key="login" mode="login" />} /><Route path="/register" element={<AuthPage key="register" mode="register" />} /><Route element={<Protected><Frame /></Protected>}><Route index element={<Dashboard />} /><Route path="expenses" element={<Expenses />} /><Route path="budgets" element={<Budgets />} /><Route path="savings" element={<Savings />} /><Route path="smart-spending" element={<SmartSpending />} /><Route path="profile" element={<Profile />} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}

export default function App() {
  document.documentElement.dataset.theme = localStorage.getItem('pennywise_theme') || 'light';
  return <BrowserRouter basename={import.meta.env.VITE_ROUTER_BASE || '/'}><AuthProvider><ToastProvider><AppRoutes /></ToastProvider></AuthProvider></BrowserRouter>;
}