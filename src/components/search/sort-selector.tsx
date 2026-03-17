"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SortSelector({ value, onChange }: SortSelectorProps) {
  const t = useTranslations("explore.sort");
  const tf = useTranslations("filter");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={tf("sortBy")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="newest">{t("newest")}</SelectItem>
        <SelectItem value="popular">{t("popular")}</SelectItem>
        <SelectItem value="price_asc">{t("priceAsc")}</SelectItem>
        <SelectItem value="price_desc">{t("priceDesc")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
