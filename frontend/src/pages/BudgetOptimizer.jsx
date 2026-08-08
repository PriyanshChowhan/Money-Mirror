import React, { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const CATEGORY_LABELS = {
  groceries: 'Groceries',
  rent: 'Rent / Housing',
  utilities: 'Utilities',
  transportation: 'Transportation',
  healthcare: 'Healthcare',
  education: 'Education / Childcare',
  entertainment: 'Entertainment & Dining',
  subscriptions: 'Subscriptions',
  savings: 'Savings & Investments'
};

const STATUS_STYLE = {
  over_budget: { icon: TrendingUp, color: 'text-red-600', bar: 'bg-red-500' },
  under_budget: { icon: TrendingDown, color: 'text-emerald-600', bar: 'bg-emerald-500' },
  on_track: { icon: CheckCircle2, color: 'text-blue-600', bar: 'bg-blue-500' },
  'n/a': { icon: CheckCircle2, color: 'text-slate-400', bar: 'bg-slate-300' }
};

// Lets a user say "I earn ₹X/month, we're 2 adults + 2 kids in a metro" and
// get back a recommended monthly budget per category, benchmarked against
// real household spending data, compared side-by-side with what they're
// actually spending (pulled from their transaction history).
const BudgetOptimizer = () => {
  const [form, setForm] = useState({ monthlyIncome: '', adults: 2, children: 0, cityTier: 'metro' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadedExisting, setLoadedExisting] = useState(false);

  // Pre-fill from any previously saved preference
  useEffect(() => {
    axios
      .get('/api/insights/budget-optimizer', { withCredentials: true })
      .then((res) => {
        const pref = res.data.data;
        if (pref) {
          setForm({
            monthlyIncome: pref.monthlyIncome,
            adults: pref.adults,
            children: pref.children,
            cityTier: pref.cityTier || 'metro'
          });
        }
      })
      .catch((err) => console.error('Error loading budget preference:', err))
      .finally(() => setLoadedExisting(true));
  }, []);

  const runOptimizer = async (e) => {
    e?.preventDefault();
    if (!form.monthlyIncome || Number(form.monthlyIncome) <= 0) return;
    setLoading(true);
    try {
      const res = await axios.post(
        '/api/insights/budget-optimizer',
        {
          monthlyIncome: Number(form.monthlyIncome),
          adults: Number(form.adults),
          children: Number(form.children),
          cityTier: form.cityTier
        },
        { withCredentials: true }
      );
      setResult(res.data.data);
    } catch (err) {
      console.error('Error running budget optimizer:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run once if we loaded a saved preference
  useEffect(() => {
    if (loadedExisting && form.monthlyIncome && !result) {
      runOptimizer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedExisting]);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-slate-700" />
        <p className="text-sm font-medium text-slate-900">Budget optimizer</p>
      </div>
      <p className="text-xs text-slate-500 -mt-3">
        Tell us your income and household size - we'll recommend how much to spend
        per category and show you how your actual spending compares.
      </p>

      <form onSubmit={runOptimizer} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-xs text-slate-500 block mb-1">Monthly income (₹)</label>
          <input
            type="number"
            min="0"
            value={form.monthlyIncome}
            onChange={(e) => setForm({ ...form, monthlyIncome: e.target.value })}
            placeholder="e.g. 80000"
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Adults</label>
          <input
            type="number"
            min="1"
            value={form.adults}
            onChange={(e) => setForm({ ...form, adults: e.target.value })}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">Children</label>
          <input
            type="number"
            min="0"
            value={form.children}
            onChange={(e) => setForm({ ...form, children: e.target.value })}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">City tier</label>
          <select
            value={form.cityTier}
            onChange={(e) => setForm({ ...form, cityTier: e.target.value })}
            className="w-full border border-slate-200 rounded px-3 py-2 text-sm"
          >
            <option value="metro">Metro</option>
            <option value="tier2">Tier 2 city</option>
            <option value="tier3">Tier 3 / town</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="col-span-2 md:col-span-4 bg-slate-900 text-white text-sm rounded px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? 'Calculating…' : 'Get my recommended budget'}
        </button>
      </form>

      {result && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">Recommended total</p>
              <p className="text-lg font-semibold text-slate-900">₹{result.summary.totalRecommended.toLocaleString('en-IN')}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">Actual (last 30 days)</p>
              <p className="text-lg font-semibold text-slate-900">₹{result.summary.totalActual.toLocaleString('en-IN')}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3">
              <p className="text-xs text-slate-500">Unallocated after budget</p>
              <p className={`text-lg font-semibold ${result.summary.unallocated < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ₹{result.summary.unallocated.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(result.recommendations).map(([key, val]) => {
              if (val.status === 'n/a') return null;
              const style = STATUS_STYLE[val.status] || STATUS_STYLE.on_track;
              const Icon = style.icon;
              const pct = Math.min((val.actual / (val.recommended || 1)) * 100, 150);
              return (
                <div key={key} className="border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900">{CATEGORY_LABELS[key] || key}</p>
                    <div className={`flex items-center gap-1 text-xs ${style.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {val.diffPct > 0 ? '+' : ''}{val.diffPct}%
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{val.basis}</p>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div className={`h-full ${style.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Actual: ₹{val.actual.toLocaleString('en-IN')}</span>
                    <span>Recommended: ₹{val.recommended.toLocaleString('en-IN')}</span>
                  </div>
                  <p className={`text-xs mt-1 ${style.color}`}>{val.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetOptimizer;