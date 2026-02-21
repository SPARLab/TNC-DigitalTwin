import { useMemo, useState } from 'react';
import { ProductDetailView } from './ProductDetailView';
import { ProductListView, type MotusBrowseItem } from './ProductListView';

interface MOTUSBrowseTabProps {
  showBackToOverview?: boolean;
  onBackToOverview?: () => void;
}

export function MOTUSBrowseTab({ showBackToOverview = false, onBackToOverview }: MOTUSBrowseTabProps) {
  const items = useMemo<MotusBrowseItem[]>(
    () => [
      {
        id: 'dunlin',
        title: 'Dunlin',
        scientificName: 'Calidris alpina',
        tagCountLabel: '188 tagged animals',
        notes: 'High activity',
      },
      {
        id: 'long-billed-dowitcher',
        title: 'Long-billed Dowitcher',
        scientificName: 'Limnodromus scolopaceus',
        tagCountLabel: '30 tagged animals',
        notes: 'Seasonal pulses',
      },
      {
        id: 'least-sandpiper',
        title: 'Least Sandpiper',
        scientificName: 'Calidris minutilla',
        tagCountLabel: '7 tagged animals',
        notes: 'Sparse detections',
      },
    ],
    [],
  );

  const [selectedItem, setSelectedItem] = useState<MotusBrowseItem | null>(null);

  return (
    <div id="motus-browse-tab" className="space-y-3">
      {showBackToOverview && onBackToOverview && (
        <button
          id="motus-browse-back-to-overview-button"
          type="button"
          onClick={onBackToOverview}
          className="text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          &larr; Back to overview
        </button>
      )}

      {!selectedItem ? (
        <>
          <div id="motus-browse-header" className="space-y-1">
            <h2 id="motus-browse-title" className="text-sm font-semibold text-gray-900">
              Species and tagged animals
            </h2>
            <p id="motus-browse-subtitle" className="text-xs text-gray-600">
              Phase 11.2 shell: browse structure is ready; dynamic query wiring lands in 11.3.
            </p>
          </div>
          <ProductListView items={items} onSelect={setSelectedItem} />
        </>
      ) : (
        <ProductDetailView item={selectedItem} onBack={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
