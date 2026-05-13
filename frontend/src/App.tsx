import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import NetworkErrorBanner from './components/NetworkErrorBanner';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import NotFoundPage from './pages/NotFoundPage';
import NewVisitPage from './pages/NewVisitPage';
import TriageLivePage from './pages/TriageLivePage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import QueueDisplayPage from './pages/QueueDisplayPage';

function AppRoutes() {
  const { initializing } = useAuth();
  if (initializing) return <LoadingScreen />;

  return (
    <>
      <NetworkErrorBanner />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/new-visit" element={<NewVisitPage />} />
          <Route path="/triage" element={<TriageLivePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/queue/:clinicCode" element={<QueueDisplayPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
