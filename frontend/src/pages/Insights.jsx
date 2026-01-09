import React, { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { IndianRupee, Activity, Calendar } from 'lucide-react';
import axios from 'axios';

const FinancialInsights = () => {
  
  const [insightData, setInsightData] = useState(null);

  useEffect(() => {
    axios
      .get("/api/insights/raw", { withCredentials: true })
      .then((res) => setInsightData(res.data.data))
      .catch(console.error);
  }, []);

  if (!insightData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 text-sm">Loading insights…</p>
      </div>
    );
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const monthlyChartData = insightData.monthlyData.map((item, i, arr) => {
    const prev = arr[i - 1];
    return {
      month: monthNames[item.month],
      totalSpent: item.totalSpent,
      growth: prev
        ? ((item.totalSpent - prev.totalSpent) / prev.totalSpent) * 100
        : 0
    };
  });

  const totalSpent = insightData.monthlyData.reduce((a, b) => a + b.totalSpent, 0);
  const totalTransactions = insightData.monthlyData.reduce((a, b) => a + b.transactionCount, 0);
  const avgMonthly = totalSpent / insightData.monthlyData.length;

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Financial Insights
          </h1>
          <p className="text-sm text-slate-500">
            Month-over-month spending analysis
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat
            title="Total spent"
            value={`₹${totalSpent.toLocaleString()}`}
            icon={<IndianRupee />}
          />
          <Stat
            title="Transactions"
            value={totalTransactions}
            icon={<Activity />}
          />
          <Stat
            title="Avg monthly spend"
            value={`₹${avgMonthly.toFixed(0)}`}
            icon={<Calendar />}
          />
        </div>

        {/* Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <p className="text-sm font-medium text-slate-900 mb-4">
            Monthly spending trend
          </p>

          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={monthlyChartData}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="totalSpent"
                stroke="#0F172A"
                fill="#CBD5E1"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const Stat = ({ title, value, icon }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-6 flex justify-between items-center">
    <div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
    </div>
    <div className="text-slate-400">{icon}</div>
  </div>
);

export default FinancialInsights;
