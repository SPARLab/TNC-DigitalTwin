import React from 'react';
import { Trash2, Calendar, MapPin } from 'lucide-react';
import { CartItem } from '../../types';

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
}

const dataSourceIcons: Record<string, string> = {
  inaturalist: '🔍',
  dendra: '📡',
  calflora: '🌱',
  ebird: '🐦'
};

const dataSourceLabels: Record<string, string> = {
  inaturalist: 'iNaturalist',
  dendra: 'Dendra',
  calflora: 'CalFlora',
  ebird: 'eBird'
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
            <span className="text-lg">{dataSourceIcons[item.dataSource]}</span>
            <span className="text-xs font-medium text-gray-600">
              {dataSourceLabels[item.dataSource]}
            </span>
          </div>
          <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
        </div>
        <button
          id={`remove-item-${item.id}`}
          onClick={onRemove}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          aria-label="Remove from cart"
        >
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>

      <div className="space-y-1 text-xs text-gray-600">
        {item.query.timeRange && (
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{item.query.timeRange}</span>
          </div>
        )}
        {item.query.spatialFilter && (
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>
              {item.query.spatialFilter === 'preserve-only' 
                ? 'Dangermond Preserve' 
                : item.query.spatialFilter === 'expanded'
                ? 'Expanded Area'
                : 'Custom Area'}
            </span>
          </div>
        )}
        <div className="font-medium text-blue-600">
          {item.itemCount.toLocaleString()} records
        </div>
      </div>
    </div>
  );
};

