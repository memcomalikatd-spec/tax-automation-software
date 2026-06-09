import React, { useState, useEffect } from 'react';
import { X, Save, Link as LinkIcon, FileText, Calendar, AlertCircle, User, Hash, Building } from 'lucide-react';
import NoticeStatusBadge from './NoticeStatusBadge';
import NoticePriorityBadge from './NoticePriorityBadge';
import NoticeDeadlineIndicator from './NoticeDeadlineIndicator';
import { formatNoticeType, formatDate } from '../../utils/noticeHelpers';

const NoticeDetailModal = ({ 
  notice, 
  onClose, 
  onSave, 
  onLinkClient,
  linkedClient 
}) => {
  const [editedNotice, setEditedNotice] = useState(notice);
  const [activeTab, setActiveTab] = useState('details');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditedNotice(notice);
  }, [notice]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedNotice);
      onClose();
    } catch (error) {
      console.error('Error saving notice:', error);
      alert('Failed to save notice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedNotice(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notice Details
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatNoticeType(editedNotice.noticeType)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('extracted')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'extracted'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Extracted Data
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Timeline
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Client Information */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Client Information
                  </h3>
                  {!editedNotice.clientId && (
                    <button
                      onClick={() => onLinkClient(editedNotice)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Link to Client
                    </button>
                  )}
                </div>

                {linkedClient ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Name:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{linkedClient.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{linkedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{linkedClient.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CNIC/NTN:</span>
                      <span className="text-sm text-gray-900 dark:text-white">{linkedClient.cnic || linkedClient.ntn}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Client Name
                      </label>
                      <input
                        type="text"
                        value={editedNotice.clientName || ''}
                        onChange={(e) => handleFieldChange('clientName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        CNIC/NTN
                      </label>
                      <input
                        type="text"
                        value={editedNotice.cnicNtn || ''}
                        onChange={(e) => handleFieldChange('cnicNtn', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Notice Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notice Type
                  </label>
                  <select
                    value={editedNotice.noticeType || 'unknown'}
                    onChange={(e) => handleFieldChange('noticeType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="unknown">General Notice</option>
                    <option value="demand">Demand Notice</option>
                    <option value="audit">Audit Notice</option>
                    <option value="penalty">Penalty Notice</option>
                    <option value="withholding">Withholding Tax</option>
                    <option value="sales_tax">Sales Tax</option>
                    <option value="income_tax">Income Tax</option>
                    <option value="compliance">Compliance</option>
                    <option value="assessment">Assessment</option>
                    <option value="refund">Refund</option>
                    <option value="appeal">Appeal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tax Year
                  </label>
                  <input
                    type="text"
                    value={editedNotice.taxYear || ''}
                    onChange={(e) => handleFieldChange('taxYear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editedNotice.status || 'Received'}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Received">Received</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Response Drafted">Response Drafted</option>
                    <option value="Responded">Responded</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={editedNotice.priority || 'Medium'}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editedNotice.dueDate || ''}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={editedNotice.amount || ''}
                    onChange={(e) => handleFieldChange('amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., 50,000"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description / Notes
                </label>
                <textarea
                  value={editedNotice.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add any notes or description about this notice..."
                />
              </div>

              {/* File Information */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">File Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Original Filename:</span>
                    <span className="text-gray-900 dark:text-white">{editedNotice.original_filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">File Size:</span>
                    <span className="text-gray-900 dark:text-white">
                      {editedNotice.file_size ? `${(editedNotice.file_size / 1024).toFixed(2)} KB` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Uploaded:</span>
                    <span className="text-gray-900 dark:text-white">{formatDate(editedNotice.uploaded_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extracted' && (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Extracted Text</h3>
                <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {editedNotice.extractedText || 'No extracted text available'}
                </pre>
              </div>

              {editedNotice.confidence > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Extraction Confidence</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${editedNotice.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {editedNotice.confidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flow-root">
                <ul className="-mb-8">
                  <li>
                    <div className="relative pb-8">
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                            <FileText className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white">Notice uploaded</p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(editedNotice.uploaded_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>

                  {editedNotice.linkedAt && (
                    <li>
                      <div className="relative pb-8">
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                              <LinkIcon className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">Linked to client</p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(editedNotice.linkedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )}

                  {editedNotice.updated_at && (
                    <li>
                      <div className="relative pb-8">
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                              <Save className="h-4 w-4 text-white" />
                            </span>
                          </div>
                          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                            <div>
                              <p className="text-sm text-gray-900 dark:text-white">Notice updated</p>
                            </div>
                            <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(editedNotice.updated_at)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeDetailModal;
