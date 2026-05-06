import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NewVisitPage from './pages/NewVisitPage';
import TriageLivePage from './pages/TriageLivePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import QueueDisplayPage from './pages/QueueDisplayPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/triage" replace />} />
            <Route path="new-visit" element={<NewVisitPage />} />
            <Route path="triage" element={<TriageLivePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="queue/:clinicCode" element={<QueueDisplayPage />} />
          <Route path="*" element={<Navigate to="/triage" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
