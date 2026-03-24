"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";

interface AuditEntry {
  id: string;
  verification_id: string;
  content_id: string;
  timestamp: string;
  engine_version: string;
  c2pa_present: boolean;
  vtl_score: number;
  trust_tier: string;
  layers: Record<string, number>;
  flags: { type: string; code: string; message: string }[];
  processing_time_ms: number;
}

export default function AuditLogPage() {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace("/dashboard");
  }, [isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isAdmin) return;
    fetch(`/api/admin/audit-log?offset=${page * 50}&limit=50`)
      .then((r) => r.json())
      .then((data) => setEntries(data.entries || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin, page]);

  if (isLoading || !isAdmin) return null;

  const tierColor: Record<string, string> = {
    platinum: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    gold: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    silver: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    bronze: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    untrusted: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6" />
          Verification Audit Log
        </h1>
        <p className="text-muted-foreground">Immutable record of all verification decisions</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="p-3 text-left font-medium">Time</th>
                  <th className="p-3 text-left font-medium">Content ID</th>
                  <th className="p-3 text-left font-medium">Engine</th>
                  <th className="p-3 text-left font-medium">C2PA</th>
                  <th className="p-3 text-left font-medium">VTL Score</th>
                  <th className="p-3 text-left font-medium">Tier</th>
                  <th className="p-3 text-left font-medium">Flags</th>
                  <th className="p-3 text-left font-medium">Time (ms)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Loading...</td></tr>
                ) : entries.length === 0 ? (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No audit entries</td></tr>
                ) : (
                  entries.map((entry) => (
                    <tr key={entry.id} className="border-b hover:bg-muted/20">
                      <td className="p-3 text-xs whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {entry.content_id.slice(0, 8)}...
                      </td>
                      <td className="p-3 text-xs">{entry.engine_version}</td>
                      <td className="p-3">
                        <span className={entry.c2pa_present ? "text-emerald-500" : "text-muted-foreground"}>
                          {entry.c2pa_present ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="p-3 font-mono">
                        {(entry.vtl_score * 100).toFixed(1)}%
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierColor[entry.trust_tier] || ""}`}>
                          {entry.trust_tier}
                        </span>
                      </td>
                      <td className="p-3">
                        {entry.flags?.length > 0 ? (
                          <span className="text-xs">
                            {entry.flags.filter((f) => f.type === "critical").length > 0 && (
                              <Badge variant="destructive" className="text-xs mr-1">
                                {entry.flags.filter((f) => f.type === "critical").length} critical
                              </Badge>
                            )}
                            {entry.flags.filter((f) => f.type === "warning").length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {entry.flags.filter((f) => f.type === "warning").length} warn
                              </Badge>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">None</span>
                        )}
                      </td>
                      <td className="p-3 text-xs font-mono">{entry.processing_time_ms}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {entries.length >= 50 && (
            <div className="p-3 border-t flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page + 1}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) {
  const { variant, size, className, ...rest } = props;
  return <button className={`px-3 py-1.5 rounded text-sm border ${className || ""}`} {...rest} />;
}
