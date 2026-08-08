import React, { useEffect, useState } from 'react';
import { Repeat, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Deterministic (no-AI) subscription tracker: pulls /api/insights/raw/subscriptions,
// which detects "same merchant, same amount, same day of month" patterns from
// raw transactions and keeps them in sync automatically - e.g. ₹500 to Netflix
// every month becomes a tracked subscription without the user typing anything in.
const SmartSubscriptions = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actingOn, setActingOn] = useState(null);

  const load = () => {
    setLoading(true);
    axios
      .get('/api/insights/raw/subscriptions', { withCredentials: true })
      .then((res) => setData(res.data.data))
      .catch((err) => console.error('Error loading subscriptions:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    setActingOn(id);
    try {
      await axios.post(`/api/insights/subscriptions/${id}/${action}`, {}, { withCredentials: true });
      load();
    } catch (err) {
      console.error(`Error on ${action}:`, err);
    } finally {
      setActingOn(null);
    }
  };

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const confidenceLabel = (c) => {
    if (c >= 0.75) return { text: 'High confidence', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (c >= 0.55) return { text: 'Medium confidence', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: 'Low confidence', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <p className="text-sm text-slate-500">Detecting recurring payments…</p>
      </div>
    );
  }

  if (!data || (!data.subscriptions?.length && !data.awaitingConfirmation?.length)) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <Repeat className="w-5 h-5 text-slate-700" />
          <p className="text-sm font-medium text-slate-900">Smart subscription detection</p>
        </div>
        <p className="text-sm text-slate-500">
          No recurring charges detected yet. Once a merchant charges you the same amount
          on a repeating schedule (e.g. monthly), it'll show up here automatically.
        </p>
      </div>
    );
  }

  const { subscriptions, upcomingRenewals, awaitingConfirmation, summary } = data;

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Repeat className="w-5 h-5 text-slate-700" />
          <p className="text-sm font-medium text-slate-900">Smart subscription detection</p>
        </div>
        <div className="flex gap-4 text-xs text-slate-500">
          <span>{summary.activeCount} active</span>
          <span>₹{summary.totalMonthlySpend.toLocaleString('en-IN')}/mo</span>
          <span>₹{summary.totalYearlySpend.toLocaleString('en-IN')}/yr</span>
        </div>
      </div>

      {upcomingRenewals?.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <p className="text-xs font-medium text-amber-800">Renewing in the next 7 days</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {upcomingRenewals.map((s) => (
              <span key={s._id} className="text-xs bg-white border border-amber-200 rounded px-2 py-1 text-amber-800">
                {s.service} · ₹{s.amount?.toLocaleString('en-IN')} · in {daysUntil(s.nextBillingDate)}d
              </span>
            ))}
          </div>
        </div>
      )}

      {awaitingConfirmation?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Newly detected - awaiting your confirmation</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {awaitingConfirmation.map((s) => {
              const conf = confidenceLabel(s.confidence);
              return (
                <div key={s._id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{s.service}</p>
                    <span className={`text-[10px] border rounded px-1.5 py-0.5 ${conf.color}`}>{conf.text}</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900 mb-1">
                    ₹{s.amount?.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">/{s.billingCycle}</span>
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    Charged {s.occurrenceCount}x{s.dayOfMonth ? `, around the ${s.dayOfMonth}${s.dayOfMonth === 1 ? 'st' : s.dayOfMonth === 2 ? 'nd' : s.dayOfMonth === 3 ? 'rd' : 'th'} of the month` : ''}
                  </p>
                  <div className="flex gap-2">
                    <button
                      disabled={actingOn === s._id}
                      onClick={() => act(s._id, 'confirm')}
                      className="flex-1 flex items-center justify-center gap-1 text-xs bg-slate-900 text-white rounded px-2 py-1.5 hover:bg-slate-800 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Confirm
                    </button>
                    <button
                      disabled={actingOn === s._id}
                      onClick={() => act(s._id, 'dismiss')}
                      className="flex-1 flex items-center justify-center gap-1 text-xs border border-slate-200 text-slate-600 rounded px-2 py-1.5 hover:bg-slate-50 disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" /> Not a subscription
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subscriptions?.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">All tracked subscriptions</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Service</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-700">Amount</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Cycle</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Next billing</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-700">Source</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s._id} className="border-b border-slate-100">
                    <td className="py-2 px-3 font-medium text-slate-900">{s.service}</td>
                    <td className="py-2 px-3 text-right text-slate-900">₹{s.amount?.toLocaleString('en-IN')}</td>
                    <td className="py-2 px-3 text-slate-600 capitalize">{s.billingCycle}</td>
                    <td className="py-2 px-3 text-slate-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="py-2 px-3 text-slate-500 capitalize">{s.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSubscriptions;