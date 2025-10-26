import axios from 'axios';
import React, { useEffect, useState } from 'react';
import {NavLink} from 'react-router-dom'
import { 
    PlusCircle,
    TrendingUp,
    IndianRupee,
    Calendar,
    Menu,
    Bell, 
    User,
    Search,
    Filter } from 'lucide-react';

const Dashboard = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const [transactions, setTransactions] = useState([])
    const [selectedPeriod, setSelectedPeriod] = useState('last-12-months');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [expenseData, setExpenseData] = useState([]);
    const [totalExpenses, setTotalExpenses] = useState(0);
    const [dailyExpenses, setDailyExpenses] = useState([]);
    const [userName, setUserName] = useState('User');

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/transactions/getTransactionsByRange?range=${selectedPeriod}`, {
            withCredentials : true
        })
        .then((res) => {       
            setTransactions(res.data)
            const { result, total } = buildExpenseDataFromTransactions(res.data);
            setExpenseData(result);
            setTotalExpenses(total);
            setDailyExpenses(buildDailyExpenseData(res.data));
        })
        .catch((err) => {
            console.error(err)
        })
    }, [selectedPeriod]);

    const buildExpenseDataFromTransactions = (transactions) => {
        const categoryMap = {};
        let total = 0;

        for (const txn of transactions) {
            if (!txn.category) continue;
            total += txn.amount;
            if (!categoryMap[txn.category]) {
                categoryMap[txn.category] = 0;
            }
            categoryMap[txn.category] += txn.amount;
        }

        const colorPalette = [
            'from-purple-500 to-purple-600',
            'from-blue-500 to-blue-600',
            'from-green-500 to-green-600',
            'from-orange-500 to-orange-600',
            'from-pink-500 to-pink-600',
            'from-yellow-500 to-yellow-600',
            'from-red-500 to-red-600',
            'from-indigo-500 to-indigo-600'
        ];

        const result = Object.entries(categoryMap)
            .map(([category, amount], index) => ({
                category,
                amount,
                percentage: ((amount / total) * 100).toFixed(1),
                color: colorPalette[index % colorPalette.length]
            }))
            .sort((a, b) => b.amount - a.amount);
        
        return { result, total };
    };

    const buildDailyExpenseData = (transactions) => {
        const dailyMap = {};
        
        transactions.forEach(txn => {
            const date = new Date(txn.date).toISOString().slice(0, 10);
            if (!dailyMap[date]) {
                dailyMap[date] = 0;
            }
            dailyMap[date] += txn.amount;
        });

        const sortedDates = Object.keys(dailyMap).sort().slice(-7); 
        return sortedDates.map(date => ({
            date,
            amount: dailyMap[date],
            day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        }));
    };

    const periods = [
        { label: 'Last 12 Months', value: 'last-12-months' },
        { label: 'Last Month', value: 'last-month' },
        { label: 'This Month', value: 'this-month' }
    ];

    const maxDailyAmount = Math.max(...dailyExpenses.map(item => item.amount), 1);

    // Get top categories for insights
    const topCategory = expenseData[0];
    const categoryGrowth = expenseData.length > 1 ? 
        ((expenseData[0].amount - expenseData[1].amount) / expenseData[1].amount * 100).toFixed(1) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>

            {/* Starfield Effect */}
            <div className="absolute inset-0 z-0">
            {[...Array(50)].map((_, i) => (
                <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-20 animate-pulse"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`
                }}
                />
            ))}
            </div>
            
            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Hello !!</h1>
                    <p className="text-purple-200">Here's your spending overview</p>
                </div>

                {/* Time Period Selector */}
                <div className="mb-8">
                    <div className="flex flex-wrap gap-2">
                        {periods.map((period) => (
                            <button
                                key={period.value}
                                onClick={() => setSelectedPeriod(period.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    selectedPeriod === period.value
                                        ? 'bg-white text-purple-900 shadow-lg'
                                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'
                                }`}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Total Expenses</h3>
                            <IndianRupee className="w-8 h-8 text-purple-300" />
                        </div>
                        <div className="text-3xl font-bold text-white">₹{totalExpenses.toLocaleString()}</div>
                        <div className="text-sm text-purple-200 mt-2"></div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Categories</h3>
                            <Filter className="w-8 h-8 text-purple-300" />
                        </div>
                        <div className="text-3xl font-bold text-white">{expenseData.length}</div>
                        <div className="text-sm text-purple-200 mt-2">
                            {topCategory && `Top: ${topCategory.category}`}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Transactions</h3>
                            <Calendar className="w-8 h-8 text-purple-300" />
                        </div>
                        <div className="text-3xl font-bold text-white">{transactions.length}</div>
                        <div className="text-sm text-purple-200 mt-2">
                            Avg: ₹{transactions.length > 0 ? (totalExpenses / transactions.length).toFixed(0) : 0} per transaction
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <NavLink
                    to="/ai"
                    className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
                    >
                    View AI Insights
                    </NavLink>

                    <NavLink
                    to="/insights"
                    className="bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all duration-200 flex items-center justify-center gap-2 border border-white/20"
                    >
                    View Insights
                    </NavLink>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Expense Categories - Horizontal Bar Chart */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-6">Expenses by Category</h3>
                        <div className="space-y-4">
                            {expenseData.slice(0, 6).map((item, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-medium">{item.category}</span>
                                        <div className="text-right">
                                            <span className="text-white font-bold">₹{item.amount.toLocaleString()}</span>
                                            <span className="text-purple-200 text-sm ml-2">({item.percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out rounded-full`}
                                            style={{
                                                width: `${item.percentage}%`,
                                                animationDelay: `${index * 100}ms`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Daily Spending Pattern */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <h3 className="text-xl font-semibold text-white mb-6">Daily Spending (Last 7 Days)</h3>
                        <div className="h-48 flex items-end justify-between gap-3">
                            {dailyExpenses.map((item, index) => (
                                <div key={index} className="flex flex-col items-center flex-1">
                                    <div className="relative w-full group">
                                        <div
                                            className="w-full bg-gradient-to-t from-purple-500 to-blue-400 rounded-t-lg transition-all duration-500 hover:from-purple-400 hover:to-blue-300 cursor-pointer"
                                            style={{
                                                height: `${(item.amount / maxDailyAmount) * 160}px`,
                                                minHeight: '20px'
                                            }}
                                        />
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                                            ₹{item.amount.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-white text-xs mt-2 text-center">
                                        <div>{item.day}</div>
                                        <div className="text-purple-200 text-[10px]">
                                            {new Date(item.date).getDate()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 text-center">
                            <div className="text-purple-200 text-sm">
                                Daily Average: ₹{dailyExpenses.length > 0 ? (
                                    dailyExpenses.reduce((sum, item) => sum + item.amount, 0) / dailyExpenses.length
                                ).toFixed(0) : 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spending Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Top Spending Day</h4>
                        <div className="space-y-2">
                            {dailyExpenses.length > 0 && (
                                <>
                                    <div className="text-2xl font-bold text-white">
                                        {dailyExpenses.reduce((max, item) => item.amount > max.amount ? item : max, dailyExpenses[0]).day}
                                    </div>
                                    <div className="text-purple-200 text-sm">
                                        ₹{dailyExpenses.reduce((max, item) => item.amount > max.amount ? item : max, dailyExpenses[0]).amount.toLocaleString()}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Most Frequent</h4>
                        <div className="space-y-2">
                            {topCategory && (
                                <>
                                    <div className="text-2xl font-bold text-white">{topCategory.category}</div>
                                    <div className="text-purple-200 text-sm">
                                        {transactions.filter(t => t.category === topCategory.category).length} transactions
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                        <h4 className="text-lg font-semibold text-white mb-4">Average Transaction</h4>
                        <div className="space-y-2">
                            <div className="text-2xl font-bold text-white">
                                ₹{transactions.length > 0 ? (totalExpenses / transactions.length).toFixed(0) : 0}
                            </div>
                            <div className="text-purple-200 text-sm">
                                Across {transactions.length} transactions
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <h3 className="text-xl font-semibold text-white mb-6">Recent Transactions</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="text-left text-white font-semibold py-3">Merchant</th>
                                    <th className="text-left text-white font-semibold py-3">Category</th>
                                    <th className="text-left text-white font-semibold py-3">Amount</th>
                                    <th className="text-left text-white font-semibold py-3">Date</th>
                                    <th className="text-left text-white font-semibold py-3">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.slice(0, 10).map((transaction, index) => {
                                    const amount = transaction.amount;
                                    const threshold = Math.max(...transactions.slice(0, 10).map(t => t.amount)) * 0.7; 

                                    const isHighAmount = amount >= threshold;

                                    return (
                                    <tr
                                        key={index}
                                        className={`border-b border-white/10 transition-colors ${
                                        isHighAmount ? 'bg-white/5 shadow-md backdrop-blur-sm' : 'hover:bg-white/5'
                                        }`}
                                    >
                                        <td className="text-white py-3 font-medium">{transaction.merchant}</td>
                                        <td className="text-purple-200 py-3">{transaction.category}</td>
                                        <td className={"py-3 font-semibold text-white"}>
                                        ₹{transaction.amount.toLocaleString()}
                                        </td>
                                        <td className="text-purple-200 py-3">
                                        {new Date(transaction.date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="text-purple-200 py-3">
                                        {new Date(transaction.date).toLocaleTimeString('en-IN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                        </td>
                                    </tr>
                                    );
                                })}
                                </tbody>

                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;