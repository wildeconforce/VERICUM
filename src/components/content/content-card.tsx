"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { VerificationBadge } from "./verification-badge";
import { PriceTag } from "./price-tag";
import { Heart, Eye } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

interface ContentCardProps {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  price: number;
  currency?: string;
  contentType: "photo" | "video" | "document" | "audio";
  verificationStatus: "verified" | "pending" | "rejected" | "unverifiable";
  sellerName: string;
  sellerAvatar?: string | null;
  likeCount?: number;
  viewCount?: number;
}

export function ContentCard({
  id,
  title,
  thumbnailUrl,
  price,
  currency = "USD",
  verificationStatus,
  sellerName,
  sellerAvatar,
  likeCount = 0,
  viewCount = 0,
}: ContentCardProps) {
  return (
    <Link href={`/content/${id}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
      <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Preview
            </div>
          )}
          <div className="absolute top-2 left-2">
            <VerificationBadge status={verificationStatus} size="sm" showLabel={false} />
          </div>
          <div className="absolute bottom-2 right-2">
            <PriceTag price={price} currency={currency} size="sm" />
          </div>
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-1 mb-2">{title}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={sellerAvatar || ""} />
                <AvatarFallback className="text-[10px]">
                  {sellerName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{sellerName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Heart className="h-3 w-3" />
                {formatNumber(likeCount)}
              </span>
              <span className="flex items-center gap-0.5">
                <Eye className="h-3 w-3" />
                {formatNumber(viewCount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
      </motion.div>
    </Link>
  );
}
