"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ContentWithSeller } from "@/types/content";

interface SearchState {
  results: ContentWithSeller[];
  total: number;
  isSearching: boolean;
  error: string | null;
}

export function useSearch(debounceMs: number = 300) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({
    results: [],
    total: 0,
    isSearching: false,
    error: null,
  });
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const search = useCallback(async (searchQuery: string, params?: Record<string, string>) => {
    if (!searchQuery.trim()) {
      setState({ results: [], total: 0, isSearching: false, error: null });
      return;
    }

    setState((s) => ({ ...s, isSearching: true, error: null }));

    try {
      const searchParams = new URLSearchParams({ q: searchQuery, ...params });
      const res = await fetch(`/api/search?${searchParams}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setState({
        results: data.results,
        total: data.total,
        isSearching: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        isSearching: false,
        error: err instanceof Error ? err.message : "Search failed",
      }));
    }
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      search(query);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, debounceMs, search]);

  return { query, setQuery, search, ...state };
}
