"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ContentUploader } from "@/components/content/content-uploader";
import { contentUploadSchema, ContentUploadInput } from "@/lib/utils/validation";
import { CATEGORIES, CATEGORY_LABELS, Category } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function UploadPage() {
  const router = useRouter();
  const t = useTranslations("upload");
  const tc = useTranslations("common");
  const [uploadResult, setUploadResult] = useState<{ fileKey: string; contentId: string } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contentUploadSchema),
    defaultValues: {
      content_type: "photo",
      currency: "USD",
      license_type: "standard",
      tags: [],
    },
  });

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 20) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    setValue("tags", newTags);
  };

  const onSubmit = async (data: ContentUploadInput) => {
    if (!uploadResult) {
      toast.error(t("uploadFileFirst"));
      return;
    }

    try {
      // Create content
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          file_key: uploadResult.fileKey,
          tags,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || t("failedToCreate"));
        return;
      }

      // Trigger verification
      setIsVerifying(true);
      toast.info(t("runningVerification"));

      const verifyRes = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_id: json.content.id,
          file_key: uploadResult.fileKey,
        }),
      });
      const verifyJson = await verifyRes.json();
      setIsVerifying(false);

      if (verifyJson.status === "verified") {
        toast.success(t("verifiedAndPublished"));
      } else if (verifyJson.status === "manual_review") {
        toast.info(t("submittedForReview"));
      } else {
        toast.warning(t("couldNotVerify"));
      }

      router.push(`/content/${json.content.id}`);
    } catch {
      toast.error(tc("error"));
      setIsVerifying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
      <p className="text-muted-foreground mb-8">
        {t("subtitle")}
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("fileUpload")}</CardTitle>
            <CardDescription>
              {t("fileUploadDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContentUploader onUploadComplete={setUploadResult} />
            {uploadResult && (
              <p className="text-sm text-emerald mt-2">{t("fileUploaded")}</p>
            )}
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{t("contentDetails")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("titleLabel")}</Label>
                <Input id="title" placeholder={t("titlePlaceholder")} {...register("title")} />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("descriptionLabel")}</Label>
                <Textarea id="description" placeholder={t("descriptionPlaceholder")} rows={4} {...register("description")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("priceLabel")}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.50"
                    placeholder="9.99"
                    {...register("price", { valueAsNumber: true })}
                  />
                  {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>{t("categoryLabel")}</Label>
                  <Select onValueChange={(v) => setValue("category", v as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("categoryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat as Category]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("tagsLabel")}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder={t("tagPlaceholder")}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    {t("addTag")}
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={!uploadResult || isSubmitting || isVerifying}
              >
                {(isSubmitting || isVerifying) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isVerifying ? t("verifying") : t("publishContent")}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
