import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, FileText, ShieldAlert, CheckCircle2, Sparkles, X, Activity, Database, CheckSquare, FileCode2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [clientDocuments, setClientDocuments] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // AI Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiReport, setAiReport] = useState(null);
  const [aiError, setAiError] = useState('');
  const [selectedFeed, setSelectedFeed] = useState(null);

  const companyId = localStorage.getItem('company_id');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedResponse, docsResponse, actionsResponse] = await Promise.all([
          axios.get('https://codewizard-fpjx.onrender.com/feed/getFeeds').catch(() => ({ data: null })),
          companyId ? axios.get(`https://codewizard-fpjx.onrender.com/api/documents/${companyId}`).catch(() => ({ data: { documents: [] } })) : Promise.resolve({ data: { documents: [] } }),
          companyId ? axios.get(`https://codewizard-fpjx.onrender.com/api/action-items/${companyId}`).catch(() => ({ data: { action_items: [] } })) : Promise.resolve({ data: { action_items: [] } })
        ]);

        if (!feedResponse.data) {
          setError('Failed to fetch regulatory feed or no pending feeds available.');
        } else {
          console.log("Fetched feed data:", feedResponse.data);
          setData(feedResponse.data);
        }

        setClientDocuments(docsResponse.data.documents || []);
        setActionItems(actionsResponse.data.action_items || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to sync compliance intelligence.');
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const runAiAnalysis = async (feedItem) => {
    setIsModalOpen(true);
    setAiLoading(true);
    setAiError('');
    setAiReport(null);
    setSelectedFeed(feedItem);

    try {
      if (!companyId) throw new Error("You must be logged in to run analysis.");

      const response = await axios.post('https://codewizard-fpjx.onrender.com/api/analyze-gap', {
        feed_id: feedItem.feed_id,
        company_id: companyId
      });
      
      const report = response.data.data;
      setAiReport(report);

      // Automatically persist action items to the dashboard
      if (report.action_items && report.action_items.length > 0) {
        const saveRes = await axios.post(`https://codewizard-fpjx.onrender.com/api/action-items/${companyId}`, {
          items: report.action_items,
          related_regulation: feedItem.related_regulation
        });
        setActionItems(saveRes.data.action_items);
      }

    } catch (err) {
      setAiError(err.response?.data?.message || err.message || 'An error occurred during AI analysis.');
    } finally {
      setAiLoading(false);
    }
  };

  const dismissActionItem = async (itemId) => {
    try {
      const res = await axios.delete(`https://codewizard-fpjx.onrender.com/api/action-items/${companyId}/${itemId}`);
      setActionItems(res.data.action_items);
    } catch (err) {
      console.error("Failed to dismiss item:", err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setAiReport(null);
    setAiError('');
    setSelectedFeed(null);
  };

  // Memoized Chart Data
  const chartData = useMemo(() => {
    const counts = {};
    clientDocuments.forEach(doc => {
      const reg = doc.related_regulation || 'Unmapped';
      counts[reg] = (counts[reg] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [clientDocuments]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-[var(--color-border-default)] border-t-[var(--color-brand-primary)] rounded-full animate-spin"></div>
        <p className="text-[var(--color-text-secondary)] text-sm font-medium">Loading Enterprise Dashboard...</p>
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

  const feeds = data.feeds || (data.feed ? [data.feed] : []);
  const { summary, impactedDocuments = [], feedInsights = [] } = data;
  const selectedFeedImpactedDocuments = selectedFeed
    ? impactedDocuments.filter((doc) => doc.related_regulation === selectedFeed.related_regulation)
    : [];
  const isHealthy = actionItems.length === 0 && impactedDocuments.length === 0;

  const getSeverityStyles = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-50 border-red-200 text-red-700';
      case 'High': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Medium': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-8 pb-12 relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">Command Center</h2>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="saas-card p-6 flex items-center gap-5">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {isHealthy ? <CheckCircle2 className="w-7 h-7" /> : <Activity className="w-7 h-7" />}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Global Health</p>
            <p className={`text-3xl font-bold ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
              {isHealthy ? '100%' : 'At Risk'}
            </p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="saas-card p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-orange-100 text-orange-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Active Threats</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{feeds.length}</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="saas-card p-6 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-600">
            <Database className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Vault Size</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{clientDocuments.length}</p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Section */}
        <div className="lg:col-span-2 space-y-4">
          {feeds.map((feed, index) => {
            const insight = feedInsights.find((item) => item.feed_id === feed.feed_id);
            return (
              <motion.div
                key={feed.feed_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.08 }}
                onClick={() => runAiAnalysis(feed)}
                className="saas-card overflow-hidden flex flex-col cursor-pointer group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-primary-light)] to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-500 z-0 pointer-events-none"></div>

                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 z-10">
                  <div className="bg-white border border-[var(--color-border-default)] shadow-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-medium text-[var(--color-brand-primary)]">
                    <Sparkles className="w-3 h-3" /> Run Structured Audit
                  </div>
                </div>

                <div className="p-8 md:p-10 flex-1 relative z-10">
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className="px-2.5 py-1 rounded border border-red-200 bg-red-50 text-[11px] font-bold tracking-wider uppercase text-red-600">
                      Incoming Threat
                    </span>
                    <span className="text-sm text-[var(--color-text-tertiary)]">{new Date(feed.published_date).toLocaleDateString()}</span>
                    <span className="px-2.5 py-1 rounded border border-indigo-200 bg-indigo-50 text-[11px] font-bold tracking-wider uppercase text-indigo-600">
                      {feed.related_regulation}
                    </span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)] mb-5 leading-snug group-hover:text-[var(--color-brand-primary)] transition-colors">
                    {feed.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-base)] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">Impact Level</p>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">{feed.impact_level}</p>
                    </div>
                    
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">Executive Summary</h4>
                      <p className="text-[var(--color-text-secondary)] text-[15px] leading-relaxed">{feed.summary}</p>
                    </div>

                    {feed.key_changes?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-secondary)] mb-2">Key Changes</h4>
                        <div className="flex flex-wrap gap-2">
                          {feed.key_changes.map((change, changeIndex) => (
                            <span
                              key={`${feed.feed_id}-${changeIndex}`}
                              className="px-3 py-2 rounded-full text-xs font-medium border border-[var(--color-border-default)] bg-white text-[var(--color-text-secondary)]"
                            >
                              {change}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {feeds.length === 0 && (
            <div className="saas-card p-10 text-center text-sm text-[var(--color-text-tertiary)]">
              No pending feeds available.
            </div>
          )}
        </div>

        {/* Data Visualizations */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="saas-card flex flex-col p-6 h-full min-h-[300px]">
          <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4 text-center">Vault Distribution</h4>
          <div className="flex-1 min-h-[250px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-[var(--color-text-tertiary)]">No documents uploaded.</div>
            )}
          </div>
          {chartData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {chartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Persistent Action Center */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="saas-card flex flex-col overflow-hidden max-h-[500px]">
          <div className="px-6 py-5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)] flex items-center justify-between">
            <h4 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[var(--color-brand-primary)]" /> Action Center
            </h4>
            <span className="bg-orange-100 text-orange-700 text-xs py-1 px-2.5 rounded-full font-bold">{actionItems.length} Pending</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {actionItems.map((item) => (
              <div key={item._id} className="p-4 border border-[var(--color-border-default)] rounded-xl hover:border-[var(--color-brand-primary)] transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-brand-primary)]">{item.document_title}</span>
                  <button onClick={() => dismissActionItem(item._id)} className="text-[var(--color-text-tertiary)] hover:text-green-600 transition-colors" title="Mark as resolved">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm font-mono text-[var(--color-text-secondary)] bg-[var(--color-bg-base)] p-3 rounded-lg border border-[var(--color-border-subtle)]">
                  {item.exact_change_instructions}
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                  <Activity className="w-3 h-3" /> Related to {item.related_regulation}
                </div>
              </div>
            ))}
            {actionItems.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center p-10 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">All caught up! No pending actions.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Advanced Data Grid (Document Vault) */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="saas-card flex flex-col overflow-hidden max-h-[500px]">
          <div className="px-6 py-5 border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)]">
            <h4 className="text-base font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Database className="w-5 h-5 text-[var(--color-text-secondary)]" /> Document Vault
            </h4>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--color-bg-base)] sticky top-0 border-b border-[var(--color-border-default)]">
                <tr>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Regulation</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-tertiary)] text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-default)]">
                {clientDocuments.map((doc, idx) => {
                  const isImpacted = impactedDocuments.some(idoc => idoc._id === doc._id);
                  return (
                    <tr key={idx} className="hover:bg-[var(--color-bg-base)] transition-colors">
                      <td className="px-6 py-4 font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                        {doc.title}
                      </td>
                      <td className="px-6 py-4 text-[var(--color-text-secondary)]">{doc.owner}</td>
                      <td className="px-6 py-4">
                        <span className="bg-indigo-50 text-indigo-700 text-xs py-1 px-2.5 rounded-full font-medium border border-indigo-200">
                          {doc.related_regulation}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isImpacted ? (
                          <span className="bg-red-50 text-red-700 text-xs py-1 px-2.5 rounded-full font-medium flex items-center gap-1 w-max border border-red-200">
                            <AlertCircle className="w-3 h-3" /> At Risk
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-700 text-xs py-1 px-2.5 rounded-full font-medium flex items-center gap-1 w-max border border-green-200">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {clientDocuments.length === 0 && (
              <p className="text-sm text-[var(--color-text-tertiary)] p-10 text-center">Your document vault is empty.</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* AI Analysis Modal - Structured UI */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.97, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.97, y: 20 }}
              className="bg-white rounded-2xl shadow-modal border border-[var(--color-border-default)] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-bg-base)]/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-brand-primary-light)] flex items-center justify-center text-[var(--color-brand-primary)]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-[var(--color-text-primary)]">
                      AI Compliance Auditor
                    </h3>
                    {selectedFeed && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {aiReport ? `Analysis complete for ${selectedFeed.related_regulation}` : `Auditing ${selectedFeed.related_regulation}`}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={closeModal} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-2 rounded-md hover:bg-[var(--color-border-default)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-[var(--color-bg-base)]">
                {aiLoading && (
                  <div className="flex flex-col items-center justify-center h-full space-y-6">
                    <div className="relative flex items-center justify-center w-20 h-20">
                      <div className="absolute inset-0 rounded-full border-4 border-[var(--color-brand-primary-light)]"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-brand-primary)] animate-spin"></div>
                      <Sparkles className="w-8 h-8 ai-gradient-text animate-pulse" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium text-[var(--color-text-primary)]">Synthesizing Compliance Map...</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        Cross-referencing {selectedFeed?.related_regulation || 'the selected regulation'} against your specific internal policies.
                      </p>
                    </div>
                  </div>
                )}

                {aiError && (
                  <div className="p-6 m-6 bg-[var(--color-status-danger-bg)] border border-red-200 rounded-xl flex items-start gap-4 shadow-sm">
                    <AlertCircle className="w-6 h-6 text-[var(--color-status-danger)] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-semibold text-red-900">Audit Interrupted</h4>
                      <p className="text-sm text-red-700 mt-1">{aiError}</p>
                      <button onClick={closeModal} className="mt-4 px-4 py-2 bg-white text-sm font-medium text-[var(--color-status-danger)] border border-red-200 rounded-md hover:bg-red-50 transition-colors shadow-sm">Dismiss</button>
                    </div>
                  </div>
                )}

                {aiReport && !aiLoading && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 p-6 md:p-8 max-w-4xl mx-auto space-y-10">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckSquare className="w-6 h-6 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-900">Action Items Saved</p>
                          <p className="text-sm text-blue-700">The checklists below have been automatically saved to your Action Center.</p>
                        </div>
                      </div>
                    </div>

                    {selectedFeed && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="saas-card p-4 bg-white shadow-sm border-transparent">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">Feed</p>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{selectedFeed.title}</p>
                        </div>
                        <div className="saas-card p-4 bg-white shadow-sm border-transparent">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">Regulation</p>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{selectedFeed.related_regulation}</p>
                        </div>
                        {/* <div className="saas-card p-4 bg-white shadow-sm border-transparent">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">Impacted Vault Docs</p>
                          <p className="text-sm font-semibold text-[var(--color-text-primary)]">{selectedFeedImpactedDocuments.length}</p>
                        </div> */}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 saas-card p-6 bg-white shadow-sm border-transparent">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">Executive Summary</h4>
                        <p className="text-[15px] leading-relaxed text-[var(--color-text-primary)]">{aiReport.executive_summary}</p>
                      </div>
                      
                      <div className="saas-card p-6 bg-white shadow-sm border-transparent flex flex-col items-center justify-center text-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-4">Compliance Score</h4>
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F3F4F6" strokeWidth="3" />
                            <motion.path 
                              initial={{ strokeDasharray: "0, 100" }}
                              animate={{ strokeDasharray: `${aiReport.compliance_score}, 100` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                              fill="none" 
                              stroke={aiReport.compliance_score >= 80 ? '#10B981' : aiReport.compliance_score >= 50 ? '#F59E0B' : '#EF4444'} 
                              strokeWidth="3" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center flex-col">
                            <span className={`text-3xl font-bold tracking-tighter ${getScoreColor(aiReport.compliance_score)}`}>{aiReport.compliance_score}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold tracking-wide text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-orange-500" /> Identified Vulnerabilities
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiReport.critical_gaps.map((gap, idx) => (
                          <div key={idx} className={`p-5 rounded-xl border ${getSeverityStyles(gap.severity)}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold uppercase tracking-wider opacity-70">{gap.section}</span>
                              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-white/50 border border-current">
                                {gap.severity}
                              </span>
                            </div>
                            <p className="text-sm font-medium leading-snug">{gap.issue}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold tracking-wide text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-[var(--color-brand-primary)]" /> Required Policy Updates
                      </h4>
                      <div className="space-y-4">
                        {aiReport.action_items.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-xl border border-[var(--color-border-default)] overflow-hidden shadow-sm">
                            <div className="px-5 py-3 border-b border-[var(--color-border-default)] bg-[var(--color-bg-base)] flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.document_title}</span>
                            </div>
                            <div className="p-5 bg-[#0F172A]">
                              <p className="text-xs font-mono text-indigo-300 mb-2">// Recommended insertion/modification:</p>
                              <p className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {item.exact_change_instructions}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
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
