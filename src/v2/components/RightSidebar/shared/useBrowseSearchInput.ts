import { useEffect, useState } from 'react';

type UseBrowseSearchInputParams = {
  initialSearchTerm?: string;
  minSearchChars?: number;
  debounceMs?: number;
};

function normalizeSearchTerm(value: string, minSearchChars: number): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return '';
  return trimmed.length >= minSearchChars ? trimmed : '';
}

export function useBrowseSearchInput({
  initialSearchTerm = '',
  minSearchChars = 2,
  debounceMs = 500,
}: UseBrowseSearchInputParams) {
  const [searchInput, setSearchInput] = useState(initialSearchTerm);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialSearchTerm);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAppliedSearchTerm(normalizeSearchTerm(searchInput, minSearchChars));
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [searchInput, minSearchChars, debounceMs]);

  const runSearchNow = () => {
    setAppliedSearchTerm(normalizeSearchTerm(searchInput, minSearchChars));
  };

  const clearSearch = () => {
    setSearchInput('');
    setAppliedSearchTerm('');
  };

  return {
    searchInput,
    appliedSearchTerm,
    setSearchInput,
    setAppliedSearchTerm,
    runSearchNow,
    clearSearch,
  };
}
