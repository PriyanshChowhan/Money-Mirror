import axios from 'axios';
import React, { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { IndianRupee, Filter, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { useSyncStatus } from '../hooks/useSyncStatus';

const RECENT_TRANSACTIONS_LIMIT = 8;

const Dashboard = () => {
  // "This month" stats power the summary cards + category chart — a fixed,
  // sensible default now that the period selector lives on /transactions.
  const [monthTransactions, setMonthTransactions] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Separate "recent activity" feed — most recent transactions overall,
  // not scoped to this month, so a quiet month doesn't leave this empty.
  const [recentTransactions, setRecentTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [hasCheckedInitialSync, setHasCheckedInitialSync] = useState(false);
  const [wasSyncing, setWasSyncing] = useState(false);

  const { status, isSyncing, failedReason, fetchStatus, startPolling, triggerManualSync } =
    useSyncStatus();

  const fetchDashboardData = useCallback(() => {
    setLoading(true);

    Promise.all([
      axios.get('/api/transactions/getTransactionsByRange?range=this-month', {
        withCredentials: true,
      }),
      axios.get('/api/transactions/getTransactions', { withCredentials: true }),
    ])
      .then(([monthRes, allRes]) => {
        setMonthTransactions(monthRes.data);
        const updated = buildExpenseDataFromTransactions(monthRes.data);
        setExpenseData(updated);
        setTotalExpenses(updated.reduce((sum, item) => sum + item.amount, 0));

        // getTransactions is already sorted by date desc server-side.
        setRecentTransactions(allRes.data.slice(0, RECENT_TRANSACTIONS_LIMIT));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load whatever data already exists as soon as the dashboard mounts —
  // don't wait on sync status first, since most visits aren't right after a
  // fresh login.
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Separately, check whether a sync is currently in flight — this is what
  // catches the "just logged in, background sync was just queued" case.
  useEffect(() => {
    fetchStatus().then((state) => {
      setHasCheckedInitialSync(true);
      if (state === 'waiting' || state === 'active') {
        startPolling();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When a sync finishes, refetch dashboard data so it reflects what just
  // landed, without the user needing to refresh manually.
  useEffect(() => {
    if (isSyncing) {
      setWasSyncing(true);
    } else if (wasSyncing && status === 'completed') {
      setWasSyncing(false);
      fetchDashboardData();
    }
  }, [status, isSyncing, wasSyncing, fetchDashboardData]);

  const handleManualSync = async () => {
    try {
      await triggerManualSync();
    } catch {
      // triggerManualSync already logs the error; nothing further to do here.
    }
  };

  const buildExpenseDataFromTransactions = (transactions) => {
    const map = {};
    transactions.forEach((t) => {
      if (!t.category) return;
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  // First-sync empty state: no transactions anywhere yet AND a sync is
  // actively running. This case didn't used to be reachable — login used to
  // block until sync finished, so data was always present by the time the
  // dashboard rendered. Now that sync is async, this is a real state.
  const showFirstSyncState =
    hasCheckedInitialSync &&
    !loading &&
    recentTransactions.length === 0 &&
    monthTransactions.length === 0 &&
    isSyncing;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm">
              Overview of your spending activity
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isSyncing && (
              <span className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Syncing…
              </span>
            )}
            {!isSyncing && status === 'failed' && (
              <span className="text-xs text-red-600" title={failedReason || ''}>
                Last sync failed
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

        {showFirstSyncState ? (
          <FirstSyncState />
        ) : (
          <>
            {/* Stats — this month */}
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-3">
                This month
              </p>
              <div className="grid grid-cols-3 gap-6">
                <StatsCard
                  title="Total expenses"
                  value={`₹${totalExpenses.toLocaleString()}`}
                  icon={<IndianRupee />}
                />
                <StatsCard
                  title="Categories"
                  value={expenseData.length}
                  icon={<Filter />}
                />
                <StatsCard
                  title="Transactions"
                  value={monthTransactions.length}
                  icon={<Calendar />}
                />
              </div>
            </div>

            {/* Category Breakdown — this month */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h3 className="font-medium text-slate-900 mb-4">
                Expense by category (this month)
              </h3>

              {expenseData.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No categorized transactions yet this month.
                </p>
              ) : (
                <div className="space-y-4">
                  {expenseData.slice(0, 6).map((item, i) => {
                    const maxExpense = expenseData[0]?.amount || 1;
                    const percentage = (item.amount / maxExpense) * 100;

                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm text-slate-700">
                          <span>{item.category}</span>
                          <span className="font-medium">
                            ₹{item.amount.toLocaleString()}
                          </span>
                        </div>

                        <div className="h-2 bg-slate-100 rounded mt-1">
                          <div
                            className="h-full bg-slate-800 rounded transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent activity — most recent transactions overall */}
            <div className="bg-white border border-slate-200 rounded-lg">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-medium text-slate-900">
                  Recent transactions
                </h3>
                <NavLink
                  to="/transactions"
                  className="text-sm text-slate-500 hover:text-slate-900"
                >
                  View all →
                </NavLink>
              </div>

              {recentTransactions.length === 0 ? (
                <p className="text-sm text-slate-500 px-6 py-8">
                  No transactions yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left px-6 py-3">Merchant</th>
                      <th className="text-left px-6 py-3">Category</th>
                      <th className="text-left px-6 py-3">Amount</th>
                      <th className="text-left px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t, i) => (
                      <tr
                        key={t._id || i}
                        className="border-t border-slate-200 hover:bg-slate-50"
                      >
                        <td className="px-6 py-3 text-slate-900">
                          {t.merchant}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {t.category}
                        </td>
                        <td className="px-6 py-3 font-medium text-slate-900">
                          ₹{t.amount.toLocaleString()}
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

            {/* Actions */}
            <div className="flex gap-3">
              <NavLink
                to="/transactions"
                className="px-5 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
              >
                View transactions
              </NavLink>
              <NavLink
                to="/ai"
                className="px-5 py-2 border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-100"
              >
                View AI insights
              </NavLink>
              <NavLink
                to="/insights"
                className="px-5 py-2 border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-100"
              >
                View charts
              </NavLink>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-6">
    <div className="flex items-center justify-between mb-2 text-slate-500">
      <p className="text-sm">{title}</p>
      {icon}
    </div>
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
  </div>
);

const FirstSyncState = () => (
  <div className="bg-white border border-slate-200 rounded-lg p-16 flex flex-col items-center justify-center text-center">
    <Loader2 className="w-8 h-8 text-slate-400 animate-spin mb-4" />
    <h3 className="text-slate-900 font-medium mb-1">
      We're pulling in your transactions
    </h3>
    <p className="text-sm text-slate-500 max-w-sm">
      This usually takes a few seconds to a couple of minutes depending on
      how much is in your inbox. This page will update automatically —
      no need to refresh.
    </p>
  </div>
);

export default Dashboard;
