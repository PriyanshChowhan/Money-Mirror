import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

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
      const response = await fetch("/api/insights/ai", {
        credentials: 'include',
      });
      const res = await response.json();
      const data = res?.insights;
      if (data) {
        setInsightsData(data);
        localStorage.setItem('aiInsights', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to fetch insights:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'spending', label: 'Spending' },
    { id: 'categories', label: 'Categories' },
    { id: 'subscriptions', label: 'Subscriptions' },
    { id: 'lifestyle', label: 'Lifestyle' },
  ];

  const severityStyle = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-amber-200 bg-amber-50';
      case 'low':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-slate-200 bg-slate-50';
    }
  };

  if (!insightsData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4 text-sm">
            AI insights are not generated yet.
          </p>
          <button
            onClick={fetchInsights}
            className="px-6 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
          >
            Generate insights
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              AI Financial Insights
            </h1>
            <p className="text-sm text-slate-500">
              Automated analysis of your spending behavior
            </p>
          </div>

          <button
            onClick={fetchInsights}
            className="px-5 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800"
          >
            Refresh insights
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Insights List */}
        <div className="space-y-4">
          {(insightsData[activeTab] || insightsData.featured || []).map(
            (insight, i) => (
              <div
                key={i}
                className={`border rounded-lg p-5 flex gap-4 ${severityStyle(
                  insight.severity
                )}`}
              >
                <Info className="w-5 h-5 text-slate-500 mt-1" />

                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {insight.title}
                  </h3>
                  <p className="text-sm text-slate-700 mt-1">
                    {insight.message}
                  </p>

                  {/* Meta */}
                  <div className="flex gap-2 mt-3 text-xs text-slate-600 flex-wrap">
                    {insight.category && (
                      <span className="px-2 py-0.5 border rounded">
                        {insight.category}
                      </span>
                    )}
                    {insight.impact && (
                      <span className="px-2 py-0.5 border rounded">
                        {insight.impact} impact
                      </span>
                    )}
                    {insight.timeframe && (
                      <span className="px-2 py-0.5 border rounded">
                        {insight.timeframe}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPage;
