import { geocodeApi } from '@/services/api';
import type { GeocodeSearchResult } from '@/types/geocode';
import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 3;

export function useDebouncedGeocodeSearch(query: string) {
  const [results, setResults] = useState<GeocodeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      abortRef.current?.abort();
      setResults([]);
      setIsSearching(false);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      geocodeApi
        .search(trimmed, controller.signal)
        .then((response) => {
          if (controller.signal.aborted) return;
          setResults(response.results);
          setIsSearching(false);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          const message = err instanceof Error ? err.message : 'Address search failed';
          setError(message);
          setResults([]);
          setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query]);

  return { results, isSearching, error, minQueryLength: MIN_QUERY_LENGTH };
}
