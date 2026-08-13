import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API } from "../../App";
import Navbar from "../../components/Navbar";
import { Users, Briefcase, CurrencyDollar, ChartBar } from "@phosphor-icons/react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/admin/stats`, { withCredentials: true });
        setStats(res.data);
      } catch (err) {
        console.error("Failed to fetch admin stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = stats ? [
    { label: "Total Users", value: stats.total_users, icon: <Users size={24} weight="duotone" /> },
    { label: "Total Jobs", value: stats.total_jobs, icon: <Briefcase size={24} weight="duotone" /> },
    { label: "Completed", value: stats.completed_jobs, icon: <ChartBar size={24} weight="duotone" /> },
    { label: "Revenue", value: `$${stats.total_revenue?.toFixed(2)}`, icon: <CurrencyDollar size={24} weight="duotone" /> },
  ] : [];

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 page-enter" data-testid="admin-dashboard-page">
        <p className="font-mono text-sm tracking-[0.2em] uppercase mb-2" style={{ color: '#C9A84C' }}>Admin Panel</p>
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-8" style={{ color: '#F5F5F0' }}>Platform Overview</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              {cards.map((c, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-6 border"
                  style={{ background: '#141416', borderColor: '#2A2A2E' }}
                  data-testid={`admin-stat-${i}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: '#8A8A8A' }}>{c.label}</p>
                    <div style={{ color: '#C9A84C' }}>{c.icon}</div>
                  </div>
                  <p className="font-mono text-3xl font-bold" style={{ color: '#F5F5F0' }}>{c.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => navigate('/admin/users')}
                className="p-6 border text-left transition-all duration-300 hover:border-[#C9A84C]/40"
                style={{ background: '#141416', borderColor: '#2A2A2E' }}
                data-testid="admin-manage-users-btn"
              >
                <Users size={24} weight="duotone" className="text-[#C9A84C] mb-3" />
                <h3 className="font-serif text-lg font-semibold" style={{ color: '#F5F5F0' }}>Manage Users</h3>
                <p className="text-sm mt-1" style={{ color: '#8A8A8A' }}>View and manage user accounts, adjust credits</p>
              </button>
              <button
                onClick={() => navigate('/admin/jobs')}
                className="p-6 border text-left transition-all duration-300 hover:border-[#C9A84C]/40"
                style={{ background: '#141416', borderColor: '#2A2A2E' }}
                data-testid="admin-manage-jobs-btn"
              >
                <Briefcase size={24} weight="duotone" className="text-[#C9A84C] mb-3" />
                <h3 className="font-serif text-lg font-semibold" style={{ color: '#F5F5F0' }}>Identification Jobs</h3>
                <p className="text-sm mt-1" style={{ color: '#8A8A8A' }}>View all identification jobs and their results</p>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
