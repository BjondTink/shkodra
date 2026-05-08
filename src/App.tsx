import { useEffect, useState } from 'react';
import AdminDashboard from './components/AdminDashboard';
import LiveOutput from './components/LiveOutput';
import LoginForm from './components/LoginForm';

export default function App() {
  const [mode, setMode] = useState<'admin' | 'live'>('live'); // Default to live
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect mode from URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'admin') {
      setMode('admin');
    } else if (params.get('mode') === 'live') {
      setMode('live');
    }

    // Check manual auth token
    const token = localStorage.getItem('sp_admin_token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#050505]">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'live') {
    return <LiveOutput />;
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={(success) => setIsAuthenticated(success)} />;
  }

  return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />;
}
