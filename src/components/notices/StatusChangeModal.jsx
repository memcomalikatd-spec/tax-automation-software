/**
 * Status Change Confirmation Modal
 * Allows users to change notice status with confirmation and notes
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  FileText,
  Calendar,
  User,
  MessageSquare
} from 'lucide-react';

const StatusChangeModal = ({ isOpen, onClose, notice, currentStatus, onConfirm }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const statusOptions = [
    { value: 'Received', label: 'Received', color: 'gray', icon: FileText, description: 'Notice has been received' },
    { value: 'Under Review', label: 'Under Review', color: 'blue', icon: AlertCircle, description: 'Currently being reviewed' },
    { value: 'Documents Requested', label: 'Documents Requested', color: 'yellow', icon: FileText, description: 'Waiting for additional documents' },
    { value: 'Response Prepared', label: 'Response Prepared', color: 'purple', icon: FileText, description: 'Response has been drafted' },
    { value: 'Response Submitted', label: 'Response Submitted', color: 'green', icon: CheckCircle, description: 'Response submitted to authorities' },
    { value: 'Hearing Scheduled', label: 'Hearing Scheduled', color: 'orange', icon: Calendar, description: 'Hearing date has been set' },
    { value: 'Resolved', label: 'Resolved', color: 'emerald', icon: CheckCircle, description: 'Notice has been resolved' },
    { value: 'Closed', label: 'Closed', color: 'slate', icon: X, description: 'Notice is closed' }
  ];

  const handleConfirm = () => {
    if (selectedStatus === currentStatus) {
      alert('Please select a different status');
      return;
    }

    const changeData = {
      newStatus: selectedStatus,
      notes,
      assignedTo,
      followUpDate,
      changedAt: new Date().toISOString(),
      changedBy: 'Admin User'
    };

    onConfirm(notice, changeData);
    handleClose();
  };

  const handleClose = () => {
    setSelectedStatus(currentStatus);
    setNotes('');
    setAssignedTo('');
    setFollowUpDate('');
    onClose();
  };

  if (!isOpen || !notice) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-black border-b border-white/10 p-6 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold">Change Notice Status</h2>
              <p className="text-gray-400 text-sm mt-1">
                {notice.noticeTypeName} - {notice.clientName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Current Status */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-2">Current Status</p>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  currentStatus === 'Response Submitted' ? 'bg-green-600/20 text-green-400' :
                  currentStatus === 'Under Review' ? 'bg-blue-600/20 text-blue-400' :
                  currentStatus === 'Resolved' ? 'bg-emerald-600/20 text-emerald-400' :
                  'bg-gray-600/20 text-gray-400'
                }`}>
                  {currentStatus}
                </span>
              </div>
            </div>

            {/* Status Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Select New Status <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {statusOptions.map((status) => {
                  const Icon = status.icon;
                  const isSelected = selectedStatus === status.value;
                  const isCurrent = currentStatus === status.value;
                  
                  return (
                    <button
                      key={status.value}
                      onClick={() => setSelectedStatus(status.value)}
                      disabled={isCurrent}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `border-${status.color}-500 bg-${status.color}-600/10`
                          : isCurrent
                          ? 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
                          : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          isSelected ? `bg-${status.color}-600/20` : 'bg-white/10'
                        }`}>
                          <Icon className={`w-4 h-4 ${
                            isSelected ? `text-${status.color}-400` : 'text-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">
                            {status.label}
                            {isCurrent && <span className="text-xs text-gray-500 ml-2">(Current)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{status.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this status change..."
                rows={4}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assigned To */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Assign To (Optional)
                </label>
                <input
                  type="text"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Team member name"
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {/* Follow-up Date */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Follow-up Date (Optional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            </div>

            {/* Warning if no change */}
            {selectedStatus === currentStatus && (
              <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-400">No Status Change</p>
                  <p className="text-xs text-yellow-400/80 mt-1">
                    Please select a different status to proceed with the change.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gradient-to-br from-gray-900 to-black border-t border-white/10 p-6 flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedStatus === currentStatus}
              className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                selectedStatus === currentStatus
                  ? 'bg-gray-600/20 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-2" />
              Confirm Change
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default StatusChangeModal;
