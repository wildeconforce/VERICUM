"use client";

import { ContentCard } from "./content-card";
import { ContentWithSeller } from "@/types/content";
import { Skeleton } from "@/components/ui/skeleton";
import { StaggerContainer, StaggerItem } from "@/components/ui/motion";

interface ContentGridProps {
  contents: ContentWithSeller[];
  isLoading?: boolean;
}

export function ContentGrid({ contents, isLoading }: ContentGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-lg">No content found</p>
        <p className="text-muted-foreground text-sm mt-1">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" staggerDelay={0.06}>
      {contents.map((content) => (
        <StaggerItem key={content.id}>
          <ContentCard
            id={content.id}
            title={content.title}
            thumbnailUrl={content.thumbnail_url || (content as any).preview_url}
            price={content.price}
            currency={content.currency}
            contentType={content.content_type}
            verificationStatus={content.verification_status}
            sellerName={content.profiles?.display_name || content.profiles?.username || "Unknown"}
            sellerAvatar={content.profiles?.avatar_url}
            likeCount={content.like_count}
            viewCount={content.view_count}
          />
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}
