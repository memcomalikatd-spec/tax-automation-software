/**
 * Client Selection Modal Component
 * Shows when OCR confidence is low and allows manual client selection
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Building,
  Phone,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';

const ClientSelectionModal = ({ 
  isOpen, 
  onClose, 
  extractedName, 
  suggestions = [], 
  allClients = [],
  onSelectClient 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return suggestions.length > 0 ? suggestions : allClients.slice(0, 10);
    }

    const query = searchQuery.toLowerCase();
    return allClients.filter(client => {
      const name = client.name?.toLowerCase() || '';
      const businessName = client.businessName?.toLowerCase() || '';
      const ntn = client.ntn?.toLowerCase() || '';
      const cnic = client.cnic?.toLowerCase() || '';
      
      return name.includes(query) || 
             businessName.includes(query) || 
             ntn.includes(query) || 
             cnic.includes(query);
    }).slice(0, 10);
  }, [searchQuery, suggestions, allClients]);

  const handleConfirm = () => {
    if (selectedClient) {
      onSelectClient(selectedClient);
      onClose();
    }
  };

  const handleSkip = () => {
    onSelectClient(null);
    onClose();
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
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-white/10"
        >
          {/* Header */}
          <div className="bg-white/5 backdrop-blur-xl border-b border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-400" />
                  Select Client
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                  Match the notice to the correct client
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Extracted Name Alert */}
            {extractedName && extractedName !== 'Unknown' && (
              <div className="flex items-start gap-3 p-4 bg-yellow-600/10 border border-yellow-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-400 text-sm">Low Confidence Match</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Extracted name: <span className="font-semibold">"{extractedName}"</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Please verify and select the correct client from the list below
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-white/10">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, business, NTN, or CNIC..."
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Client List */}
          <div className="p-6 max-h-[50vh] overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 text-lg font-medium">No clients found</p>
                <p className="text-gray-500 text-sm mt-2">
                  Try adjusting your search or skip to create a new client
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client, index) => {
                  const isSelected = selectedClient?.id === client.id;
                  const isSuggestion = suggestions.some(s => s.client?.id === client.id);
                  const matchConfidence = suggestions.find(s => s.client?.id === client.id)?.confidence;

                  return (
                    <motion.div
                      key={client.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => setSelectedClient(client)}
                      className={`
                        relative p-4 rounded-xl border cursor-pointer transition-all
                        ${isSelected 
                          ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20' 
                          : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }
                      `}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-4 right-4">
                          <CheckCircle className="w-6 h-6 text-blue-400" />
                        </div>
                      )}

                      {/* Match Confidence Badge */}
                      {isSuggestion && matchConfidence && (
                        <div className="absolute top-4 right-4">
                          <span className={`
                            inline-block px-2 py-1 rounded text-xs font-medium
                            ${matchConfidence >= 70 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-yellow-600/20 text-yellow-400'
                            }
                          `}>
                            {matchConfidence}% match
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-12">
                        {/* Left Column */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-blue-400" />
                            <h3 className="font-semibold text-white text-lg">
                              {client.name || 'Unknown'}
                            </h3>
                          </div>
                          
                          {client.businessName && (
                            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span>{client.businessName}</span>
                            </div>
                          )}

                          {client.location && (
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <MapPin className="w-4 h-4" />
                              <span>{client.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-2 text-sm">
                          {client.ntn && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400">NTN:</span>
                              <span className="font-mono">{client.ntn}</span>
                            </div>
                          )}

                          {client.cnic && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <FileText className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400">CNIC:</span>
                              <span className="font-mono">{client.cnic}</span>
                            </div>
                          )}

                          {client.phone && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{client.phone}</span>
                            </div>
                          )}

                          {client.email && (
                            <div className="flex items-center gap-2 text-gray-300">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{client.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/10 p-6 bg-white/5">
            <div className="flex gap-4">
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-semibold hover:bg-white/10 transition-all text-white"
              >
                Skip (Create New)
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedClient}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Confirm Selection
              </button>
            </div>
            
            {selectedClient && (
              <p className="text-center text-sm text-gray-400 mt-3">
                Selected: <span className="text-white font-medium">{selectedClient.name}</span>
              </p>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ClientSelectionModal;
