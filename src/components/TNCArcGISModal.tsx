import React from 'react';
import { X, ExternalLink, Calendar, User, Eye, Tag, FileText } from 'lucide-react';
import { TNCArcGISItem } from '../services/tncArcGISService';

interface TNCArcGISModalProps {
  item: TNCArcGISItem | null;
  onClose: () => void;
}

const TNCArcGISModal: React.FC<TNCArcGISModalProps> = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <>
      {/* Overlay */}
      <div
        id="tnc-modal-overlay"
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        id="tnc-modal-content"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-4">
              <h2 id="tnc-modal-title" className="text-2xl font-bold text-gray-900 mb-2">
                {item.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 font-medium">
                  <FileText className="w-4 h-4 inline-block mr-1" />
                  {item.type}
                </span>
                {item.mainCategories.map(category => (
                  <span key={category} className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700">
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <button
              id="tnc-modal-close-button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Snippet */}
            {item.snippet && (
              <div id="tnc-modal-snippet-section">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Summary
                </h3>
                <p className="text-gray-800 leading-relaxed">{item.snippet}</p>
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div id="tnc-modal-description-section">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  Description
                </h3>
                <div 
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.description }}
                />
              </div>
            )}

            {/* Metadata Grid */}
            <div id="tnc-modal-metadata-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Owner</div>
                  <div className="text-sm font-medium text-gray-900">{item.owner}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Modified</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(item.modified).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(item.created).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Views</div>
                  <div className="text-sm font-medium text-gray-900">{item.num_views.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div id="tnc-modal-tags-section">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full border border-blue-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex gap-3 justify-end">
              <button
                id="tnc-modal-close-footer-button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <a
                id="tnc-modal-view-online-button"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                View on ArcGIS Hub
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TNCArcGISModal;

