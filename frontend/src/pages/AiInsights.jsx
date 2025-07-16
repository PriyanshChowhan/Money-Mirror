import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info, DollarSign, Calendar, Clock, ShoppingBag, Car, Smartphone, Music, Star, Target, Heart, Briefcase, Coffee } from 'lucide-react';

const AIInsightsPage = () => {
  const [insightsData, setInsightsData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const cached = localStorage.getItem('aiInsights');
    if (cached) {
      setInsightsData(JSON.parse(cached));
    }
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await fetch('http://money-mirror.xyz/api/insights/ai', {
        credentials: 'include'
      });
      const res = await response.json();
      const data = res?.insights;
      if (data) {
        alert("Insights successfully refreshed!");
        setInsightsData(data);
        localStorage.setItem('aiInsights', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'low': return <TrendingUp className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'food': return <Coffee className="w-5 h-5" />;
      case 'shopping': return <ShoppingBag className="w-5 h-5" />;
      case 'travel': return <Car className="w-5 h-5" />;
      case 'subscriptions': return <Smartphone className="w-5 h-5" />;
      case 'health & wellness': return <Heart className="w-5 h-5" />;
      case 'work-life balance': return <Briefcase className="w-5 h-5" />;
      case 'budgeting': return <DollarSign className="w-5 h-5" />;
      case 'financial_planning': return <Target className="w-5 h-5" />;
      case 'spending_habits': return <TrendingDown className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'spending', label: 'Spending', icon: DollarSign },
    { id: 'categories', label: 'Categories', icon: ShoppingBag },
    { id: 'subscriptions', label: 'Subscriptions', icon: Smartphone },
    { id: 'lifestyle', label: 'Lifestyle', icon: Heart }
  ];

  if (!insightsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center text-white px-4 text-center"> 
        <div className="text-xl mb-6">
          No insights found. Click "Refresh Insights" to fetch latest data.
        </div>
        <div className="flex justify-end mb-4">
          <button
            onClick={fetchInsights}
            className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            Refresh Insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Starfield effect */}
      <div className="absolute inset-0">
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

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">AI Financial Insights</h1>
            <p className="text-purple-200 text-lg">Smart analysis of your spending patterns and financial health</p>
            
            {/* Statistics Summary */}
            <div className="flex justify-center gap-8 mt-6 text-white">
              <div className="text-center">
                <div className="text-2xl font-bold">{insightsData.all?.length || 0}</div>
                <div className="text-sm text-purple-200">Total Insights</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{insightsData.all?.reduce((acc, item) => acc + (item.actionItems?.length || 0), 0) || 0}</div>
                <div className="text-sm text-purple-200">Action Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{insightsData.categories?.length || 0}</div>
                <div className="text-sm text-purple-200">Categories</div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8">
            <div className="flex justify-end mb-4">
              <button
                onClick={fetchInsights}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all"
              >
                Refresh Insights
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap justify-center gap-2 mb-8 bg-gray-50 rounded-2xl p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-white/80'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Featured Insights */}
                  {insightsData.featured && insightsData.featured.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">Featured Insights</h2>
                      <div className="grid gap-6 md:grid-cols-2">
                        {insightsData.featured.map((insight, index) => (
                          <div key={index} className={`p-6 rounded-2xl border-2 ${getSeverityColor(insight.severity)}`}>
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                {getSeverityIcon(insight.severity)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                                <p className="text-sm leading-relaxed mb-3">{insight.message}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.category}</span>
                                  <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.impact} impact</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* High Priority Insights */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Priority Insights</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                      {insightsData.all?.filter(insight => insight.priority === 'medium').slice(0, 4).map((insight, index) => (
                        <div key={index} className={`p-6 rounded-2xl border-2 ${getSeverityColor(insight.severity)}`}>
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {getCategoryIcon(insight.category)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                              <p className="text-sm leading-relaxed mb-3">{insight.message}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.category}</span>
                                <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.timeframe}</span>
                                {insight.potentialSavings && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                    Save: {insight.potentialSavings}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Spending Tab */}
              {activeTab === 'spending' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Spending Analysis</h2>
                  {insightsData.spending?.map((insight, index) => (
                    <div key={index} className={`p-6 rounded-2xl border-2 ${getSeverityColor(insight.severity)}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getSeverityIcon(insight.severity)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                          <p className="text-sm leading-relaxed mb-4">{insight.message}</p>
                          
                          {insight.actionItems && insight.actionItems.length > 0 && (
                            <div className="bg-white/50 p-4 rounded-lg">
                              <h4 className="font-medium mb-2">Action Items:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {insight.actionItems.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.category}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.impact} impact</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.timeframe}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Category Insights</h2>
                  {insightsData.categories?.map((insight, index) => (
                    <div key={index} className={`p-6 rounded-2xl border-2 ${getSeverityColor(insight.severity)}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                          <p className="text-sm leading-relaxed mb-4">{insight.message}</p>
                          
                          {insight.actionItems && insight.actionItems.length > 0 && (
                            <div className="bg-white/50 p-4 rounded-lg mb-3">
                              <h4 className="font-medium mb-2">Optimization Tips:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {insight.actionItems.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{insight.category}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.impact} impact</span>
                            {insight.potentialSavings && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                Potential Savings: {insight.potentialSavings}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subscriptions Tab */}
              {activeTab === 'subscriptions' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Subscription Insights</h2>
                  {insightsData.subscriptions?.map((insight, index) => (
                    <div key={index} className={`p-6 rounded-2xl border-2 ${getSeverityColor(insight.severity)}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <Smartphone className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                          <p className="text-sm leading-relaxed mb-4">{insight.message}</p>
                          
                          {insight.actionItems && insight.actionItems.length > 0 && (
                            <div className="bg-white/50 p-4 rounded-lg mb-3">
                              <h4 className="font-medium mb-2">Recommendations:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {insight.actionItems.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">{insight.category}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.impact} impact</span>
                            {insight.potentialSavings && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                Potential Savings: {insight.potentialSavings}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lifestyle Tab */}
              {activeTab === 'lifestyle' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Lifestyle Insights</h2>
                  {insightsData.lifestyle?.map((insight, index) => (
                    <div key={index} className={`p-6 rounded-2xl border-2 ${getSeverityColor(insight.severity)}`}>
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {getCategoryIcon(insight.category)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-2">{insight.title}</h3>
                          <p className="text-sm leading-relaxed mb-4">{insight.message}</p>
                          
                          {insight.actionItems && insight.actionItems.length > 0 && (
                            <div className="bg-white/50 p-4 rounded-lg mb-3">
                              <h4 className="font-medium mb-2">Lifestyle Tips:</h4>
                              <ul className="list-disc list-inside space-y-1 text-sm">
                                {insight.actionItems.map((action, actionIndex) => (
                                  <li key={actionIndex}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full">{insight.category}</span>
                            <span className="px-2 py-1 bg-gray-100 rounded-full">{insight.impact} impact</span>
                            {insight.lifeQualityImpact && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                                Life Quality: {insight.lifeQualityImpact}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPage;