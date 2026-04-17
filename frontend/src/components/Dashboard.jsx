import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, FileText, ShieldAlert, CheckCircle2, Sparkles, X, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState('');
  const [aiError, setAiError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/feed/getFeed');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch regulatory feed or no pending feeds available.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const runAiAnalysis = async () => {
    setIsModalOpen(true);
    setAiLoading(true);
    setAiError('');
    setAiReport('');

    try {
      const response = await axios.post('http://localhost:5000/api/analyze-gap', {
        feed_id: data.feed.feed_id
      });
      setAiReport(response.data.report);
    } catch (err) {
      setAiError(err.response?.data?.message || 'An error occurred during AI analysis.');
    } finally {
      setAiLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAiReport('');
    setAiError('');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-[var(--color-border-default)] border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
        <p className="text-[var(--color-text-secondary)] text-sm font-medium">Syncing compliance intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="saas-card p-10 text-center max-w-md mx-auto mt-16">
        <div className="w-14 h-14 bg-[var(--color-bg-base)] border border-[var(--color-border-default)] rounded-xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <ShieldAlert className="w-6 h-6 text-[var(--color-text-tertiary)]" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-2">Inbox Zero</h2>
        <p className="text-[var(--color-text-secondary)] text-sm">{error || "No pending regulatory feeds require your attention."}</p>
      </div>
    );
  }

  const { feed, summary, impactedDocuments } = data;

  const getImpactDetails = (level) => {
    switch(level) {
      case 'High': return { bg: 'bg-[var(--color-status-danger-bg)]', text: 'text-[var(--color-status-danger)]', icon: <Activity className="w-4 h-4" /> };
      case 'Medium': return { bg: 'bg-[var(--color-status-warning-bg)]', text: 'text-[var(--color-status-warning)]', icon: <Activity className="w-4 h-4" /> };
      default: return { bg: 'bg-[var(--color-status-success-bg)]', text: 'text-[var(--color-status-success)]', icon: <CheckCircle2 className="w-4 h-4" /> };
    }
  };

  const impactDetails = getImpactDetails(feed.impact_level);

  return (
    <div className="space-y-6 pb-12 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">Overview</h2>
      </div>

      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="saas-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-6">
            <div className={`p-2 rounded-md ${impactDetails.bg} ${impactDetails.text}`}>
              {impactDetails.icon}
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Threat Level</p>
          </div>
          <p className={`text-4xl font-bold tracking-tight ${impactDetails.text}`}>{feed.impact_level}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="saas-card p-6 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-md bg-[var(--color-bg-base)] border border-[var(--color-border-default)] text-[var(--color-text-secondary)]">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">Policies Impacted</p>
          </div>
          <p className="text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">{summary.total_documents_impacted}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Main Feed Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
          onClick={runAiAnalysis}
          className="saas-card lg:col-span-2 overflow-hidden flex flex-col cursor-pointer group relative"
        >
          {/* Magical Hover State Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-primary-light)] to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 z-0 pointer-events-none"></div>
          
          <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-10">
            <div className="bg-white border border-[var(--color-border-default)] shadow-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-primary)]">
              <Sparkles className="w-3 h-3" /> Run AI Audit
            </div>
          </div>
          
          <div className="p-8 md:p-10 flex-1 relative z-10">
            <div className="flex items-center gap-3 mb-5">
              <span className="px-2.5 py-1 rounded border border-[var(--color-border-default)] bg-[var(--color-bg-base)] text-[11px] font-semibold tracking-wider uppercase text-[var(--color-text-secondary)]">
                Update
              </span>
              <span className="text-sm text-[var(--color-text-tertiary)]">{new Date(feed.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>

            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-8 leading-snug group-hover:text-[var(--color-brand-primary)] transition-colors">
              {feed.title}
            </h3>
            
            <div className="flex flex-wrap gap-x-10 gap-y-4 text-sm mb-10 pb-8 border-b border-[var(--color-border-default)]">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-text-tertiary)]">Source</span> 
                <span className="font-medium text-[var(--color-text-primary)]">{feed.source}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-text-tertiary)]">Regulation</span> 
                <span className="font-medium text-[var(--color-brand-primary)] bg-[var(--color-brand-primary-light)] px-2 py-0.5 rounded text-xs">{feed.related_regulation}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] uppercase tracking-wider font-medium text-[var(--color-text-tertiary)]">Region</span> 
                <span className="font-medium text-[var(--color-text-primary)]">{feed.region}</span>
              </div>
            </div>

            <div className="space-y-10">
              <div>
                <h4 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-3">Executive Summary</h4>
                <p className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed">{feed.summary}</p>
              </div>
              
              <div>
                <h4 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-4">Key Changes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feed.key_changes.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-primary)] mt-2 shrink-0"></div>
                      <span className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Lists */}
        <div className="space-y-6 flex flex-col h-full">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="saas-card flex flex-col flex-1 max-h-[800px]">
            <div className="px-5 py-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                Internal Documents
              </h4>
              <span className="bg-[var(--color-bg-base)] text-[var(--color-text-secondary)] text-xs py-0.5 px-2 rounded font-medium border border-[var(--color-border-default)]">{impactedDocuments.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {impactedDocuments.map((doc, idx) => (
                <div key={idx} className="p-3 hover:bg-[var(--color-bg-base)] rounded-md cursor-pointer flex items-center gap-3 transition-colors group">
                  <div className="p-2 bg-white border border-[var(--color-border-default)] shadow-sm rounded text-[var(--color-text-tertiary)] shrink-0 group-hover:border-[var(--color-brand-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{doc.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">{doc.owner}</p>
                  </div>
                </div>
              ))}
              {impactedDocuments.length === 0 && <p className="text-sm text-[var(--color-text-tertiary)] p-6 text-center">No documents currently mapped to this regulation.</p>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-modal border border-[var(--color-border-default)] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-bg-base)]/50">
                <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-primary)] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--color-brand-primary)]" />
                  AI Document Audit
                </h3>
                <button onClick={closeModal} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1.5 rounded-md hover:bg-[var(--color-border-default)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto">
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-24 space-y-6">
                    <div className="relative flex items-center justify-center w-16 h-16">
                      <div className="absolute inset-0 rounded-full border-2 border-[var(--color-brand-primary-light)]"></div>
                      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--color-brand-primary)] animate-spin"></div>
                      <Sparkles className="w-6 h-6 ai-gradient-text animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-[var(--color-text-primary)] mb-1">Synthesizing Compliance Map...</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">Cross-referencing {feed.related_regulation} against internal policies.</p>
                    </div>
                  </div>
                )}

                {aiError && (
                  <div className="p-5 bg-[var(--color-status-danger-bg)] border border-red-100 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[var(--color-status-danger)] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Audit Interrupted</h4>
                      <p className="text-sm text-red-700 mt-1">{aiError}</p>
                      <button onClick={closeModal} className="mt-3 text-sm font-medium text-[var(--color-status-danger)] hover:underline">Close window</button>
                    </div>
                  </div>
                )}

                {aiReport && !aiLoading && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="prose prose-sm md:prose-base max-w-none prose-slate
                      prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-[var(--color-text-primary)]
                      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg 
                      prose-p:text-[var(--color-text-secondary)] prose-p:leading-relaxed
                      prose-li:text-[var(--color-text-secondary)]
                      prose-strong:text-[var(--color-text-primary)] prose-strong:font-semibold
                      prose-a:text-[var(--color-brand-primary)] prose-a:no-underline hover:prose-a:underline">
                      <ReactMarkdown>{aiReport}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
