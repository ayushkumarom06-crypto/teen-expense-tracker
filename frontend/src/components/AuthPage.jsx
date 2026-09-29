import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Eye, EyeOff, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';

export default function AuthPage({ mode }) {
  const registering = mode === 'register';
  const { user, login, register } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  if (user) return <Navigate to="/" replace />;
  async function submit(event) {
    event.preventDefault(); setError('');
    if (registering && form.password !== form.confirm) return setError('Those passwords do not match yet.');
    if (registering && (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password))) return setError('Use at least 8 characters, including a letter and a number.');
    setBusy(true);
    try {
      if (registering) await register(form.fullName, form.email, form.password);
      else await login(form.email, form.password);
      notify(registering ? 'Your account is ready. Welcome!' : 'Welcome back!');
      navigate('/');
    } catch (caught) { setError(caught.message); } finally { setBusy(false); }
  }
  return <main className="auth-screen"><section className="auth-aside"><Link to="/login" className="brand auth-brand"><span className="brand-mark"><Wallet size={20} /></span><span>pennywise<span className="brand-dot">.</span></span></Link><div className="auth-message"><span className="eyebrow-light"><span /> YOUR MONEY, IN FOCUS</span><h1>A little more<br />clarity. A lot<br /><em>more you.</em></h1><p>Keep track of what comes in, what goes out, and what matters to you.</p><div className="auth-aside-footer"><span className="tiny-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></span><span>Built for real life, one choice at a time.</span></div></div><div className="aside-orbit orbit-one" /><div className="aside-orbit orbit-two" /></section>
    <section className="auth-panel"><div className="auth-panel-inner"><div className="auth-mobile-brand brand"><span className="brand-mark"><Wallet size={20} /></span><span>pennywise<span className="brand-dot">.</span></span></div><span className="eyebrow">{registering ? 'START WITH A CLEAN SLATE' : 'GOOD TO SEE YOU AGAIN'}</span><h2>{registering ? 'Make it yours.' : 'Pick up where you left off.'}</h2><p className="auth-subtitle">{registering ? 'A clearer picture of your money starts here.' : 'Your money picture is right where you left it.'}</p>
      <form className="form-stack" onSubmit={submit}>
        {registering && <label className="field-label">Your name<input autoComplete="name" required maxLength={80} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Sam Patel" /></label>}
        <label className="field-label">Email address<input type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
        <label className="field-label">Password<div className="password-wrap"><input type={showPassword ? 'text' : 'password'} autoComplete={registering ? 'new-password' : 'current-password'} minLength={registering ? 8 : 1} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={registering ? 'At least 8 characters' : 'Your password'} /><button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        {registering && <label className="field-label">Confirm password<input type="password" autoComplete="new-password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="Type it once more" /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'One moment…' : registering ? 'Create your account' : 'Sign in'}<ArrowUpRight size={17} /></button>
      </form><p className="auth-switch">{registering ? 'Already tracking with us?' : 'New to pennywise?'} <Link to={registering ? '/login' : '/register'}>{registering ? 'Sign in' : 'Create an account'}</Link></p><p className="auth-privacy">Your money details stay private to your account.</p></div></section></main>;
}