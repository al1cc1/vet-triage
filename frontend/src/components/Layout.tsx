import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { PlusCircle, Activity, History, Settings, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { getSettings } from '../api/clinic';

export default function Layout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    getSettings()
      .then(s => document.documentElement.style.setProperty('--accent', s.accentColor))
      .catch(() => {});
  }, []);

  const NAV = [
    { to: '/new-visit', icon: PlusCircle, label: t('nav.newVisit') },
    { to: '/triage',    icon: Activity,   label: t('nav.triageLive') },
    { to: '/history',   icon: History,    label: t('nav.history') },
    { to: '/settings',  icon: Settings,   label: t('nav.settings') },
  ];

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
          <span>{t('nav.logout')}</span>
        </button>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
