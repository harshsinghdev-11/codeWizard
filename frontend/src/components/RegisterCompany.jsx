import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Globe2, ShieldCheck, CheckCircle2, AlertCircle, Copy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const RegisterCompany = () => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    industry: '',
    region: '',
    company_size: '',
    services: '',
    handles_user_data: false,
    kyc_required: false,
    transaction_volume: ''
  });

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [generatedCompanyId, setGeneratedCompanyId] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/registerCompany', formData);
      setGeneratedCompanyId(response.data.company_id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCompanyId);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      <div className="mb-8">
        <h2 className="text-3xl font-normal text-[var(--color-foreground)] tracking-tight mb-2">Register Entity</h2>
        <p className="text-secondary text-base">Create an account to track your compliance updates.</p>
      </div>

      <div className="google-card bg-white p-8 md:p-10">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
            className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-900">Registration Failed</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section: Basic Info */}
          <div>
            <h3 className="text-lg font-medium text-[var(--color-foreground)] border-b border-[var(--color-border)] pb-2 mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-secondary" /> Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="google-label">Company Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} 
                  placeholder="e.g. Acme Corp" className="google-input" />
              </div>
              <div>
                <label className="google-label">Secure Password</label>
                <input required type="password" name="password" value={formData.password} onChange={handleChange} 
                  placeholder="••••••••" className="google-input" />
              </div>
            </div>
          </div>

          {/* Section: Operational Details */}
          <div>
            <h3 className="text-lg font-medium text-[var(--color-foreground)] border-b border-[var(--color-border)] pb-2 mb-6 flex items-center gap-2 mt-8">
              <Globe2 className="w-5 h-5 text-secondary" /> Operational Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="google-label">Industry</label>
                <select required name="industry" value={formData.industry} onChange={handleChange} className="google-input bg-white">
                  <option value="" disabled>Select Industry</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Banking">Banking</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
              <div>
                <label className="google-label">Region</label>
                <select required name="region" value={formData.region} onChange={handleChange} className="google-input bg-white">
                  <option value="" disabled>Select Region</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                  <option value="Latin America">Latin America</option>
                  <option value="Global">Global</option>
                </select>
              </div>
              <div>
                <label className="google-label">Company Size</label>
                <select required name="company_size" value={formData.company_size} onChange={handleChange} className="google-input bg-white">
                  <option value="" disabled>Select Size</option>
                  <option value="1-50 employees">1-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-1000 employees">201-1000 employees</option>
                  <option value="1000+ employees">1000+ employees</option>
                </select>
              </div>
              <div>
                <label className="google-label">Services (comma separated)</label>
                <input required type="text" name="services" value={formData.services} onChange={handleChange} 
                  placeholder="e.g. Payments, Lending, Wealth Management" className="google-input" />
              </div>
            </div>
          </div>

          {/* Section: Compliance & Risk */}
          <div>
            <h3 className="text-lg font-medium text-[var(--color-foreground)] border-b border-[var(--color-border)] pb-2 mb-6 flex items-center gap-2 mt-8">
              <ShieldCheck className="w-5 h-5 text-secondary" /> Compliance & Risk Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="google-label">Transaction Volume</label>
                <select required name="transaction_volume" value={formData.transaction_volume} onChange={handleChange} className="google-input bg-white">
                  <option value="" disabled>Select Volume</option>
                  <option value="Low (< $1M/yr)">Low (&lt; $1M/yr)</option>
                  <option value="Medium ($1M - $50M/yr)">Medium ($1M - $50M/yr)</option>
                  <option value="High (> $50M/yr)">High (&gt; $50M/yr)</option>
                </select>
              </div>
              
              <div className="flex flex-col justify-center space-y-4 md:mt-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="handles_user_data" checked={formData.handles_user_data} onChange={handleChange}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="text-sm font-medium text-[var(--color-foreground)] group-hover:text-blue-600 transition-colors">Handles Sensitive User Data</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="kyc_required" checked={formData.kyc_required} onChange={handleChange}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                  <span className="text-sm font-medium text-[var(--color-foreground)] group-hover:text-blue-600 transition-colors">Requires KYC/AML Verification</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--color-border)] flex items-center justify-end gap-4">
            <Link to="/login" className="px-6 py-2.5 text-sm font-medium text-secondary hover:bg-[var(--color-surface-hover)] rounded transition-colors">
              Cancel
            </Link>
            <button type="submit" disabled={loading} className="google-btn px-8 py-2.5 text-sm flex items-center gap-2">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Registering...</>
              ) : (
                'Register Entity'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {generatedCompanyId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="bg-white rounded-xl shadow-2xl w-full max-w-md p-8 text-center"
            >
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-medium text-[var(--color-foreground)] mb-2">Registration Successful!</h3>
              <p className="text-secondary text-sm mb-6">Your entity has been securely registered. Please save your auto-generated Company ID below, as you will need it to log in.</p>
              
              <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg p-4 flex items-center justify-between mb-8">
                <span className="font-mono text-xl font-bold tracking-wider text-[var(--color-primary)]">{generatedCompanyId}</span>
                <button onClick={copyToClipboard} className="p-2 hover:bg-gray-200 rounded text-secondary transition-colors" title="Copy to clipboard">
                  <Copy className="w-5 h-5" />
                </button>
              </div>

              <button onClick={() => navigate('/login')} className="google-btn w-full py-3 text-base">
                Proceed to Login
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegisterCompany;
