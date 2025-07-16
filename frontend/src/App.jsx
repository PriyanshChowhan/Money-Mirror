import PrivateRoutes from './components/PrivateRoutes.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dasboard.jsx'
import FinancialInsights from './pages/Insights.jsx'
import AIInsightsPage from './pages/AiInsights.jsx'
import Layout from './components/Layout.jsx'
import { Routes, Route } from 'react-router-dom';
import NotFound from './pages/NotFound.jsx'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<PrivateRoutes />}>
          <Route element={<Layout />}>
            <Route path="/ai" element={<AIInsightsPage />} />
            <Route path="/insights" element={<FinancialInsights />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default App
