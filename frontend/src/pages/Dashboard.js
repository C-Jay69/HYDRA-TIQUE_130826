import { useState, useEffect, useCallback } from "react";
import { useAuth, API } from "../App";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import Navbar from "../components/Navbar";
import { Diamond, Plus, Clock, CheckCircle, XCircle, Coins, ArrowRight } from "@phosphor-icons/react";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [credits, setCredits] = useState(user?.credits_balance || 0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentChecking, setPaymentChecking] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [creditsRes, historyRes] = await Promise.all([
        axios.get(`${API}/users/credits`, { withCredentials: true }),
        axios.get(`${API}/identify/history`, { withCredentials: true })
      ]);
      setCredits(creditsRes.data.credits_balance);
      setHistory(historyRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll payment status if returning from Stripe
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setPaymentChecking(true);
      let attempts = 0;
      const poll = async () => {
        try {
          const res = await axios.get(`${API}/payments/status/${sessionId}`, { withCredentials: true });
          if (res.data.payment_status === 'paid') {
            setPaymentChecking(false);
            fetchData();
            navigate('/dashboard', { replace: true });
            return;
          }
          if (res.data.status === 'expired') {
            setPaymentChecking(false);
            return;
          }
        } catch {}
        attempts++;
        if (attempts < 10) setTimeout(poll, 2000);
        else setPaymentChecking(false);
      };
      poll();
    }
  }, [searchParams, fetchData, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={18} weight="fill" className="text-[#4CAF7A]" />;
    if (status === 'failed') return <XCircle size={18} weight="fill" className="text-[#E05555]" />;
    return <Clock size={18} weight="duotone" className="text-[#C9A84C]" />;
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 page-enter" data-testid="dashboard-page">
        {/* Payment status banner */}
        {paymentChecking && (
          <div className="mb-6 p-4 border flex items-center gap-3" style={{ background: '#141416', borderColor: '#C9A84C' }}>
            <div className="w-5 h-5 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm" style={{ color: '#F5F5F0' }}>Processing your payment...</p>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <p className="font-mono text-sm tracking-[0.2em] uppercase mb-2" style={{ color: '#C9A84C' }}>Dashboard</p>
            <h1 className="font-serif text-3xl md:text-4xl font-bold tracking-tight" style={{ color: '#F5F5F0' }}>
              Welcome back, {user?.name?.split(' ')[0] || 'Collector'}
            </h1>
          </div>
          <button
            data-testid="new-identification-btn"
            onClick={() => navigate('/identify')}
            className="flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all duration-200 active:translate-y-0.5 active:scale-[0.98]"
            style={{ background: '#C9A84C', color: '#0A0A0B' }}
          >
            <Plus size={18} weight="bold" />
            New Identification
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 border"
            style={{ background: '#141416', borderColor: '#2A2A2E' }}
            data-testid="free-scans-card"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: '#8A8A8A' }}>Free Scans</p>
              <Coins size={24} weight="duotone" className="text-[#4CAF7A]" />
            </div>
            <p className="font-mono text-4xl font-bold" style={{ color: '#4CAF7A' }} data-testid="free-scans-label">Unlimited</p>
            <p className="mt-2 text-sm" style={{ color: '#8A8A8A' }}>
              Every scan is free. Upgrade reports for full details.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 border"
            style={{ background: '#141416', borderColor: '#2A2A2E' }}
            data-testid="total-ids-card"
          >
            <p className="font-mono text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#8A8A8A' }}>Total Scans</p>
            <p className="font-mono text-4xl font-bold" style={{ color: '#F5F5F0' }}>{history.length}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 border"
            style={{ background: '#141416', borderColor: '#2A2A2E' }}
            data-testid="deep-dives-card"
          >
            <p className="font-mono text-xs tracking-[0.2em] uppercase mb-3" style={{ color: '#8A8A8A' }}>Deep Dives Unlocked</p>
            <p className="font-mono text-4xl font-bold" style={{ color: '#C9A84C' }}>{history.filter(h => h.tier === 'deep_dive').length}</p>
          </motion.div>
        </div>

        {/* History */}
        <div>
          <h2 className="font-serif text-xl font-semibold mb-6" style={{ color: '#F5F5F0' }}>Identification History</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16 border" style={{ background: '#141416', borderColor: '#2A2A2E' }} data-testid="empty-history">
              <Diamond size={40} weight="duotone" className="text-[#2A2A2E] mx-auto mb-4" />
              <p className="text-base mb-2" style={{ color: '#F5F5F0' }}>No identifications yet</p>
              <p className="text-sm mb-6" style={{ color: '#8A8A8A' }}>Upload your first artifact to get started</p>
              <button
                onClick={() => navigate('/identify')}
                className="px-6 py-2.5 text-sm font-semibold transition-all"
                style={{ background: '#C9A84C', color: '#0A0A0B' }}
                data-testid="first-identification-btn"
              >
                Start Your First Identification
              </button>
            </div>
          ) : (
            <div className="space-y-3" data-testid="history-list">
              {history.map((job, i) => (
                <motion.div
                  key={job.job_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => job.status === 'completed' ? navigate(`/report/${job.job_id}`) : null}
                  className="flex items-center gap-4 p-4 border transition-all duration-300 cursor-pointer"
                  style={{ background: '#141416', borderColor: '#2A2A2E' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2E'; }}
                  data-testid={`history-item-${job.job_id}`}
                >
                  <div className="w-12 h-12 flex items-center justify-center" style={{ background: '#0A0A0B' }}>
                    <Diamond size={20} weight="duotone" className="text-[#C9A84C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#F5F5F0' }}>
                      {job.item_name || 'Processing...'}
                    </p>
                    <p className="text-xs" style={{ color: '#8A8A8A' }}>
                      {new Date(job.created_at).toLocaleDateString()} · {job.category || job.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusIcon(job.status)}
                    <span className="font-mono text-xs uppercase" style={{ color: job.status === 'completed' ? '#4CAF7A' : job.status === 'failed' ? '#E05555' : '#C9A84C' }}>
                      {job.status}
                    </span>
                    {job.status === 'completed' && (
                      <span className="font-mono text-xs px-1.5 py-0.5 ml-1" style={{ 
                        background: job.tier === 'deep_dive' ? 'rgba(201,168,76,0.15)' : 'rgba(42,42,46,0.5)', 
                        color: job.tier === 'deep_dive' ? '#C9A84C' : '#8A8A8A',
                        border: job.tier === 'deep_dive' ? '1px solid rgba(201,168,76,0.3)' : '1px solid #2A2A2E'
                      }}>
                        {job.tier === 'deep_dive' ? 'DEEP DIVE' : 'FREE'}
                      </span>
                    )}
                  </div>
                  {job.status === 'completed' && <ArrowRight size={16} style={{ color: '#8A8A8A' }} />}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
