import React, { useState, useEffect } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { IndianRupee, Activity, Calendar, TrendingUp, ShoppingBag, Repeat, Clock } from 'lucide-react';
import axios from 'axios';

const FinancialInsights = () => {
  
  const [insightData, setInsightData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/insights/raw", { withCredentials: true })
      .then((res) => {
        console.log('Raw insights data:', res.data);
        setInsightData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching insights:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 text-sm">Loading insights…</p>
      </div>
    );
  }

  if (!insightData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 text-sm mb-2">No insight data available</p>
          <p className="text-slate-400 text-xs">Try syncing your emails first</p>
        </div>
      </div>
    );
  }

  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Safely handle monthlyData
  const monthlyChartData = (insightData.monthlyData || []).map((item, i, arr) => {
    const prev = arr[i - 1];
    return {
      month: monthNames[item.month - 1] || item.month,
      totalSpent: item.totalSpent,
      growth: prev
        ? ((item.totalSpent - prev.totalSpent) / prev.totalSpent) * 100
        : 0
    };
  });

  const totalSpent = (insightData.monthlyData || []).reduce((a, b) => a + b.totalSpent, 0);
  const totalTransactions = (insightData.monthlyData || []).reduce((a, b) => a + b.transactionCount, 0);
  const avgMonthly = insightData.monthlyData?.length > 0 ? totalSpent / insightData.monthlyData.length : 0;

  // Category data for pie chart
  const categoryChartData = (insightData.categoryData || []).map(cat => ({
    name: cat.category,
    value: cat.totalSpent,
    count: cat.transactionCount
  }));

  // Top merchants data
  const topMerchantsData = (insightData.merchantData || []).slice(0, 8).map(m => ({
    name: m.merchant.length > 20 ? m.merchant.substring(0, 20) + '...' : m.merchant,
    amount: m.totalSpent,
    count: m.transactionCount
  }));

  // Weekly pattern data
  const weeklyData = (insightData.patternsData || []).map(p => ({
    day: p.dayName.substring(0, 3),
    amount: p.totalSpent,
    transactions: p.transactionCount
  }));

  // Subscriptions/Recurring payments
  const subscriptions = (insightData.merchantData || [])
    .filter(m => m.isSubscription || m.isRecurring)
    .slice(0, 6);

  console.log('Processed data:', {
    monthlyChartData,
    categoryChartData,
    topMerchantsData,
    weeklyData,
    subscriptions
  });

  // Colors for charts - Bold and visible
  const COLORS = [
    '#1F2937', // Dark gray
    '#DC2626', // Red
    '#2563EB', // Blue
    '#059669', // Green
    '#7C3AED', // Purple
    '#D97706', // Amber
    '#0891B2', // Cyan
    '#EA580C', // Orange
    '#BE185D', // Pink
    '#111827'  // Black
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Financial Insights
          </h1>
          <p className="text-sm text-slate-500">
            Comprehensive spending analysis and patterns
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            title="Avg monthly"
            value={`₹${avgMonthly.toFixed(0)}`}
            icon={<Calendar />}
          />
          <Stat
            title="Categories"
            value={(insightData.categoryData || []).length}
            icon={<TrendingUp />}
          />
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-slate-700" />
            <p className="text-sm font-medium text-slate-900">
              Monthly spending trend
            </p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyChartData}>
              <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" />
              <XAxis dataKey="month" tick={{ fill: '#64748B', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                formatter={(value) => `₹${value.toLocaleString()}`}
              />
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

        {/* Category Breakdown & Weekly Pattern */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Category Pie Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="w-5 h-5 text-slate-700" />
              <p className="text-sm font-medium text-slate-900">
                Spending by category
              </p>
            </div>

            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `₹${value.toLocaleString()}`,
                      `${props.payload.name} (${((value / totalSpent) * 100).toFixed(1)}%)`
                    ]}
                    contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry) => {
                      const percent = ((entry.payload.value / totalSpent) * 100).toFixed(1);
                      return `${value} (${percent}%)`;
                    }}
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm mb-1">No category data available</p>
                <p className="text-slate-400 text-xs">Sync emails to see category breakdown</p>
              </div>
            )}
          </div>

          {/* Weekly Pattern Chart */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-slate-700" />
              <p className="text-sm font-medium text-slate-900">
                Spending by day of week
              </p>
            </div>

            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" />
                  <XAxis dataKey="day" tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                  />
                  <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm mb-1">No weekly data available</p>
                <p className="text-slate-400 text-xs">Need more transaction data</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Merchants Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-slate-700" />
            <p className="text-sm font-medium text-slate-900">
              Top merchants
            </p>
          </div>

          {topMerchantsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topMerchantsData} layout="vertical">
                <CartesianGrid stroke="#E5E7EB" strokeDasharray="4 4" />
                <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#64748B', fontSize: 11 }} 
                  width={120}
                />
                <Tooltip 
                  formatter={(value) => `₹${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E8F0', borderRadius: '8px' }}
                />
                <Bar dataKey="amount" fill="#059669" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm mb-1">No merchant data available</p>
              <p className="text-slate-400 text-xs">Transactions need merchant information</p>
            </div>
          )}
        </div>

        {/* Subscriptions & Recurring Payments */}
        {subscriptions.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Repeat className="w-5 h-5 text-slate-700" />
              <p className="text-sm font-medium text-slate-900">
                Subscriptions & recurring payments
              </p>
              <span className="ml-auto text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {subscriptions.length} detected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscriptions.map((sub, idx) => (
                <div 
                  key={idx} 
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {sub.merchant}
                    </p>
                    {sub.isSubscription && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Sub
                      </span>
                    )}
                  </div>
                  <p className="text-lg font-semibold text-slate-900 mb-1">
                    ₹{sub.avgAmount.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Repeat className="w-3 h-3" />
                      {sub.transactionCount}x
                    </span>
                    {sub.avgDaysBetween && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{Math.round(sub.avgDaysBetween)} days
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Details Table */}
        {categoryChartData.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-slate-700" />
              <p className="text-sm font-medium text-slate-900">
                Category breakdown
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-700">Category</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Total</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Transactions</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Avg</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-700">Daily Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {(insightData.categoryData || []).map((cat, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium text-slate-900">{cat.category}</td>
                      <td className="py-3 px-4 text-right text-slate-900">₹{cat.totalSpent.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{cat.transactionCount}</td>
                      <td className="py-3 px-4 text-right text-slate-600">₹{cat.avgAmount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-slate-600">₹{cat.dailyAverage.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
