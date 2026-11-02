// ============================================================================
// SpeciesSelect — searchable species picker backed by the live "Species Common
// Names" table. Filter by Animals / Plants / Fungi, search common or scientific
// names. The value stays the scientific name (what the data and models match on).
// ============================================================================

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2, Search, X } from 'lucide-react';
import {
  ANIMAL_GROUPS,
  DEFAULT_ANIMAL_GROUP,
  formatSpeciesLabel,
  searchSpeciesNames,
  type AnimalGroup,
  type SpeciesKingdomFilter,
  type SpeciesName,
} from '../../../services/speciesNamesService';
import { experienceUi } from './experienceUi';

interface SpeciesSelectProps {
  /** Scientific name of the selected species ('' for none). */
  value: string;
  /** Called with the scientific name and, when GBIF has one, the common name. */
  onChange: (species: string, commonName?: string | null) => void;
}

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 250;

const KINGDOM_OPTIONS: { id: SpeciesKingdomFilter; label: string }[] = [
  { id: 'Animalia', label: 'Animals' },
  { id: 'Plantae', label: 'Plants' },
  { id: 'Fungi', label: 'Fungi' },
  { id: 'all', label: 'All' },
];

export function SpeciesSelect({ value, onChange }: SpeciesSelectProps) {
  const [kingdom, setKingdom] = useState<SpeciesKingdomFilter>('Animalia');
  const [animalGroup, setAnimalGroup] = useState<AnimalGroup>(DEFAULT_ANIMAL_GROUP);
  const [modelPointsAvailable, setModelPointsAvailable] = useState(true);
  const [search, setSearch] = useState('');
  const [isOpen, setOpen] = useState(false);
  const [items, setItems] = useState<SpeciesName[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SpeciesName | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // First page whenever the dropdown is open and the kingdom or search text changes
  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      searchSpeciesNames({
        kingdom,
        animalGroup,
        search,
        limit: PAGE_SIZE,
        signal: controller.signal,
      })
        .then((page) => {
          setItems(page.items);
          setHasMore(page.hasMore);
          setModelPointsAvailable(page.modelPointsAvailable);
        })
        .catch((caught) => {
          if (controller.signal.aborted) return;
          setItems([]);
          setHasMore(false);
          setError(caught instanceof Error ? caught.message : 'Species lookup failed');
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, search ? SEARCH_DEBOUNCE_MS : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [isOpen, kingdom, animalGroup, search]);

  const loadMore = () => {
    setLoading(true);
    searchSpeciesNames({
      kingdom,
      animalGroup,
      search,
      offset: items.length,
      limit: PAGE_SIZE,
    })
      .then((page) => {
        setItems((current) => [...current, ...page.items]);
        setHasMore(page.hasMore);
      })
      .catch((caught) => {
        setError(caught instanceof Error ? caught.message : 'Species lookup failed');
      })
      .finally(() => setLoading(false));
  };

  const selectedLabel =
    value && selected?.species === value ? formatSpeciesLabel(value, selected.commonName) : value;

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder={selectedLabel || 'Search species…'}
          value={isOpen ? search : selectedLabel}
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
            onClick={() => {
              setSelected(null);
              onChange('', null);
            }}
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
        <div className="absolute z-20 mt-1 w-full rounded-card border border-gray-200 bg-white shadow-lg">
          <div role="group" aria-label="Species group" className={`${experienceUi.toggleGroup} m-2`}>
            {KINGDOM_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setKingdom(option.id)}
                className={`${experienceUi.toggleBtn} ${
                  kingdom === option.id ? experienceUi.toggleBtnActive : ''
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {kingdom === 'Animalia' && (
            <div
              role="group"
              aria-label="Animal group"
              className="mx-2 mb-2 flex flex-wrap gap-1"
            >
              {ANIMAL_GROUPS.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setAnimalGroup(group.id)}
                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                    animalGroup === group.id
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>
          )}

          <div className="max-h-64 overflow-y-auto border-t border-gray-100">
            {error ? (
              <p className="px-3 py-2 text-[11px] text-red-600">{error}</p>
            ) : items.length === 0 && !isLoading ? (
              <p className="px-3 py-2 text-[11px] text-gray-500">No species found</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.species}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    onChange(item.species, item.commonName);
                    setSearch('');
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left hover:bg-emerald-50 ${
                    item.species === value ? 'bg-emerald-50' : ''
                  }`}
                >
                  <span className="flex min-w-0 flex-col">
                    {item.commonName ? (
                      <>
                        <span className="truncate text-xs font-medium text-gray-900">{item.commonName}</span>
                        <span className="truncate text-[11px] italic text-gray-500">{item.species}</span>
                      </>
                    ) : (
                      <span className="truncate text-xs italic text-gray-800">{item.species}</span>
                    )}
                  </span>
                  {item.modelPoints != null && (
                    <span
                      title={`${item.modelPoints.toLocaleString()} model points (tri-county land records, one per 1 km climate cell)`}
                      className="flex-shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-800"
                    >
                      {item.modelPoints.toLocaleString()} pts
                    </span>
                  )}
                </button>
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading…
              </div>
            )}

            {hasMore && !isLoading && !error && (
              <button
                type="button"
                onClick={loadMore}
                className="w-full px-3 py-1.5 text-center text-[11px] font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Show more
              </button>
            )}
          </div>

          {!modelPointsAvailable ? (
            <p className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-amber-700">
              Record counts aren&apos;t available yet, so species with too few records are not hidden.
            </p>
          ) : (
            !search && (
              <p className="border-t border-gray-100 px-3 py-1.5 text-[10px] text-gray-500">
                Showing species with common names. Type to search scientific names too.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
