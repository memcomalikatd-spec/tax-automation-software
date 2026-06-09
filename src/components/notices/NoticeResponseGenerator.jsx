/**
 * Notice Response Generator Component
 * Provides brief summary and full response generation with client context
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  Sparkles,
  Copy,
  Download,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  FileCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  generateBriefSummary, 
  generateFullResponse,
  getClientContext 
} from '../../utils/noticeHelpers';

const NoticeResponseGenerator = ({ isOpen, onClose, notice, client, clients }) => {
  const [responseMode, setResponseMode] = useState('brief'); // 'brief' or 'full'
  const [briefSummary, setBriefSummary] = useState(null);
  const [fullResponse, setFullResponse] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showClientContext, setShowClientContext] = useState(true);
  const [showDocuments, setShowDocuments] = useState(true);

  useEffect(() => {
    if (isOpen && notice) {
      generateResponses();
    }
  }, [isOpen, notice, client, responseMode]);

  const generateResponses = async () => {
    setGenerating(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (responseMode === 'brief') {
      const summary = generateBriefSummary(notice, client);
      setBriefSummary(summary);
    } else {
      const response = generateFullResponse(notice, client);
      setFullResponse(response);
    }

    setGenerating(false);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getUrgencyColor = (urgency) => {
    const colors = {
      overdue: 'red',
      today: 'red',
      critical: 'orange',
      urgent: 'yellow',
      normal: 'green',
      unknown: 'gray'
    };
    return colors[urgency] || 'gray';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/10"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-400" />
                  Response Generator
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  {notice?.noticeTypeName} • {client?.name || notice?.clientName || 'Unknown Client'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mode Selector */}
            <div className="flex gap-4">
              <button
                onClick={() => setResponseMode('brief')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  responseMode === 'brief'
                    ? 'bg-blue-600/20 border-blue-500'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">Brief Summary</span>
                </div>
                <p className="text-xs text-gray-400 text-left">
                  Quick overview with key points and required actions
                </p>
              </button>

              <button
                onClick={() => setResponseMode('full')}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  responseMode === 'full'
                    ? 'bg-purple-600/20 border-purple-500'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <FileCheck className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Full Response Draft</span>
                </div>
                <p className="text-xs text-gray-400 text-left">
                  Complete legal response with client-specific details
                </p>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client Context Panel */}
            {client && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/30 rounded-xl p-6"
              >
                <button
                  onClick={() => setShowClientContext(!showClientContext)}
                  className="w-full flex items-center justify-between mb-4"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold">Client Context</h3>
                    <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">
                      Linked
                    </span>
                  </div>
                  {showClientContext ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {showClientContext && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Name</p>
                      <p className="font-medium">{client.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Business</p>
                      <p className="font-medium">{client.businessName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">NTN/CNIC</p>
                      <p className="font-medium">{client.ntn || client.cnic || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Business Type</p>
                      <p className="font-medium">{client.businessType}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Location</p>
                      <p className="font-medium">{client.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Previous Returns</p>
                      <p className="font-medium">{client.returns || 0}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!client && (
              <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-400 mb-1">No Client Linked</p>
                  <p className="text-sm text-yellow-400/80">
                    Link this notice to a client for better response generation with complete context.
                  </p>
                </div>
              </div>
            )}

            {/* Brief Summary Mode */}
            {responseMode === 'brief' && briefSummary && !generating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Summary Card */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-xl font-bold mb-3">{briefSummary.title}</h3>
                  <p className="text-gray-300 mb-4">{briefSummary.summary}</p>

                  {/* Urgency Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 mb-4">
                    <Clock className={`w-4 h-4 text-${getUrgencyColor(briefSummary.urgency)}-400`} />
                    <span className={`text-sm font-medium text-${getUrgencyColor(briefSummary.urgency)}-400 capitalize`}>
                      {briefSummary.urgency} Priority
                    </span>
                  </div>

                  {/* Key Points */}
                  <div className="mb-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                      Key Information
                    </h4>
                    <div className="space-y-2">
                      {briefSummary.keyPoints.map((point, index) => (
                        <div key={index} className="flex items-start gap-2 text-gray-300">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Actions */}
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-400" />
                      Required Actions
                    </h4>
                    <div className="space-y-2">
                      {briefSummary.requiredActions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2 text-gray-300">
                          <span className="text-orange-400 mt-1">→</span>
                          <span>{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleCopy(JSON.stringify(briefSummary, null, 2))}
                    className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy Summary'}
                  </button>
                  <button
                    onClick={() => handleDownload(
                      `${briefSummary.title}\n\n${briefSummary.summary}\n\nKey Points:\n${briefSummary.keyPoints.join('\n')}\n\nRequired Actions:\n${briefSummary.requiredActions.join('\n')}`,
                      `notice-summary-${notice.id}.txt`
                    )}
                    className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              </motion.div>
            )}

            {/* Full Response Mode */}
            {responseMode === 'full' && fullResponse && !generating && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Completeness Score */}
                {fullResponse.completenessScore !== undefined && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Response Completeness
                      </h4>
                      <span className={`text-2xl font-bold ${
                        fullResponse.completenessScore >= 80 ? 'text-green-400' :
                        fullResponse.completenessScore >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {fullResponse.completenessScore}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          fullResponse.completenessScore >= 80 ? 'bg-green-500' :
                          fullResponse.completenessScore >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${fullResponse.completenessScore}%` }}
                      />
                    </div>

                    {fullResponse.missingInfo && fullResponse.missingInfo.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-600/10 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm font-medium text-yellow-400 mb-2">Missing Information:</p>
                        <ul className="text-sm text-yellow-400/80 space-y-1">
                          {fullResponse.missingInfo.map((info, index) => (
                            <li key={index}>• {info}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Context Notes */}
                {fullResponse.contextNotes && fullResponse.contextNotes.length > 0 && (
                  <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-blue-400" />
                      Client Context Notes
                    </h4>
                    <div className="space-y-2">
                      {fullResponse.contextNotes.map((note, index) => (
                        <p key={index} className="text-sm text-gray-300">{note}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Documents */}
                {fullResponse.suggestedDocuments && fullResponse.suggestedDocuments.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                    <button
                      onClick={() => setShowDocuments(!showDocuments)}
                      className="w-full flex items-center justify-between mb-4"
                    >
                      <h4 className="font-semibold flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-purple-400" />
                        Required Documents ({fullResponse.suggestedDocuments.length})
                      </h4>
                      {showDocuments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>

                    {showDocuments && (
                      <div className="space-y-2">
                        {fullResponse.suggestedDocuments.map((doc, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <span className="text-sm">{doc.name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              doc.available
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-red-600/20 text-red-400'
                            }`}>
                              {doc.available ? 'Available' : 'Missing'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Response Draft */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-400" />
                    Response Draft
                  </h4>
                  <pre className="whitespace-pre-wrap text-sm text-gray-300 font-mono bg-black/40 p-4 rounded-lg overflow-x-auto">
                    {fullResponse.response}
                  </pre>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleCopy(fullResponse.response)}
                    className="flex-1 px-6 py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    {copied ? 'Copied!' : 'Copy Response'}
                  </button>
                  <button
                    onClick={() => handleDownload(
                      fullResponse.response,
                      `notice-response-${notice.id}.txt`
                    )}
                    className="flex-1 px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download
                  </button>
                </div>
              </motion.div>
            )}

            {/* Loading State */}
            {generating && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Generating {responseMode === 'brief' ? 'summary' : 'response'}...</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NoticeResponseGenerator;
