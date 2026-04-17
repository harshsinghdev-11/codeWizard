import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, FileText, ShieldAlert, CheckCircle2, Sparkles, X } from 'lucide-react';
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
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-secondary font-medium">Loading compliance intelligence...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="google-card p-8 text-center max-w-md mx-auto mt-16">
        <ShieldAlert className="w-12 h-12 text-[var(--color-text-secondary)] mx-auto mb-4" />
        <h2 className="text-xl font-medium mb-2 text-[var(--color-foreground)]">You're all caught up</h2>
        <p className="text-secondary text-sm">{error || "No pending regulatory feeds require your attention."}</p>
      </div>
    );
  }

  const { feed, summary, impactedDocuments } = data;

  const getImpactDetails = (level) => {
    switch(level) {
      case 'High': return { color: 'var(--color-danger)', bg: 'bg-red-50', text: 'text-red-700', border: 'border-l-[var(--color-danger)]' };
      case 'Medium': return { color: 'var(--color-warning)', bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-l-[var(--color-warning)]' };
      default: return { color: 'var(--color-success)', bg: 'bg-green-50', text: 'text-green-800', border: 'border-l-[var(--color-success)]' };
    }
  };

  const impactDetails = getImpactDetails(feed.impact_level);

  return (
    <div className="space-y-6 pb-12 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-normal text-[var(--color-foreground)] tracking-tight">Compliance Overview</h2>
      </div>

      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="google-card p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-secondary" />
            <p className="text-sm font-medium text-secondary">Impact Level</p>
          </div>
          <p className="text-3xl font-normal" style={{ color: impactDetails.color }}>{feed.impact_level}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="google-card p-5 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-5 h-5 text-secondary" />
            <p className="text-sm font-medium text-secondary">Documents to Review</p>
          </div>
          <p className="text-3xl font-normal text-[var(--color-foreground)]">{summary.total_documents_impacted}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Feed Section */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
          onClick={runAiAnalysis}
          className={`google-card bg-white border-l-4 ${impactDetails.border} lg:col-span-2 overflow-hidden flex flex-col cursor-pointer hover:shadow-lg transition-shadow relative group`}
        >
          {/* Subtle click indicator */}
          <div className="absolute top-4 right-4 bg-blue-50 text-[var(--color-primary)] px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Sparkles className="w-3 h-3" /> Click to run AI Gap Analysis
          </div>
          
          <div className="p-6 md:p-8 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${impactDetails.bg} ${impactDetails.text}`}>
                New Regulation
              </span>
              <span className="text-sm text-secondary ml-auto mr-32 group-hover:mr-0 transition-all">{new Date(feed.published_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>

            <h3 className="text-2xl font-medium text-[var(--color-foreground)] mb-6 leading-snug">{feed.title}</h3>
            
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm mb-8 pb-6 border-b border-[var(--color-border)]">
              <div className="flex flex-col">
                <span className="text-xs text-secondary uppercase tracking-wide font-medium mb-1">Source</span> 
                <span className="font-medium text-[var(--color-foreground)]">{feed.source}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-secondary uppercase tracking-wide font-medium mb-1">Regulation</span> 
                <span className="font-medium text-[var(--color-primary)]">{feed.related_regulation}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-secondary uppercase tracking-wide font-medium mb-1">Region</span> 
                <span className="font-medium text-[var(--color-foreground)]">{feed.region}</span>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h4 className="text-base font-medium text-[var(--color-foreground)] mb-3">Executive Summary</h4>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{feed.summary}</p>
              </div>
              
              <div>
                <h4 className="text-base font-medium text-[var(--color-foreground)] mb-4">Key Regulatory Changes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {feed.key_changes.map((change, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-[var(--color-background)] google-border">
                      <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
                      <span className="text-sm text-[var(--color-foreground)] leading-relaxed">{change}</span>
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
            className="google-card flex flex-col flex-1 max-h-[800px]">
            <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background)] rounded-t-8">
              <h4 className="text-sm font-medium text-[var(--color-foreground)] flex items-center gap-2">
                <FileText className="w-4 h-4 text-secondary" /> Required Document Updates
              </h4>
              <span className="bg-white border border-[var(--color-border)] text-secondary text-xs py-0.5 px-2 rounded-full font-medium">{impactedDocuments.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {impactedDocuments.map((doc, idx) => (
                <div key={idx} className="p-3 hover:bg-[var(--color-surface-hover)] rounded-md cursor-pointer flex items-center gap-3 transition-colors">
                  <div className="p-2 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-secondary shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-foreground)] truncate">{doc.title}</p>
                    <p className="text-xs text-secondary truncate mt-1">Owner: {doc.owner}</p>
                  </div>
                </div>
              ))}
              {impactedDocuments.length === 0 && <p className="text-sm text-secondary p-4 text-center">No documents mapped.</p>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* AI Analysis Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background)]">
                <h3 className="text-lg font-medium text-[var(--color-foreground)] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[var(--color-primary)]" />
                  Document Gap Analysis
                </h3>
                <button onClick={closeModal} className="text-secondary hover:text-[var(--color-foreground)] transition-colors p-1 rounded-md hover:bg-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-blue-100 rounded-full"></div>
                      <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                      <Sparkles className="w-4 h-4 text-[var(--color-primary)] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-[var(--color-foreground)]">Analyzing Document Impact...</p>
                      <p className="text-sm text-secondary mt-1">Comparing {feed.related_regulation} against internal policies.</p>
                    </div>
                  </div>
                )}

                {aiError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 mt-4">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-red-900">Analysis Failed</h4>
                      <p className="text-sm text-red-700 mt-1">{aiError}</p>
                      <button onClick={closeModal} className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline">Close</button>
                    </div>
                  </div>
                )}

                {aiReport && !aiLoading && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="prose prose-sm md:prose-base prose-blue max-w-none prose-headings:font-medium prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-[var(--color-text-secondary)] prose-li:text-[var(--color-text-secondary)]">
                      <ReactMarkdown>{aiReport}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #dadce0; border-radius: 4px; border: 2px solid white; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #bdc1c6; }
      `}} />
    </div>
  );
};

export default Dashboard;
