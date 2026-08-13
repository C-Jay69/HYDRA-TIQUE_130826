import { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../../App";
import Navbar from "../../components/Navbar";
import { CaretLeft, Plus, Minus } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjusting, setAdjusting] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API}/admin/users`, { withCredentials: true });
      setUsers(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (userId) => {
    if (adjustAmount === 0) return;
    try {
      await axios.post(`${API}/admin/users/credits`, {
        user_id: userId,
        amount: adjustAmount,
        reason: "admin_adjustment"
      }, { withCredentials: true });
      setAdjusting(null);
      setAdjustAmount(0);
      fetchUsers();
    } catch (err) {
      console.error("Failed to adjust credits");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-8 page-enter" data-testid="admin-users-page">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-1 text-sm mb-6 transition-colors hover:text-[#C9A84C]" style={{ color: '#8A8A8A' }}>
          <CaretLeft size={16} /> Back to Admin
        </button>
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-8" style={{ color: '#F5F5F0' }}>Users</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="users-table">
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2A2E' }}>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>User</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Email</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Role</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Credits</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Joined</th>
                  <th className="text-left py-3 px-4 font-mono text-xs tracking-widest uppercase" style={{ color: '#8A8A8A' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.user_id} style={{ borderBottom: '1px solid #2A2A2E' }} data-testid={`user-row-${u.user_id}`}>
                    <td className="py-3 px-4" style={{ color: '#F5F5F0' }}>{u.name}</td>
                    <td className="py-3 px-4 font-mono text-xs" style={{ color: '#8A8A8A' }}>{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs uppercase px-2 py-0.5" style={{ background: u.role === 'admin' ? 'rgba(201,168,76,0.1)' : 'transparent', color: u.role === 'admin' ? '#C9A84C' : '#8A8A8A' }}>{u.role}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold" style={{ color: '#C9A84C' }}>{u.credits_balance}</td>
                    <td className="py-3 px-4 text-xs" style={{ color: '#8A8A8A' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      {adjusting === u.user_id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={adjustAmount}
                            onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)}
                            className="w-20 bg-transparent border-b text-sm py-1 outline-none"
                            style={{ borderColor: '#C9A84C', color: '#F5F5F0' }}
                            data-testid={`adjust-input-${u.user_id}`}
                          />
                          <button onClick={() => handleAdjust(u.user_id)} className="text-xs px-2 py-1" style={{ background: '#C9A84C', color: '#0A0A0B' }} data-testid={`adjust-confirm-${u.user_id}`}>Apply</button>
                          <button onClick={() => { setAdjusting(null); setAdjustAmount(0); }} className="text-xs" style={{ color: '#8A8A8A' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setAdjusting(u.user_id)} className="text-xs" style={{ color: '#C9A84C' }} data-testid={`adjust-credits-btn-${u.user_id}`}>Adjust Credits</button>
                      )}
                    </td>
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
