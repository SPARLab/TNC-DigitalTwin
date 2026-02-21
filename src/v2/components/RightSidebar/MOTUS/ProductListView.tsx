export interface MotusBrowseItem {
  id: string;
  title: string;
  scientificName: string;
  tagCountLabel: string;
  notes: string;
}

interface ProductListViewProps {
  items: MotusBrowseItem[];
  onSelect: (item: MotusBrowseItem) => void;
}

export function ProductListView({ items, onSelect }: ProductListViewProps) {
  if (items.length === 0) {
    return (
      <div id="motus-list-empty-state" className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
        <p id="motus-list-empty-state-text" className="text-sm text-gray-600">
          No MOTUS records available for this filter state yet.
        </p>
      </div>
    );
  }

  return (
    <div id="motus-list-view" className="space-y-2">
      {items.map((item) => (
        <article id={`motus-list-card-${item.id}`} key={item.id} className="rounded-lg border border-gray-200 bg-white">
          <button
            id={`motus-list-card-button-${item.id}`}
            type="button"
            onClick={() => onSelect(item)}
            className="w-full text-left px-3.5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <h3 id={`motus-list-card-title-${item.id}`} className="text-sm font-semibold text-gray-900">
              {item.title}
            </h3>
            <p id={`motus-list-card-scientific-${item.id}`} className="mt-0.5 text-xs text-gray-600 italic">
              {item.scientificName}
            </p>
            <div id={`motus-list-card-meta-${item.id}`} className="mt-2 flex items-center justify-between text-xs">
              <span id={`motus-list-card-tag-count-${item.id}`} className="font-medium text-gray-700">
                {item.tagCountLabel}
              </span>
              <span id={`motus-list-card-notes-${item.id}`} className="text-gray-500">
                {item.notes}
              </span>
            </div>
          </button>
        </article>
      ))}
    </div>
  );
}
