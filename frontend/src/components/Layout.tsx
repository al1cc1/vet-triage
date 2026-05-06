import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { PlusCircle, Activity, History, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSettings } from '../api/clinic';

const NAV = [
  { to: '/new-visit', icon: PlusCircle, label: 'Nowa wizyta' },
  { to: '/triage',    icon: Activity,   label: 'Triaż live' },
  { to: '/history',  icon: History,    label: 'Historia' },
  { to: '/settings', icon: Settings,   label: 'Ustawienia' },
];

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getSettings()
      .then(s => document.documentElement.style.setProperty('--accent', s.accentColor))
      .catch(() => {});
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">🐾 VetTriage</div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button
          className="nav-item nav-logout"
          onClick={() => { logout(); navigate('/login'); }}
        >
          <LogOut size={18} />
          <span>Wyloguj</span>
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
