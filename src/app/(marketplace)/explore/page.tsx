"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ContentGrid } from "@/components/content/content-grid";
import { FilterPanel } from "@/components/search/filter-panel";
import { SortSelector } from "@/components/search/sort-selector";
import { Button } from "@/components/ui/button";
import { ContentWithSeller } from "@/types/content";
import { ChevronLeft, ChevronRight, SlidersHorizontal, Loader2 } from "lucide-react";

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations();
  const [contents, setContents] = useState<ContentWithSeller[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const sort = searchParams.get("sort") || "newest";
  const verifiedOnly = searchParams.get("verified_only") !== "false";
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");

  const fetchContents = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    params.set("sort", sort);
    params.set("verified_only", String(verifiedOnly));
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);

    const res = await fetch(`/api/content?${params}`);
    const data = await res.json();
    setContents(data.data || []);
    setTotal(data.total || 0);
    setTotalPages(data.total_pages || 0);
    setIsLoading(false);
  }, [page, category, type, sort, verifiedOnly, minPrice, maxPrice]);

  useEffect(() => {
    fetchContents();
  }, [fetchContents]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    params.set("page", "1");
    router.push(`/explore?${params}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("explore.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("explore.subtitle", { count: total, plural: total !== 1 ? "s" : "" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {t("explore.filters.title")}
          </Button>
          <SortSelector value={sort} onChange={(v) => updateParams({ sort: v })} />
        </div>
      </div>

      <div className="flex gap-8">
        <aside
          className={`w-64 shrink-0 ${
            showFilters
              ? "fixed inset-0 z-40 bg-background p-6 overflow-y-auto lg:relative lg:inset-auto lg:z-auto lg:p-0"
              : "hidden lg:block"
          }`}
        >
          {showFilters && (
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h2 className="text-lg font-semibold">{t("explore.filters.title")}</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
          <FilterPanel
            selectedCategory={category}
            selectedType={type}
            verifiedOnly={verifiedOnly}
            minPrice={minPrice ? parseFloat(minPrice) : null}
            maxPrice={maxPrice ? parseFloat(maxPrice) : null}
            onCategoryChange={(v) => updateParams({ category: v })}
            onTypeChange={(v) => updateParams({ type: v })}
            onVerifiedOnlyChange={(v) => updateParams({ verified_only: String(v) })}
            onPriceChange={(min, max) =>
              updateParams({
                min_price: min !== null ? String(min) : null,
                max_price: max !== null ? String(max) : null,
              })
            }
            onClearAll={() => router.push("/explore")}
          />
        </aside>
        <div className="flex-1 min-w-0">
          <ContentGrid contents={contents} isLoading={isLoading} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => updateParams({ page: String(page - 1) })}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("common.page")} {page} {t("common.of")} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: String(page + 1) })}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  );
}
