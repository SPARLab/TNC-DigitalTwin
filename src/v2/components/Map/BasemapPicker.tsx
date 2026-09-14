import { useEffect, useId, useRef, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { useMap } from '../../context/MapContext';
import { BASEMAP_OPTIONS, type BasemapId } from '../../config/basemaps';

const BTN =
  'map-control-btn flex items-center justify-center bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors';

export function BasemapPicker() {
  const { basemapId, setBasemap } = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectBasemap = (id: BasemapId) => {
    setBasemap(id);
    setIsOpen(false);
  };

  return (
    <div id="basemap-picker" ref={rootRef} className="relative">
      <button
        id="basemap-picker-toggle"
        type="button"
        aria-label="Change basemap"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title="Change basemap"
        onClick={() => setIsOpen((open) => !open)}
        className={`${BTN} ${isOpen ? '!text-emerald-700' : ''}`}
      >
        <MapIcon className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="dialog"
          aria-label="Basemap"
          className="absolute right-full top-0 mr-2 w-[220px] rounded-lg border border-gray-200 bg-white p-2 shadow-lg"
        >
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Basemap
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {BASEMAP_OPTIONS.map((option) => {
              const selected = option.id === basemapId;
              return (
                <button
                  key={option.id}
                  id={`basemap-option-${option.id}`}
                  type="button"
                  aria-pressed={selected}
                  title={option.description}
                  onClick={() => selectBasemap(option.id)}
                  className={`flex flex-col items-center gap-1 rounded-md p-1 text-center transition-colors hover:bg-gray-50 ${
                    selected ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`h-9 w-full rounded border border-gray-300 ${option.swatchClass}`}
                  />
                  <span className="text-[10px] font-medium leading-none text-gray-700">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
