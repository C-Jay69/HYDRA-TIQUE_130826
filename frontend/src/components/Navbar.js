import { useAuth, API } from "../App";
import { useNavigate, useLocation } from "react-router-dom";
import { Diamond, House, MagnifyingGlass, SignOut, GearSix } from "@phosphor-icons/react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <House size={18} weight="duotone" /> },
    { path: '/identify', label: 'Scan', icon: <MagnifyingGlass size={18} weight="duotone" /> },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin', label: 'Admin', icon: <GearSix size={18} weight="duotone" /> });
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(10,10,11,0.7)', borderColor: '#2A2A2E' }} data-testid="navbar">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2" data-testid="nav-logo">
            <Diamond size={20} weight="fill" className="text-[#C9A84C]" />
            <span className="font-serif text-lg font-bold tracking-tight" style={{ color: '#F5F5F0' }}>HYDRA-TIQUE</span>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors"
                style={{ color: isActive(item.path) ? '#C9A84C' : '#8A8A8A' }}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono" style={{ color: '#8A8A8A' }}>{user?.email}</span>
          {user?.picture && (
            <img src={user.picture} alt="" className="w-7 h-7 rounded-full" />
          )}
          <button
            onClick={handleLogout}
            className="p-1.5 transition-colors hover:text-[#E05555]"
            style={{ color: '#8A8A8A' }}
            data-testid="logout-btn"
          >
            <SignOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
}
