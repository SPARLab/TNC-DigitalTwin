import React from 'react';
import { Trash2, Calendar, MapPin } from 'lucide-react';
import { CartItem } from '../../types';
import { getDataSourceIcon } from '../../utils/dataSourceIcons';

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
}

const dataSourceLabels: Record<string, string> = {
  inaturalist: 'iNaturalist',
  dendra: 'Dendra',
  calflora: 'CalFlora',
  ebird: 'eBird',
  animl: 'Animl',
  'drone-imagery': 'Drone Imagery'
};

export const CartItemCard: React.FC<CartItemCardProps> = ({ item, onRemove }) => {
  return (
    <div
      id={`cart-item-${item.id}`}
      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex-shrink-0">
              {getDataSourceIcon(item.dataSource, 'w-4 h-4')}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {dataSourceLabels[item.dataSource] || item.dataSource}
            </span>
          </div>
          <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
        </div>
        <button
          id={`remove-item-${item.id}`}
          onClick={onRemove}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          aria-label="Remove from cart"
          title="Remove from cart"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        {item.coreFilters.timeRange && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{item.coreFilters.timeRange}</span>
          </div>
        )}
        {item.coreFilters.spatialFilter && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{item.coreFilters.spatialFilter}</span>
          </div>
        )}
        <div className="font-medium text-blue-600">
          {item.dataSource === 'drone-imagery' 
            ? `${item.estimatedCount || 0} ${item.estimatedCount === 1 ? 'capture' : 'captures'}`
            : `${item.estimatedCount?.toLocaleString() || 0} records (estimated)`
          }
        </div>
      </div>

      {/* Show custom filters for drone imagery */}
      {item.customFilters.droneImagery && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Details:</p>
          <div className="flex flex-wrap gap-1">
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
              {item.customFilters.droneImagery.projectName}
            </span>
            {item.customFilters.droneImagery.includeImageCollections && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                📷 Includes image collections
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            Exports metadata manifest with extents, dates, and access links
          </p>
        </div>
      )}

      {/* Show custom filters for iNaturalist */}
      {item.customFilters.inaturalist && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">Filters:</p>
          <div className="flex flex-wrap gap-1">
            {item.customFilters.inaturalist.qualityGrade && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                {item.customFilters.inaturalist.qualityGrade.replace('_', ' ')}
              </span>
            )}
            {item.customFilters.inaturalist.iconicTaxa && item.customFilters.inaturalist.iconicTaxa.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                {item.customFilters.inaturalist.iconicTaxa.length} {item.customFilters.inaturalist.iconicTaxa.length === 1 ? 'taxon' : 'taxa'}
              </span>
            )}
            {item.customFilters.inaturalist.taxonName && (
              <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                {item.customFilters.inaturalist.taxonName}
              </span>
            )}
            {item.customFilters.inaturalist.photoFilter && item.customFilters.inaturalist.photoFilter !== 'any' && (
              <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                📷 {item.customFilters.inaturalist.photoFilter === 'with' ? 'with photos' : 'without photos'}
              </span>
            )}
            {item.customFilters.inaturalist.months && item.customFilters.inaturalist.months.length > 0 && item.customFilters.inaturalist.months.length < 12 && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                📅 {item.customFilters.inaturalist.months.length} {item.customFilters.inaturalist.months.length === 1 ? 'month' : 'months'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

