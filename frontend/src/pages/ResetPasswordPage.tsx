import { Navigate } from 'react-router-dom';

// Password reset is now handled entirely by Firebase (hosted action page).
export default function ResetPasswordPage() {
  return <Navigate to="/login" replace />;
}
