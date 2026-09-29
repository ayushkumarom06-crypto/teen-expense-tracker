import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowDownUp, ArrowLeft, ArrowRight, CalendarDays, Check, ChevronDown, CircleAlert, Filter, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { api, queryString } from '../services/api';
import { dateOnly, money, today } from '../utils/format';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

const emptyForm = { amount: '', category_id: '', description: '', expense_date: today(), payment_method: 'UPI', notes: '' };
const methods = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer', 'Other'];

export default function Expenses() {
  const { user } = useAuth();
  const notify = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', payment: '', start: '', end: '', sort: 'expense_date', order: 'desc' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => { api('/categories').then(setCategories).catch((e) => setError(e.message)); }, []);
  useEffect(() => { if (searchParams.get('new') === '1') openNew(); }, [searchParams]);
  useEffect(() => {
    const timer = window.setTimeout(() => setFilters((current) => current.search === searchInput ? current : { ...current, search: searchInput } ), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    setLoading(true); setError('');
    api(`/expenses?${queryString({ ...filters, page, limit: 12 })}`).then((data) => { setItems(data.items); setResult(data); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [filters, page]);

  function openNew() {
    setEditing(null); setForm({ ...emptyForm, category_id: categories[0]?.id || '' }); setModal(true);
    if (searchParams.has('new')) setSearchParams({}, { replace: true });
  }
  function openEdit(item) {
    setEditing(item); setForm({ amount: item.amount, category_id: item.category_id, description: item.description, expense_date: item.expense_date, payment_method: item.payment_method, notes: item.notes || '' }); setModal(true);
  }
  function updateFilter(key, value) { setPage(1); setFilters((current) => ({ ...current, [key]: value })); }

  async function save(event) {
    event.preventDefault(); setBusy(true);
    try {
      const body = { ...form, amount: Number(form.amount) };
      await api(editing ? `/expenses/${editing.id}` : '/expenses', { method: editing ? 'PUT' : 'POST', body });
      notify(editing ? 'Transaction updated.' : 'Transaction added.'); setModal(false); setPage(1);
      const data = await api(`/expenses?${queryString({ ...filters, page: 1, limit: 12 })}`); setItems(data.items); setResult(data);
    } catch (e) { notify(e.message, 'error'); } finally { setBusy(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.description}”? This cannot be undone.`)) return;
    try { await api(`/expenses/${item.id}`, { method: 'DELETE' }); notify('Transaction deleted.'); setItems((current) => current.filter((entry) => entry.id !== item.id)); setResult((current) => ({ ...current, total: Math.max(0, current.total - 1) })); }
    catch (e) { notify(e.message, 'error'); }
  }

  return <div className="content-page">
    <div className="page-title-row"><div><span className="eyebrow">THE DETAILS</span><h1>Transactions<span className="hello-dot">.</span></h1><p>Your money in, out, and everything in between.</p></div><button className="button button-primary" onClick={openNew}><Plus size={17} /> Add transaction</button></div>
    <section className="panel transactions-panel"><div className="transaction-toolbar"><label className="search-box"><Search size={17} /><input aria-label="Search transactions" placeholder="Search what you spent on…" value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} />{searchInput && <button aria-label="Clear search" onClick={() => setSearchInput('')}><X size={15} /></button>}</label><div className="filter-control"><Filter size={15} /><select aria-label="Filter by category" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={14} /></div><div className="filter-control"><select aria-label="Filter by payment method" value={filters.payment} onChange={(e) => updateFilter('payment', e.target.value)}><option value="">All payments</option>{methods.map((method) => <option key={method}>{method}</option>)}</select><ChevronDown size={14} /></div><div className="sort-controls"><button className="icon-button sort-toggle" title="Switch sort direction" aria-label="Switch sort direction" onClick={() => updateFilter('order', filters.order === 'desc' ? 'asc' : 'desc')}><ArrowDown size={15} className={filters.order === 'asc' ? 'rotate-up' : ''} /></button><div className="filter-control"><ArrowDownUp size={14} /><select aria-label="Sort transactions" value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)}><option value="expense_date">Date</option><option value="amount">Amount</option></select><ChevronDown size={14} /></div></div></div>
      <div className="date-filter-row"><span><CalendarDays size={14} /> Date range</span><input aria-label="Start date" type="date" value={filters.start} onChange={(e) => updateFilter('start', e.target.value)} /><span className="date-to">to</span><input aria-label="End date" type="date" value={filters.end} min={filters.start || undefined} onChange={(e) => updateFilter('end', e.target.value)} />{(filters.start || filters.end) && <button className="clear-filter" onClick={() => { updateFilter('start', ''); updateFilter('end', ''); }}>Clear</button>}<span className="result-count">{loading ? 'Loading…' : `${result.total} ${result.total === 1 ? 'transaction' : 'transactions'}`}</span></div>
      {error && <div className="inline-error"><CircleAlert size={16} /> {error} <button onClick={() => setFilters({ ...filters })}>Try again</button></div>}
      <div className="table-wrap"><table className="transactions-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Payment</th><th className="amount-column">Amount</th><th aria-label="Actions" /></tr></thead><tbody>
        {loading ? <tr><td colSpan="6" className="table-state">Loading your transactions…</td></tr> : items.length ? items.map((item) => <tr key={item.id}><td className="transaction-date">{dateOnly(item.expense_date)}</td><td><div className="transaction-description"><span className="category-bubble">{item.categories?.name?.slice(0, 1) || '•'}</span><span>{item.description}{item.notes && <small className="transaction-note">{item.notes}</small>}</span></div></td><td><span className="category-label">{item.categories?.name || 'Other'}</span></td><td><span className="payment-label">{item.payment_method}</span></td><td className="amount-column"><strong className="expense-amount">−{money(item.amount, user?.currency)}</strong></td><td><div className="row-actions"><button className="icon-button" title="Edit transaction" aria-label={`Edit ${item.description}`} onClick={() => openEdit(item)}><Pencil size={15} /></button><button className="icon-button delete-button" title="Delete transaction" aria-label={`Delete ${item.description}`} onClick={() => remove(item)}><Trash2 size={15} /></button></div></td></tr>) : <tr><td colSpan="6"><div className="table-empty"><span className="empty-illustration"><Search size={22} /></span><strong>{filters.search || filters.category || filters.payment || filters.start ? 'Nothing matches those filters.' : 'No transactions yet.'}</strong><span>{filters.search || filters.category || filters.payment || filters.start ? 'Try a different search or clear a filter.' : 'Add your first expense to start seeing where your money goes.'}</span>{filters.search || filters.category || filters.payment || filters.start ? <button className="text-link" onClick={() => { setSearchInput(''); setFilters({ search: '', category: '', payment: '', start: '', end: '', sort: 'expense_date', order: 'desc' }); }}>Clear filters <X size={14} /></button> : <button className="button button-primary button-small" onClick={openNew}><Plus size={15} /> Add your first transaction</button>}</div></td></tr>}
      </tbody></table></div>
      <div className="pagination"><span>Showing {result.total ? (page - 1) * 12 + 1 : 0}–{Math.min(page * 12, result.total)} of {result.total}</span><div><button className="icon-button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}><ArrowLeft size={16} /></button><span className="page-count">{page} / {Math.max(1, result.pages)}</span><button className="icon-button" aria-label="Next page" disabled={page >= result.pages} onClick={() => setPage((current) => current + 1)}><ArrowRight size={16} /></button></div></div>
    </section>
    {modal && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title"><div className="modal-heading"><div><span className="eyebrow">A LITTLE MONEY NOTE</span><h2 id="expense-modal-title">{editing ? 'Edit transaction' : 'Add a transaction'}</h2></div><button className="icon-button" aria-label="Close dialog" onClick={() => setModal(false)}><X size={19} /></button></div><form className="form-stack modal-form" onSubmit={save}><div className="form-grid-two"><label className="field-label">Amount<input type="number" inputMode="decimal" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" /></label><label className="field-label">Date<input type="date" max={today()} required value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></label></div><label className="field-label">What was it for?<input maxLength={120} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Lunch with friends" /></label><div className="form-grid-two"><label className="field-label">Category<select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="" disabled>Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="field-label">Paid with<select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>{methods.map((method) => <option key={method}>{method}</option>)}</select></label></div><label className="field-label">A note, if you like <span className="optional-text">OPTIONAL</span><textarea rows="2" maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything you want to remember…" /></label><div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => setModal(false)}>Cancel</button><button className="button button-primary" disabled={busy || !categories.length}>{busy ? 'Saving…' : <><Check size={16} /> {editing ? 'Save changes' : 'Add transaction'}</>}</button></div></form></section></div>}
  </div>;
}