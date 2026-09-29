import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Check, CircleAlert, Pencil, Plus, Sparkles, Trash2, Wallet, X } from 'lucide-react';
import { api } from '../services/api';
import { money, today } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  return { start, end };
}

export default function Budgets() {
  const { user } = useAuth(); const notify = useToast();
  const [items, setItems] = useState([]); const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [modal, setModal] = useState(false); const [editing, setEditing] = useState(null); const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ category_id: '', amount: '', period: 'monthly', ...monthBounds() });

  async function load() {
    setLoading(true); setError('');
    try { const [budgets, cats] = await Promise.all([api('/budgets'), api('/categories')]); setItems(budgets); setCategories(cats); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  function open(item) {
    setEditing(item || null);
    setForm(item ? { category_id: item.category_id, amount: item.amount, period: item.period, start_date: item.start_date, end_date: item.end_date } : { category_id: categories[0]?.id || '', amount: '', period: 'monthly', ...monthBounds() });
    setModal(true);
  }
  async function save(event) {
    event.preventDefault(); setBusy(true);
    try { await api(editing ? `/budgets/${editing.id}` : '/budgets', { method: editing ? 'PUT' : 'POST', body: { ...form, amount: Number(form.amount) } }); notify(editing ? 'Budget updated.' : 'Budget created.'); setModal(false); await load(); }
    catch (e) { notify(e.message, 'error'); } finally { setBusy(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete the ${item.categories?.name || ''} budget?`)) return;
    try { await api(`/budgets/${item.id}`, { method: 'DELETE' }); notify('Budget deleted.'); setItems((current) => current.filter((entry) => entry.id !== item.id)); }
    catch (e) { notify(e.message, 'error'); }
  }
  const totalBudget = items.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalSpent = items.reduce((sum, item) => sum + (Number(item.spent) || 0), 0);
  return <div className="content-page"><div className="page-title-row"><div><span className="eyebrow">PLAN A LITTLE AHEAD</span><h1>Budgets<span className="hello-dot">.</span></h1><p>Give your spending a gentle boundary, not a hard rule.</p></div><button className="button button-primary" onClick={() => open()}><Plus size={17} /> New budget</button></div>
    <section className="budget-summary-strip"><div className="budget-summary-item"><span>Set aside for spending</span><strong>{money(totalBudget, user?.currency)}</strong></div><div className="budget-summary-divider" /><div className="budget-summary-item"><span>Spent across budgets</span><strong>{money(totalSpent, user?.currency)}</strong></div><div className="budget-summary-item budget-summary-note"><Sparkles size={16} /><span>Budgets are a guide. Adjust them as life changes.</span></div></section>
    {error && <div className="inline-error"><CircleAlert size={16} /> {error} <button onClick={load}>Try again</button></div>}
    {loading ? <div className="panel loading-panel">Loading your budgets…</div> : items.length ? <section className="budget-cards">{items.map((item, index) => <article className="panel budget-card" key={item.id}><div className="budget-card-top"><span className={`budget-symbol budget-color-${index % 5}`}>{item.categories?.name?.slice(0, 1) || 'B'}</span><div className="budget-card-actions"><button className="icon-button" aria-label={`Edit ${item.categories?.name} budget`} onClick={() => open(item)}><Pencil size={15} /></button><button className="icon-button delete-button" aria-label={`Delete ${item.categories?.name} budget`} onClick={() => remove(item)}><Trash2 size={15} /></button></div></div><div className="budget-card-label"><h2>{item.categories?.name}</h2><span>{item.period} budget</span></div><div className="budget-amount-line"><strong>{money(item.spent || 0, user?.currency)}</strong><span>of {money(item.amount, user?.currency)}</span></div><div className="progress-track progress-large"><span className={item.percentage > 100 ? 'progress-over' : ''} style={{ width: `${Math.min(100, item.percentage || 0)}%` }} /></div><div className="budget-card-bottom"><span className={item.percentage > 100 ? 'over-budget' : ''}>{item.percentage > 100 ? `Over by ${money(item.spent - item.amount, user?.currency)}` : `${item.percentage || 0}% used`}</span><span>{item.percentage > 100 ? 'A fresh start next period' : `${money(Math.max(0, item.amount - (item.spent || 0)), user?.currency)} left`}</span></div><div className="budget-dates"><CalendarDays size={13} /> {item.start_date} <span>→</span> {item.end_date}</div></article>)}</section> : <section className="panel big-empty"><span className="empty-illustration"><Wallet size={25} /></span><h2>A little plan goes a long way.</h2><p>Create a category budget to get a clearer sense of where your spending is headed.</p><button className="button button-primary" onClick={() => open()}><Plus size={16} /> Create your first budget</button></section>}
    {!loading && items.length > 0 && <div className="budget-footnote"><Sparkles size={16} /><span>Going over isn't a failure. It's just information to help you make a plan that fits.</span><ArrowRight size={15} /></div>}
    {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title"><div className="modal-heading"><div><span className="eyebrow">MAKE A LITTLE PLAN</span><h2 id="budget-modal-title">{editing ? 'Edit budget' : 'Create a budget'}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={() => setModal(false)}><X size={19} /></button></div><form className="form-stack modal-form" onSubmit={save}><label className="field-label">Category<select value={form.category_id} required onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="" disabled>Choose a category</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label className="field-label">Spending limit<input type="number" min="0.01" step="0.01" inputMode="decimal" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="e.g. 2500" /></label><label className="field-label">Budget period<select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><div className="form-grid-two"><label className="field-label">Starts<input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></label><label className="field-label">Ends<input type="date" min={form.start_date} required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></label></div><div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => setModal(false)}>Cancel</button><button className="button button-primary" disabled={busy || !categories.length}>{busy ? 'Saving…' : <><Check size={16} /> {editing ? 'Save changes' : 'Create budget'}</>}</button></div></form></section></div>}
  </div>;
}