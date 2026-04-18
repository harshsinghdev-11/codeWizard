import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RegisterCompany from './components/RegisterCompany';
import Login from './components/Login';
import MyDocuments from './components/MyDocuments';

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

  const NavLink = ({ to, children }) => {
    const isActive = location.pathname === to;
    return (
      <Link 
        to={to} 
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-gray-100 text-[var(--color-text-primary)]' 
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-gray-50'
        }`}
      >
        {children}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col font-sans">
      {/* SaaS Glassmorphic Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--color-border-default)]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)] group-hover:text-indigo-600 transition-colors">
                Compliance Wizard
              </span>
            </Link>
            
            {isAuthenticated && (
              <nav className="hidden md:flex gap-1 items-center">
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/documents">My Documents</NavLink>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-red-600 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors">
                Logout
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-3 py-1.5 transition-colors">
                  Log in
                </Link>
                <Link to="/register" className="saas-btn-black">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-10 md:py-12">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login setAuthStatus={setAuthStatus} />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterCompany />} />
          <Route path="/documents" element={<ProtectedRoute isAuthenticated={isAuthenticated}><MyDocuments /></ProtectedRoute>} />
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
