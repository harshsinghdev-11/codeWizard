import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle } from 'lucide-react';

const Login = ({ setAuthStatus }) => {
  const [credentials, setCredentials] = useState({ company_id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/login', credentials);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('company_id', response.data.company.company_id);
      if (setAuthStatus) setAuthStatus(true);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-xl flex items-center justify-center mx-auto mb-5 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">Welcome back</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mt-2">Enter your credentials to access your dashboard</p>
        </div>

        <div className="saas-card p-6 sm:p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50/50 border border-red-100 rounded-md flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="saas-label">Company ID</label>
              <input 
                required 
                type="text" 
                name="company_id" 
                value={credentials.company_id} 
                onChange={handleChange} 
                placeholder="e.g. COMP-A8F2" 
                className="saas-input" 
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="saas-label !mb-0">Password</label>
                <a href="#" className="text-xs font-medium text-[var(--color-brand-primary)] hover:text-[var(--color-brand-primary-hover)]">Forgot password?</a>
              </div>
              <input 
                required 
                type="password" 
                name="password" 
                value={credentials.password} 
                onChange={handleChange} 
                placeholder="••••••••" 
                className="saas-input" 
              />
            </div>
            <button type="submit" disabled={loading} className="saas-btn-black w-full py-2.5 mt-2 flex justify-center items-center gap-2">
              {loading ? <div className="w-4 h-4 border-2 border-[var(--color-border-default)] border-t-[var(--color-text-primary)] rounded-full animate-spin"></div> : 'Sign In'}
            </button>
          </form>
        </div>
        
        <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
          Don't have an account? <Link to="/register" className="text-[var(--color-text-primary)] font-medium hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
