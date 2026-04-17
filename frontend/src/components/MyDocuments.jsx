import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Upload, Type, AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyDocuments = () => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Policy',
    owner: ''
  });
  const [inputType, setInputType] = useState('file'); // 'file' or 'text'
  const [file, setFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessData(null);

    try {
      const companyId = localStorage.getItem('company_id');
      if (!companyId) {
        throw new Error("You must be logged in to upload documents.");
      }

      const submitData = new FormData();
      submitData.append('company_id', companyId);
      submitData.append('title', formData.title);
      submitData.append('type', formData.type);
      submitData.append('owner', formData.owner);

      if (inputType === 'file') {
        if (!file) throw new Error("Please select a file to upload.");
        submitData.append('document', file);
      } else {
        if (!textContent.trim()) throw new Error("Please paste your document text.");
        submitData.append('text_content', textContent);
      }

      const response = await axios.post('http://localhost:5000/api/documents/upload', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessData(response.data.document);
      
      // Reset form
      setFormData({ title: '', type: 'Policy', owner: '' });
      setFile(null);
      setTextContent('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to process document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-10">
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-2">Internal Policies</h2>
        <p className="text-[var(--color-text-secondary)] text-base">Upload your documents. Our AI will automatically map them to global regulations.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="saas-card p-8 md:p-10">
            <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-primary)] mb-8 flex items-center gap-2 border-b border-[var(--color-border-default)] pb-4">
              <Upload className="w-4 h-4 text-[var(--color-brand-primary)]" /> Ingestion Pipeline
            </h3>

            {error && (
              <div className="mb-8 p-4 bg-[var(--color-status-danger-bg)] border border-red-100 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[var(--color-status-danger)] shrink-0 mt-0.5" />
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="saas-label">Document Title</label>
                  <input required type="text" name="title" value={formData.title} onChange={handleChange} 
                    placeholder="e.g. Data Privacy Protocol v2" className="saas-input" />
                </div>
                <div>
                  <label className="saas-label">Document Type</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="saas-input">
                    <option value="Policy">Policy</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Guideline">Guideline</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="saas-label">Owner / Department</label>
                <input required type="text" name="owner" value={formData.owner} onChange={handleChange} 
                  placeholder="e.g. Legal Operations" className="saas-input" />
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--color-border-default)]">
                <div className="flex bg-[var(--color-bg-hover)] p-1 rounded-lg w-fit mb-6">
                  <button type="button" onClick={() => setInputType('file')} 
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${inputType === 'file' ? 'bg-white text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                    Upload File (.doc, .txt)
                  </button>
                  <button type="button" onClick={() => setInputType('text')} 
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${inputType === 'text' ? 'bg-white text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}>
                    Paste Content
                  </button>
                </div>

                {inputType === 'file' ? (
                  <div className="border-2 border-dashed border-[var(--color-border-hover)] rounded-xl p-10 text-center bg-[var(--color-bg-base)] hover:bg-[var(--color-bg-hover)] hover:border-[var(--color-brand-primary)] transition-all duration-200 group">
                    <input type="file" id="file-upload" className="hidden" accept=".doc,.docx,.txt" onChange={handleFileChange} />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                      <div className="w-12 h-12 bg-white rounded-full border border-[var(--color-border-default)] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:border-[var(--color-brand-primary)] group-hover:text-[var(--color-brand-primary)] transition-all shadow-sm">
                        <Upload className="w-5 h-5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-brand-primary)] transition-colors" />
                      </div>
                      <span className="text-sm font-semibold text-[var(--color-text-primary)]">Click to browse or drag file here</span>
                      <span className="text-[13px] text-[var(--color-text-tertiary)] mt-1.5">Supports .doc, .docx, .txt (Max 10MB)</span>
                    </label>
                    {file && <p className="mt-5 text-sm font-medium text-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)] py-2 px-4 rounded-full inline-block border border-[var(--color-brand-primary)]/20 shadow-sm">{file.name}</p>}
                  </div>
                ) : (
                  <div>
                    <textarea 
                      rows="8" 
                      value={textContent} 
                      onChange={(e) => setTextContent(e.target.value)} 
                      placeholder="Paste the full plaintext of your document here..." 
                      className="saas-input font-mono text-[13px] leading-relaxed resize-y min-h-[200px]" 
                    ></textarea>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-6">
                <button type="submit" disabled={loading} className="saas-btn-primary px-6 py-2.5 w-full sm:w-auto text-[15px]">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Initializing AI...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> 
                      <span>Upload & Auto-Tag</span>
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar for Results */}
        <div className="space-y-6">
          <AnimatePresence>
            {successData && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} 
                className="saas-card bg-[var(--color-status-success-bg)] border-[var(--color-status-success)]/20 p-6 overflow-hidden relative">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5 border-b border-[var(--color-status-success)]/20 pb-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-[var(--color-status-success)]" />
                      <h3 className="text-sm font-semibold text-[var(--color-status-success)]">Mapping Successful</h3>
                    </div>
                    <button onClick={() => setSuccessData(null)} className="text-[var(--color-status-success)]/70 hover:text-[var(--color-status-success)]">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-lg p-5 shadow-sm border border-[var(--color-status-success)]/10">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-text-tertiary)] mb-2">Detected Regulation</p>
                    <p className="text-xl font-bold ai-gradient-text flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[var(--color-brand-primary)]" /> {successData.related_regulation}
                    </p>
                  </div>

                  <div className="mt-5 space-y-2">
                    <p className="text-[13px] text-green-900"><span className="font-semibold opacity-70">Document ID:</span> {successData.doc_id}</p>
                    <p className="text-[13px] text-green-900"><span className="font-semibold opacity-70">Title:</span> {successData.title}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="saas-card p-6 bg-[var(--color-bg-base)] border-transparent">
            <h4 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-brand-primary)]" /> Engine Architecture
            </h4>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-4">
              Upon ingestion, our Natural Language Processing engine analyzes the semantic structure of your document to map it to global regulatory frameworks (e.g., GDPR, HIPAA).
            </p>
            <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
              This creates a continuous compliance link. If the underlying regulation shifts, our AI will instantly perform a gap analysis on this specific document.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyDocuments;
