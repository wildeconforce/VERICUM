"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">Newest</SelectItem>
        <SelectItem value="popular">Most Popular</SelectItem>
        <SelectItem value="price_asc">Price: Low to High</SelectItem>
        <SelectItem value="price_desc">Price: High to Low</SelectItem>
      </SelectContent>
    </Select>
  );
}
