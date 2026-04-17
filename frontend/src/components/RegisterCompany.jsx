import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ShieldCheck, CheckCircle2, AlertCircle, Copy, X } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto pb-12 relative">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] tracking-tight mb-3">Create your entity</h2>
        <p className="text-[var(--color-text-secondary)] text-sm md:text-base max-w-lg mx-auto">Set up your compliance profile to automatically track and map regulatory updates against your internal policies.</p>
      </div>

      <div className="saas-card bg-white p-6 md:p-10">
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} 
            className="mb-8 p-4 bg-red-50/50 border border-red-100 rounded-lg flex items-start gap-3">
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
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] pb-3 border-b border-[var(--color-border-default)] mb-5">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="saas-label">Company Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} 
                  placeholder="e.g. Acme Corp" className="saas-input" />
              </div>
              <div>
                <label className="saas-label">Secure Password</label>
                <input required type="password" name="password" value={formData.password} onChange={handleChange} 
                  placeholder="••••••••" className="saas-input" />
              </div>
            </div>
          </div>

          {/* Section: Operational Details */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] pb-3 border-b border-[var(--color-border-default)] mb-5 mt-8">
              Operational Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="saas-label">Industry</label>
                <select required name="industry" value={formData.industry} onChange={handleChange} className="saas-input">
                  <option value="" disabled>Select Industry</option>
                  <option value="Fintech">Fintech</option>
                  <option value="Banking">Banking</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
              <div>
                <label className="saas-label">Region</label>
                <select required name="region" value={formData.region} onChange={handleChange} className="saas-input">
                  <option value="" disabled>Select Region</option>
                  <option value="North America">North America</option>
                  <option value="Europe">Europe</option>
                  <option value="Asia Pacific">Asia Pacific</option>
                  <option value="Latin America">Latin America</option>
                  <option value="Global">Global</option>
                </select>
              </div>
              <div>
                <label className="saas-label">Company Size</label>
                <select required name="company_size" value={formData.company_size} onChange={handleChange} className="saas-input">
                  <option value="" disabled>Select Size</option>
                  <option value="1-50 employees">1-50 employees</option>
                  <option value="51-200 employees">51-200 employees</option>
                  <option value="201-1000 employees">201-1000 employees</option>
                  <option value="1000+ employees">1000+ employees</option>
                </select>
              </div>
              <div>
                <label className="saas-label">Services (comma separated)</label>
                <input required type="text" name="services" value={formData.services} onChange={handleChange} 
                  placeholder="e.g. Payments, Lending" className="saas-input" />
              </div>
            </div>
          </div>

          {/* Section: Compliance & Risk */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] pb-3 border-b border-[var(--color-border-default)] mb-5 mt-8">
              Risk Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="saas-label">Transaction Volume</label>
                <select required name="transaction_volume" value={formData.transaction_volume} onChange={handleChange} className="saas-input">
                  <option value="" disabled>Select Volume</option>
                  <option value="Low (< $1M/yr)">Low (&lt; $1M/yr)</option>
                  <option value="Medium ($1M - $50M/yr)">Medium ($1M - $50M/yr)</option>
                  <option value="High (> $50M/yr)">High (&gt; $50M/yr)</option>
                </select>
              </div>
              
              <div className="flex flex-col justify-center space-y-3 md:mt-6 pl-1">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="handles_user_data" checked={formData.handles_user_data} onChange={handleChange}
                    className="w-4 h-4 text-[var(--color-brand-primary)] border-[var(--color-border-default)] rounded focus:ring-[var(--color-brand-primary)] transition-colors" />
                  <span className="text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors">Handles Sensitive User Data</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" name="kyc_required" checked={formData.kyc_required} onChange={handleChange}
                    className="w-4 h-4 text-[var(--color-brand-primary)] border-[var(--color-border-default)] rounded focus:ring-[var(--color-brand-primary)] transition-colors" />
                  <span className="text-sm text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors">Requires KYC/AML Verification</span>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-[var(--color-border-default)] flex items-center justify-between">
            <Link to="/login" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Already have an account?
            </Link>
            <button type="submit" disabled={loading} className="saas-btn-primary px-8 py-2.5">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> 
                  <span>Registering...</span>
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {generatedCompanyId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg-base)]/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              className="bg-white rounded-2xl shadow-modal border border-[var(--color-border-default)] w-full max-w-sm p-8 text-center"
            >
              <div className="w-14 h-14 bg-[var(--color-brand-primary-light)] text-[var(--color-brand-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-2">Entity Registered</h3>
              <p className="text-[var(--color-text-secondary)] text-sm mb-8 leading-relaxed">Your compliance profile is active. Please save your auto-generated Company ID below, as you will need it to log in.</p>
              
              <div className="bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-lg p-3 flex items-center justify-between mb-8 group hover:border-[var(--color-border-hover)] transition-colors">
                <span className="font-mono text-lg font-bold tracking-wide text-[var(--color-text-primary)] px-2">{generatedCompanyId}</span>
                <button onClick={copyToClipboard} className="p-2 bg-white border border-[var(--color-border-default)] hover:bg-[var(--color-bg-base)] rounded-md text-[var(--color-text-secondary)] transition-colors shadow-sm" title="Copy to clipboard">
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <button onClick={() => navigate('/login')} className="saas-btn-black w-full py-2.5">
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
