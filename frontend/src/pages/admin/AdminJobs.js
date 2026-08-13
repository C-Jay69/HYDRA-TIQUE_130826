import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../../App";
import Navbar from "../../components/Navbar";
import { CaretLeft, CheckCircle, Clock, XCircle } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export default function AdminJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get(`${API}/admin/jobs`, { withCredentials: true });
        setJobs(res.data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={16} weight="fill" className="text-[#4CAF7A]" />;
    if (status === 'failed') return <XCircle size={16} weight="fill" className="text-[#E05555]" />;
    return <Clock size={16} weight="duotone" className="text-[#C9A84C]" />;
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 page-enter" data-testid="admin-jobs-page">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-sm mb-6 transition-colors hover:text-[#C9A84C]" style={{ color: '#8A8A8A' }}>
          <CaretLeft size={16} /> Back to Admin
        </button>
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-8" style={{ color: '#F5F5F0' }}>All Identification Jobs</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <p style={{ color: '#8A8A8A' }}>No jobs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="jobs-table">
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2A2E' }}>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Job ID</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>User</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Item</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Status</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.job_id} style={{ borderBottom: '1px solid #2A2A2E' }} data-testid={`job-row-${job.job_id}`}>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: '#8A8A8A' }}>{job.job_id.slice(0, 8)}...</td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#F5F5F0' }}>{job.user_email || '-'}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#F5F5F0' }}>{job.item_name || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-1.5">
                        {statusIcon(job.status)}
                        <span className="font-mono text-xs uppercase" style={{ color: job.status === 'completed' ? '#4CAF7A' : job.status === 'failed' ? '#E05555' : '#C9A84C' }}>
                          {job.status}
                        </span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#8A8A8A' }}>{new Date(job.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
