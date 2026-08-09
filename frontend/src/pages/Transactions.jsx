import axios from 'axios';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, ArrowUpDown, IndianRupee, RefreshCw, Loader2 } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';

const PERIODS = [
  { label: 'Last 12 months', value: 'last-12-months' },
  { label: 'Last month', value: 'last-month' },
  { label: 'This month', value: 'this-month' },
];

const SORT_OPTIONS = [
  { label: 'Newest first', value: 'date-desc' },
  { label: 'Oldest first', value: 'date-asc' },
  { label: 'Amount: high to low', value: 'amount-desc' },
  { label: 'Amount: low to high', value: 'amount-asc' },
];

const Transactions = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('last-12-months');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  const { status, isSyncing, triggerManualSync } = useSyncStatus();
  const [wasSyncing, setWasSyncing] = useState(false);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    axios
      // Bug fix: the previous version of this call used a plain string with
      // "${selectedPeriod}" inside double quotes (not a template literal),
      // so the period filter was silently never actually applied — every
      // request sent the literal text "${selectedPeriod}" as the query value.
      .get(`/api/transactions/getTransactionsByRange?range=${selectedPeriod}`, {
        withCredentials: true,
      })
      .then((res) => setTransactions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedPeriod]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleManualSync = async () => {
    try {
      await triggerManualSync();
    } catch {
      // triggerManualSync already logs; nothing else to do here.
    }
  };

  // Refetch once a manually-triggered sync completes.
  useEffect(() => {
    if (isSyncing) {
      setWasSyncing(true);
    } else if (wasSyncing && status === 'completed') {
      setWasSyncing(false);
      fetchTransactions();
    }
  }, [status, isSyncing, wasSyncing, fetchTransactions]);

  const categories = useMemo(() => {
    const set = new Set(transactions.map((t) => t.category).filter(Boolean));
    return ['all', ...Array.from(set).sort()];
  }, [transactions]);

  const filtered = useMemo(() => {
    let result = transactions;

    if (category !== 'all') {
      result = result.filter((t) => t.category === category);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((t) => t.merchant?.toLowerCase().includes(q));
    }

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.date) - new Date(b.date);
        case 'amount-desc':
          return b.amount - a.amount;
        case 'amount-asc':
          return a.amount - b.amount;
        case 'date-desc':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return sorted;
  }, [transactions, category, search, sortBy]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, t) => sum + (t.amount || 0), 0),
    [filtered]
  );

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Transactions</h1>
            <p className="text-slate-500 text-sm">
              Browse, filter, and search your full transaction history
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSyncing && (
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Syncing…
              </span>
            )}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-slate-200
                         bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync now
            </button>
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`px-4 py-2 text-sm rounded-md border transition
                ${
                  selectedPeriod === p.value
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by merchant…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700
                       focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All categories' : c}
              </option>
            ))}
          </select>

          <div className="relative">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-slate-900/10 appearance-none"
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary strip */}
        <div className="flex items-center justify-between text-sm text-slate-500 px-1">
          <span>
            {loading ? 'Loading…' : `${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`}
          </span>
          <span className="flex items-center gap-1 font-medium text-slate-900">
            <IndianRupee className="w-3.5 h-3.5" />
            {totalAmount.toLocaleString()}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500 px-6 py-12 text-center">
              {transactions.length === 0
                ? 'No transactions found for this period.'
                : 'No transactions match your search/filter.'}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 sticky top-0">
                <tr>
                  <th className="text-left px-6 py-3">Merchant</th>
                  <th className="text-left px-6 py-3">Category</th>
                  <th className="text-left px-6 py-3">Amount</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr
                    key={t._id || i}
                    className="border-t border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-3 text-slate-900">{t.merchant}</td>
                    <td className="px-6 py-3 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {t.category || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      ₹{t.amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-slate-600">
                      {new Date(t.date).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
