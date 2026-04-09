"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ContentGrid } from "@/components/content/content-grid";
import { ContentWithSeller } from "@/types/content";
import { SearchBar } from "@/components/search/search-bar";
import { Loader2 } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<ContentWithSeller[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const performSearch = useCallback(async () => {
    if (!query) return;
    setIsLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.results || []);
    setTotal(data.total || 0);
    setIsLoading(false);
  }, [query]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-xl mx-auto mb-8">
        <SearchBar />
      </div>
      {query && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Results for &ldquo;{query}&rdquo;
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} result{total !== 1 ? "s" : ""} found
          </p>
        </div>
      )}
      <ContentGrid contents={results} isLoading={isLoading} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
