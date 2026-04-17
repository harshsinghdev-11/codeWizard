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
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="google-card p-8 md:p-10 w-full max-w-md bg-white">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-50 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-medium text-[var(--color-foreground)]">Sign In</h2>
          <p className="text-sm text-secondary mt-1">Access your Compliance Dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="google-label">Company ID</label>
            <input 
              required 
              type="text" 
              name="company_id" 
              value={credentials.company_id} 
              onChange={handleChange} 
              placeholder="e.g. COMP-A8F2" 
              className="google-input" 
            />
          </div>
          <div>
            <label className="google-label">Password</label>
            <input 
              required 
              type="password" 
              name="password" 
              value={credentials.password} 
              onChange={handleChange} 
              placeholder="••••••••" 
              className="google-input" 
            />
          </div>
          <button type="submit" disabled={loading} className="google-btn w-full py-2.5 mt-2 flex justify-center items-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-secondary">
            Don't have an account? <Link to="/register" className="text-[var(--color-primary)] font-medium hover:underline">Register your entity</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
