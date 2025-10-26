  import React, { useState, useEffect } from 'react';
  import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
  import { DollarSign, Calendar, Clock, Zap, Target, Eye, Crown} from 'lucide-react';
import axios from 'axios';

  const FinancialInsights = () => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || '';
    const [activeTab, setActiveTab] = useState('overview');
    const [animatedValue, setAnimatedValue] = useState(0);
    const [insightData, setInsightData] = useState({
      monthlyData: [],
      merchantData: [],
      categoryData: [],
      patternsData: [],
      largeTransactions: [],
      currency: "INR"
    });


    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/insights/raw`, {
            withCredentials : true
        })
        .then((res) => {       
            setInsightData(res.data.data)
        })
        .catch((err) => {
            console.error(err)
        })
    }, []);

    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Process monthly data for charts
    const monthlyChartData = insightData.monthlyData.map((item, index, arr) => {
      const previous = arr[index - 1];
      const growth = previous && previous.totalSpent !== 0
        ? ((item.totalSpent - previous.totalSpent) / previous.totalSpent) * 100
        : 0;

      return {
        month: monthNames[item.month],
        totalSpent: item.totalSpent,
        transactionCount: item.transactionCount,
        avgTransaction: item.avgTransaction,
        growth: growth.toFixed(2),
      };
    });

    console.log(monthlyChartData)

    // Process merchant data for pie chart
    const merchantPieData = insightData.merchantData.map(item => ({
      name: item.merchant,
      value: item.totalSpent
    }));

    const totalSpent = insightData.monthlyData.reduce((sum, item) => sum + item.totalSpent, 0);
    const totalTransactions = insightData.monthlyData.reduce((sum, item) => sum + item.transactionCount, 0);
    const avgMonthlySpending = totalSpent / insightData.monthlyData.length;
    const mostActiveDay = insightData.patternsData[0]?.dayName || 'N/A';
    const peakHour = insightData.patternsData[0]?.peakHour || 21;
    const formattedPeakHour = `${peakHour % 12 || 12}:00 ${peakHour >= 12 ? 'PM' : 'AM'}`;

    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

    const GlowingStatCard = ({ title, value, icon: Icon, trend, subtitle, color, pulse = false }) => (
      <div className={`relative bg-gradient-to-br ${color} p-6 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500 ${pulse ? 'animate-pulse' : ''} group overflow-hidden`}>
        {/* Animated background particles */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300">
              <Icon className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>
          <h3 className="text-white/90 text-sm font-bold mb-2 uppercase tracking-wide">{title}</h3>
          <p className="text-4xl font-black text-white mb-1 drop-shadow-lg">{value}</p>
          {subtitle && <p className="text-white/80 text-sm font-medium">{subtitle}</p>}
        </div> 
      </div>
    );

    const MerchantCard = ({ merchant, index, totalSpent }) => {

      const gradients = [
        'from-purple-500 via-pink-500 to-red-500',
        'from-blue-500 via-cyan-500 to-teal-500',
        'from-green-500 via-emerald-500 to-blue-500',
        'from-yellow-500 via-orange-500 to-red-500',
        'from-indigo-500 via-purple-500 to-pink-500',
        'from-teal-500 via-cyan-500 to-blue-500'
      ];

      return (
        <div className={`relative bg-gradient-to-r ${gradients[index]} p-6 rounded-3xl shadow-2xl transform hover:scale-105 hover:rotate-1 transition-all duration-500 group overflow-hidden`}>
          {/* Animated background */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent animate-pulse"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-white">
                <span className="font-bold">#{index + 1}</span>
              </div>
            </div>
            
            <h4 className="text-white font-black text-xl mb-2">{merchant.merchant}</h4>
            <p className="text-white/80 text-sm mb-4 font-medium">{merchant.categories.join(', ')}</p>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-black text-2xl">₹{merchant.totalSpent.toLocaleString()}</p>
                <p className="text-white/70 text-sm">{merchant.transactionCount} transaction{merchant.transactionCount > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      );
    };

    const TabButton = ({ id, label, active, onClick, icon: Icon }) => (
      <button
        onClick={() => onClick(id)}
        className={`relative px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center space-x-2 overflow-hidden ${
          active
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl transform scale-105'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        {active && (
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
        )}
        <Icon className="w-5 h-5" />
        <span className="relative z-10">{label}</span>
      </button>
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 relative overflow-hidden">
        {/* {showConfetti && <Confetti />} */}
        
        {/* Enhanced animated background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(200)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-twinkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${1 + Math.random() * 3}s`
              }}
            />
          ))}
          
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 left-40 w-40 h-40 bg-gradient-to-br from-green-400/20 to-yellow-400/20 rounded-full blur-xl animate-ping"></div>
        </div>

        <div className="relative z-10 container mx-auto px-6 py-8">
          {/* Hero Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-black text-white mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
              Your Money Story
            </h1>
            <p className="text-white/80 text-xl max-w-3xl mx-auto font-medium">
              Discover mind-blowing insights about your spending habits and unlock your financial superpowers! 
              <span className="text-yellow-400 font-bold"> ⚡ Powered by AI Magic</span>
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-12 ">
            <div className="flex bg-white/10 backdrop-blur-xl rounded-3xl p-3 border border-white/20 shadow-2xl space-x-6">
              <TabButton
                id="overview"
                label="Overview"
                icon={Eye}
                active={activeTab === 'overview'}
                onClick={setActiveTab}
              />
              <TabButton
                id="merchants"
                label="Top Merchants"
                icon={Crown}
                active={activeTab === 'merchants'}
                onClick={setActiveTab}
              />
              <TabButton
                id="patterns"
                label="Patterns"
                icon={Zap}
                active={activeTab === 'patterns'}
                onClick={setActiveTab}
              />
            </div>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <GlowingStatCard
                  title="Total Spent"
                  value={`₹${totalSpent.toLocaleString()}`}
                  icon={DollarSign}
                  color="from-purple-500 via-pink-500 to-red-500"
                  pulse={true}
                />
                <GlowingStatCard
                  title=" Transactions"
                  value={totalTransactions}
                  icon={Zap}
                  color="from-blue-500 via-cyan-500 to-teal-500"
                  pulse={true}
                />
                <GlowingStatCard
                  title=" Monthly Average"
                  value={`₹${avgMonthlySpending.toLocaleString()}`}
                  icon={Target}
                  color="from-green-500 via-emerald-500 to-blue-500"
                  pulse={true}
                />
                <GlowingStatCard
                  title=" Peak Hour"
                  value={formattedPeakHour}
                  icon={Clock}
                  color="from-yellow-500 via-orange-500 to-red-500"
                  pulse={true}
                />
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Spending Trend Chart */}
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-white flex items-center">
                      Monthly Spending Trend
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyChartData}>
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.8)" />
                      <YAxis stroke="rgba(255,255,255,0.8)" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(139, 92, 246, 0.95)', 
                          border: 'none', 
                          borderRadius: '16px',
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="totalSpent" 
                        stroke="#8B5CF6" 
                        fillOpacity={1} 
                        fill="url(#colorGradient)"
                        strokeWidth={4}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Spending Breakdown by Merchant */}
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <h3 className="text-2xl font-black text-white mb-6 flex items-center">
                    Spending Breakdown by Merchant
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={merchantPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {merchantPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(59, 130, 246, 0.95)', 
                          border: 'none', 
                          borderRadius: '16px',
                          color: 'white',
                          fontWeight: 'bold'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Transaction Power Bar */}
              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <h3 className="text-2xl font-black text-white mb-6 flex items-center">
                  Monthly Transaction Volume
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.8)" />
                    <YAxis stroke="rgba(255,255,255,0.8)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(34, 197, 94, 0.95)', 
                        border: 'none', 
                        borderRadius: '16px',
                        color: 'white',
                        fontWeight: 'bold'
                      }} 
                    />
                    <Bar dataKey="transactionCount" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={1}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={1}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Merchants Tab */}
          {activeTab === 'merchants' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-white mb-4"> Top Merchants by Spend</h2>
                <p className="text-white/80 text-lg">Your spending champions ranked by domination! </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {insightData.merchantData.map((merchant, index) => (
                  <MerchantCard key={index} merchant={merchant} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === 'patterns' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-white mb-4">⚡Spending Patterns Overview</h2>
                <p className="text-white/80 text-lg">Discover the secret patterns in your financial behavior! 🧬</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <h4 className="text-2xl font-black text-white mb-6 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-yellow-400" />
                     Most Active Day
                  </h4>
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                      <span className="text-2xl">📅</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-3xl">{mostActiveDay}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <h4 className="text-2xl font-black text-white mb-6 flex items-center">
                    <Clock className="w-6 h-6 mr-2 text-blue-400" />
                    Peak Power Hour
                  </h4>
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                      <span className="text-2xl">🕘</span>
                    </div>
                    <div>
                      <p className="text-white font-black text-3xl">{formattedPeakHour}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  export default FinancialInsights;