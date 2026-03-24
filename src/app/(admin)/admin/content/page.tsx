"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface ContentItem {
  id: string;
  title: string;
  status: string;
  verification_status: string;
  content_type: string;
  created_at: string;
  seller_email: string;
}

export default function AdminContentPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/dashboard");
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    const params = filter !== "all" ? `?status=${filter}` : "";
    fetch(`/api/admin/content${params}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin, filter]);

  if (isLoading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          All Content
        </h1>
      </div>

      <div className="flex gap-2">
        {["all", "active", "draft", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setLoading(true); }}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-3 text-left font-medium">Title</th>
                  <th className="p-3 text-left font-medium">Seller</th>
                  <th className="p-3 text-left font-medium">Type</th>
                  <th className="p-3 text-left font-medium">Status</th>
                  <th className="p-3 text-left font-medium">Verification</th>
                  <th className="p-3 text-left font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No content found</td></tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 font-medium">{item.title || "Untitled"}</td>
                      <td className="p-3 text-muted-foreground text-xs">{item.seller_email}</td>
                      <td className="p-3"><Badge variant="outline">{item.content_type}</Badge></td>
                      <td className="p-3">
                        <Badge variant={item.status === "active" ? "default" : "secondary"}>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={
                          item.verification_status === "verified" ? "default" :
                          item.verification_status === "rejected" ? "destructive" : "secondary"
                        }>
                          {item.verification_status || "pending"}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
