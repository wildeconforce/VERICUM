"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Pencil, Upload, Globe } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

interface ProvenanceEvent {
  action: string;
  device?: string;
  software?: string;
  timestamp: string;
  platform?: string;
  changes?: string[];
}

interface ProvenanceChainProps {
  events: ProvenanceEvent[];
}

const actionIcons: Record<string, typeof Camera> = {
  created: Camera,
  edited: Pencil,
  uploaded: Upload,
  published: Globe,
};

export function ProvenanceChain({ events }: ProvenanceChainProps) {
  if (!events?.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Provenance Chain</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-6">
            {events.map((event, i) => {
              const Icon = actionIcons[event.action] || Globe;
              return (
                <div key={i} className="relative flex items-start gap-4 pl-1">
                  <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className="font-medium capitalize text-sm">
                      {event.action}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-0.5 mt-0.5">
                      {event.device && <p>Device: {event.device}</p>}
                      {event.software && <p>Software: {event.software}</p>}
                      {event.platform && <p>Platform: {event.platform}</p>}
                      {event.changes?.length && (
                        <p>Changes: {event.changes.join(", ")}</p>
                      )}
                      <p>{formatDate(event.timestamp)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
