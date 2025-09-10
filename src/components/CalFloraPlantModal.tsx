import React, { useEffect, useRef } from 'react';
import { X, Leaf, AlertTriangle, MapPin, Calendar, Building, User, TreePine, ExternalLink } from 'lucide-react';
import { CalFloraPlant } from '../services/calFloraService';

interface CalFloraPlantModalProps {
  plant: CalFloraPlant | null;
  isOpen: boolean;
  onClose: () => void;
}

const CalFloraPlantModal: React.FC<CalFloraPlantModalProps> = ({
  plant,
  isOpen,
  onClose
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation and focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !plant) {
    return null;
  }

  const getNativeStatusColor = (status: string) => {
    switch (status) {
      case 'native': return 'text-green-700 bg-green-100 border-green-200';
      case 'invasive': return 'text-red-700 bg-red-100 border-red-200';
      case 'non-native': return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getNativeStatusIcon = (status: string) => {
    switch (status) {
      case 'native': return <Leaf className="w-5 h-5" />;
      case 'invasive': return <AlertTriangle className="w-5 h-5" />;
      default: return <TreePine className="w-5 h-5" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex-1 min-w-0">
            <h2 id="modal-title" className="text-xl font-semibold text-gray-900 mb-1">
              {plant.commonName || plant.scientificName}
            </h2>
            {plant.commonName && (
              <p className="text-lg text-gray-600 italic">
                {plant.scientificName}
              </p>
            )}
            {plant.family && (
              <p className="text-sm text-gray-500 mt-1">
                Family: {plant.family}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6">
            {/* Photo Section */}
            <div className="mb-6">
              {plant.attributes?.photo ? (
                <div className="text-center">
                  <img
                    src={plant.attributes.photo}
                    alt={plant.commonName || plant.scientificName}
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-md object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = target.nextElementSibling as HTMLElement;
                      if (placeholder) placeholder.style.display = 'flex';
                    }}
                  />
                  <div 
                    className="hidden w-full h-48 bg-gray-100 rounded-lg flex-col items-center justify-center text-gray-500"
                  >
                    <Leaf className="w-12 h-12 mb-2" />
                    <p>Photo unavailable</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Photo courtesy of CalFlora.org
                  </p>
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
                  <Leaf className="w-12 h-12 mb-2" />
                  <p>No photo available</p>
                </div>
              )}
            </div>

            {/* Native Status Warning for Invasive Species */}
            {plant.nativeStatus === 'invasive' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-semibold">Invasive Species Alert</h3>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  This plant is classified as invasive and may pose a threat to native ecosystems. 
                  Management or removal may be recommended.
                </p>
                {plant.calIpcRating && (
                  <p className="text-red-700 text-sm mt-1">
                    <strong>Cal-IPC Rating:</strong> {plant.calIpcRating}
                  </p>
                )}
              </div>
            )}

            {/* Plant Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Basic Information
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getNativeStatusColor(plant.nativeStatus)}`}>
                      {getNativeStatusIcon(plant.nativeStatus)}
                      <span className="font-medium capitalize">{plant.nativeStatus}</span>
                    </div>
                  </div>

                  {plant.county && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span><strong>County:</strong> {plant.county}</span>
                    </div>
                  )}

                  {plant.observationDate && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span><strong>Observed:</strong> {new Date(plant.observationDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {plant.attributes?.observer && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <User className="w-4 h-4 text-gray-500" />
                      <span><strong>Observer:</strong> {plant.attributes.observer}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-700">
                    <Building className="w-4 h-4 text-gray-500" />
                    <span><strong>Data Source:</strong> CalFlora</span>
                  </div>
                </div>
              </div>

              {/* Habitat & Ecology */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                  Habitat & Ecology
                </h3>
                
                <div className="space-y-3">
                  {plant.attributes?.habitat && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Habitat</h4>
                      <p className="text-gray-700 text-sm">{plant.attributes.habitat}</p>
                    </div>
                  )}

                  {plant.attributes?.associatedSpecies && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Associated Species</h4>
                      <p className="text-gray-700 text-sm">{plant.attributes.associatedSpecies}</p>
                    </div>
                  )}

                  {plant.elevation && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Elevation</h4>
                      <p className="text-gray-700 text-sm">{plant.elevation} feet</p>
                    </div>
                  )}

                  {plant.attributes?.locationDescription && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Location Description</h4>
                      <p className="text-gray-700 text-sm">{plant.attributes.locationDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {plant.attributes?.notes && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">
                  Additional Notes
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{plant.attributes.notes}</p>
                </div>
              </div>
            )}

            {/* Citation & Source */}
            {plant.attributes?.citation && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-3">
                  Citation & Source
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 text-sm">{plant.attributes.citation}</p>
                  {plant.attributes?.source && (
                    <p className="text-gray-600 text-xs mt-2">Source: {plant.attributes.source}</p>
                  )}
                </div>
              </div>
            )}

            {/* External Links */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {/* Link to specific observation if we have an observation ID */}
                {plant.attributes?.id && (
                  <a
                    href={`https://www.calflora.org/occ/entry/${plant.attributes.id}.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on CalFlora
                  </a>
                )}
                
                {/* Link to observation search for this species */}
                {plant.scientificName && (
                  <a
                    href={`https://www.calflora.org/occurrences/search.html?taxon=${encodeURIComponent(plant.scientificName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    All Observations
                  </a>
                )}

                {/* Link to species information */}
                {plant.scientificName && (
                  <a
                    href={`https://www.calflora.org/cgi-bin/species_query.cgi?where-calrecnum=&where-scientific=${encodeURIComponent(plant.scientificName)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Species Info
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalFloraPlantModal;
