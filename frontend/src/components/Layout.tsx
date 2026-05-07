import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle, Activity, History, Settings, LogOut, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getSettings } from '../api/clinic';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    getSettings()
      .then(s => document.documentElement.style.setProperty('--accent', s.accentColor))
      .catch(() => {});
  }, []);

  // Close sidebar on navigation
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const NAV = [
    { to: '/new-visit', icon: PlusCircle, label: t('nav.newVisit') },
    { to: '/triage',    icon: Activity,   label: t('nav.triageLive') },
    { to: '/history',   icon: History,    label: t('nav.history') },
    { to: '/settings',  icon: Settings,   label: t('nav.settings') },
  ];

  return (
    <div className="layout">
      {/* Mobile header strip */}
      <div className="page-header-mobile">
        <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <span style={{ fontWeight: 700, fontSize: 15 }}>🐾 VetTriage</span>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
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
          <span>{t('nav.logout')}</span>
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
