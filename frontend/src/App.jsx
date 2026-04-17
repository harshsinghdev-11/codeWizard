import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RegisterCompany from './components/RegisterCompany';
import Login from './components/Login';

const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent({ isAuthenticated, setAuthStatus }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('company_id');
    setAuthStatus(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)] font-sans flex flex-col">
      <header className="bg-white border-b border-[var(--color-border)] px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[var(--color-primary)] flex items-center justify-center font-bold text-white text-sm">
            CW
          </div>
          <Link to="/" className="text-xl font-medium text-[var(--color-foreground)] tracking-tight hover:text-[var(--color-primary)] transition-colors">
            Compliance Wizard
          </Link>
        </div>
        <nav>
          <ul className="flex gap-4 text-sm font-medium text-[var(--color-text-secondary)] items-center">
            {isAuthenticated ? (
              <>
                <li>
                  <Link to="/" className={`px-4 py-2 rounded-md transition-colors block ${location.pathname === '/' ? 'text-[var(--color-primary)] bg-blue-50' : 'hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]'}`}>
                    Dashboard
                  </Link>
                </li>
                <li>
                  <button onClick={handleLogout} className="px-4 py-2 rounded-md hover:text-red-600 hover:bg-red-50 transition-colors block font-medium">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link to="/login" className={`px-4 py-2 rounded-md transition-colors block ${location.pathname === '/login' ? 'text-[var(--color-primary)] bg-blue-50' : 'hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]'}`}>
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/register" className={`px-4 py-2 rounded-md transition-colors block ${location.pathname === '/register' ? 'text-[var(--color-primary)] bg-blue-50' : 'hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-hover)]'}`}>
                    Register Entity
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </header>

      <main className="p-6 md:p-8 max-w-[1400px] mx-auto w-full flex-1">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login setAuthStatus={setAuthStatus} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterCompany />} />
          <Route path="/" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <Router>
      <AppContent isAuthenticated={isAuthenticated} setAuthStatus={setIsAuthenticated} />
    </Router>
  );
}

export default App;
