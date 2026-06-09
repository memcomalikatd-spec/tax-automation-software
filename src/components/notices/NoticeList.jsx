import React, { useState, useMemo } from 'react';
import { 
  Eye, Edit, Trash2, Download, Link as LinkIcon, 
  MoreVertical, FileText, Calendar, AlertCircle,
  CheckSquare, Square
} from 'lucide-react';
import NoticeStatusBadge from './NoticeStatusBadge';
import NoticePriorityBadge from './NoticePriorityBadge';
import NoticeDeadlineIndicator from './NoticeDeadlineIndicator';
import { formatNoticeType, formatDate } from '../../utils/noticeHelpers';

const NoticeList = ({ 
  notices, 
  onViewNotice, 
  onEditNotice, 
  onDeleteNotice,
  onLinkClient,
  onDownload,
  selectedNotices,
  onSelectNotice,
  onSelectAll,
  currentPage,
  itemsPerPage,
  onPageChange,
  sortBy,
  onSortChange
}) => {
  const [contextMenu, setContextMenu] = useState(null);

  // Pagination
  const totalPages = Math.ceil(notices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotices = notices.slice(startIndex, endIndex);

  const handleContextMenu = (e, notice) => {
    e.preventDefault();
    setContextMenu({
      notice,
      x: e.clientX,
      y: e.clientY
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close context menu on click outside
  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const allSelected = paginatedNotices.length > 0 && 
    paginatedNotices.every(notice => selectedNotices.includes(notice.id));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left w-12">
                <button
                  onClick={onSelectAll}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {allSelected ? (
                    <CheckSquare className="w-5 h-5" />
                  ) : (
                    <Square className="w-5 h-5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Notice Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tax Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedNotices.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">No notices found</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Upload a notice to get started
                  </p>
                </td>
              </tr>
            ) : (
              paginatedNotices.map((notice) => (
                <tr
                  key={notice.id}
                  onContextMenu={(e) => handleContextMenu(e, notice)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Checkbox */}
                  <td className="px-4 py-4">
                    <button
                      onClick={() => onSelectNotice(notice.id)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {selectedNotices.includes(notice.id) ? (
                        <CheckSquare className="w-5 h-5 text-blue-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Client */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {notice.clientName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {notice.cnicNtn || 'N/A'}
                        </div>
                      </div>
                      {!notice.clientId && (
                        <button
                          onClick={() => onLinkClient(notice)}
                          className="text-orange-500 hover:text-orange-700"
                          title="Link to client"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Notice Type */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatNoticeType(notice.noticeType)}
                    </div>
                    {notice.category && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {notice.category}
                      </div>
                    )}
                  </td>

                  {/* Tax Year */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {notice.taxYear || 'N/A'}
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="px-4 py-4">
                    <NoticeDeadlineIndicator dueDate={notice.dueDate} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <NoticeStatusBadge status={notice.status} />
                  </td>

                  {/* Priority */}
                  <td className="px-4 py-4">
                    <NoticePriorityBadge priority={notice.priority} />
                  </td>

                  {/* Uploaded Date */}
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(notice.uploaded_at)}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onViewNotice(notice)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditNotice(notice)}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDownload(notice)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteNotice(notice)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1} to {Math.min(endIndex, notices.length)} of {notices.length} notices
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first, last, current, and adjacent pages
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => onPageChange(page)}
                      className={`px-3 py-1 rounded ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <span key={page} className="px-2 dark:text-gray-400">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
        >
          <button
            onClick={() => {
              onViewNotice(contextMenu.notice);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 dark:text-white"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <button
            onClick={() => {
              onEditNotice(contextMenu.notice);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 dark:text-white"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          {!contextMenu.notice.clientId && (
            <button
              onClick={() => {
                onLinkClient(contextMenu.notice);
                closeContextMenu();
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 dark:text-white"
            >
              <LinkIcon className="w-4 h-4" />
              Link to Client
            </button>
          )}
          <button
            onClick={() => {
              onDownload(contextMenu.notice);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 dark:text-white"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          <hr className="my-2 border-gray-200 dark:border-gray-700" />
          <button
            onClick={() => {
              onDeleteNotice(contextMenu.notice);
              closeContextMenu();
            }}
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticeList;
