"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("explore.sort");

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder={t("newest")} />
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
