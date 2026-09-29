import { useState } from 'react';
import { ArrowRight, Check, LogOut, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const currencies = [['INR', 'INR · Indian rupee'], ['USD', 'USD · US dollar'], ['GBP', 'GBP · British pound'], ['EUR', 'EUR · Euro'], ['AUD', 'AUD · Australian dollar'], ['CAD', 'CAD · Canadian dollar']];

export default function Profile() {
  const { user, setUser, logout } = useAuth(); const notify = useToast(); const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: user?.full_name || '', monthly_allowance: user?.monthly_allowance ?? 0, currency: user?.currency || 'INR', budget_period: user?.budget_period || 'monthly' });
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault(); setBusy(true);
    try { const result = await api('/profile', { method: 'PATCH', body: { ...form, monthly_allowance: Number(form.monthly_allowance) } }); setUser(result.user); notify('Your profile is up to date.'); }
    catch (e) { notify(e.message, 'error'); } finally { setBusy(false); }
  }
  function signOut() { logout(); navigate('/login'); }
  return <div className="content-page profile-page"><div className="page-title-row"><div><span className="eyebrow">JUST FOR YOU</span><h1>Your profile<span className="hello-dot">.</span></h1><p>A few details to make your money picture feel like yours.</p></div></div>
    <div className="profile-layout"><section className="panel profile-main"><div className="profile-card-heading"><span className="profile-avatar"><UserRound size={24} /></span><div><h2>Personal details</h2><p>This information is private to your account.</p></div></div><form className="form-stack profile-form" onSubmit={save}><label className="field-label">Full name<input required minLength={2} maxLength={80} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label><label className="field-label">Email address<input type="email" value={user?.email || ''} disabled /><span className="field-hint">Email changes aren't available here yet.</span></label><label className="field-label">Monthly allowance or income<input type="number" min="0" step="0.01" inputMode="decimal" value={form.monthly_allowance} onChange={(e) => setForm({ ...form, monthly_allowance: e.target.value })} /><span className="field-hint">Used for your money overview. Set to zero if you prefer.</span></label><label className="field-label">Currency<select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>{currencies.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field-label">Preferred budget period<select value={form.budget_period} onChange={(e) => setForm({ ...form, budget_period: e.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><div className="profile-save-row"><button className="button button-primary" disabled={busy}>{busy ? 'Saving…' : <><Check size={16} /> Save changes</>}</button></div></form></section>
      <aside className="profile-side"><section className="panel privacy-card"><span className="privacy-card-icon"><ShieldCheck size={20} /></span><span className="eyebrow">YOUR DATA, YOURS</span><h3>Private by design.</h3><p>Your transactions and goals are only available to your signed-in account. We never put financial details in your shareable profile.</p><div className="privacy-status"><span className="privacy-dot" /> Account protected</div></section><section className="panel account-card"><span className="eyebrow">ACCOUNT</span><div><Wallet size={17} /><span>Signed in as<strong>{user?.email}</strong></span></div><button className="signout-button" onClick={signOut}><LogOut size={16} /> Sign out <ArrowRight size={15} /></button></section></aside></div>
  </div>;
}