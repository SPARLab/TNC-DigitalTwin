// ============================================================================
// SpeciesSelect — searchable grouped picker backed by /species_list.json.
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { experienceUi } from './experienceUi';

interface SpeciesSelectProps {
  value: string;
  onChange: (species: string) => void;
}

export function SpeciesSelect({ value, onChange }: SpeciesSelectProps) {
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  const [search, setSearch] = useState('');
  const [isOpen, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/species_list.json')
      .then((response) => response.json())
      .then(setGroups)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const filtered = Object.entries(groups).reduce<Record<string, string[]>>(
    (acc, [group, list]) => {
      const matches = list.filter((species) =>
        species.toLowerCase().includes(search.toLowerCase()),
      );
      if (matches.length > 0) acc[group] = matches;
      return acc;
    },
    {},
  );
  const matchCount = Object.values(filtered).reduce((sum, list) => sum + list.length, 0);

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder={value || 'Search species…'}
          value={isOpen ? search : value}
          onChange={(event) => {
            setSearch(event.target.value);
            if (!isOpen) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={`${experienceUi.input} pl-8 pr-8`}
        />
        {value && !isOpen ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear species"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-card border border-gray-200 bg-white shadow-lg">
          {matchCount === 0 ? (
            <p className="px-3 py-2 text-[11px] text-gray-500">No species found</p>
          ) : (
            Object.entries(filtered).map(([group, list]) => (
              <div key={group}>
                <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  {group}
                  <span>{list.length}</span>
                </div>
                {list.map((species) => (
                  <button
                    key={species}
                    type="button"
                    onClick={() => {
                      onChange(species);
                      setSearch('');
                      setOpen(false);
                    }}
                    className={`flex w-full px-3 py-1.5 text-left text-xs italic hover:bg-emerald-50 ${
                      species === value ? 'bg-emerald-50 font-medium text-emerald-900' : 'text-gray-800'
                    }`}
                  >
                    {species}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
