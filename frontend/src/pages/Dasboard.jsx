import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { IndianRupee, Filter, Calendar } from 'lucide-react';

const Dashboard = () => {
  
  const [transactions, setTransactions] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('last-12-months');
  const [expenseData, setExpenseData] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    axios
      .get(
        "/api/transactions/getTransactionsByRange?range=${selectedPeriod}",
        { withCredentials: true }
      )
      .then((res) => {
        setTransactions(res.data);
        const updated = buildExpenseDataFromTransactions(res.data);
        setExpenseData(updated);
        setTotalExpenses(updated.reduce((sum, item) => sum + item.amount, 0));
      })
      .catch(console.error);
  }, [selectedPeriod]);

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

  const periods = [
    { label: 'Last 12 months', value: 'last-12-months' },
    { label: 'Last month', value: 'last-month' },
    { label: 'This month', value: 'this-month' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm">
              Overview of your spending activity
            </p>
          </div>

          <div className="flex gap-2">
            {periods.map((p) => (
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
        </div>

        {/* Stats */}
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
            value={transactions.length}
            icon={<Calendar />}
          />
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-medium text-slate-900 mb-4">
            Expense by category
          </h3>

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
        </div>


        {/* Transactions Table */}
        <div className="bg-white border border-slate-200 rounded-lg">
          <div className="p-6 border-b border-slate-200">
            <h3 className="font-medium text-slate-900">
              Recent transactions
            </h3>
          </div>

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
              {transactions.slice(0, 10).map((t, i) => (
                <tr
                  key={i}
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
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <NavLink
            to="/ai"
            className="px-5 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
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

export default Dashboard;
