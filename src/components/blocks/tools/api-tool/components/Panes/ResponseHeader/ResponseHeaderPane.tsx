import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ResponseHeaderPaneProps {
  response: any;
}

export default function ResponseHeaderPane({
  response,
}: ResponseHeaderPaneProps) {
  const responseHeaders: { key: string; value: string }[] = [];

  if (response != null && "headers" in response) {
    Object.entries(response.headers).forEach(([key, value]) => {
      responseHeaders.push({
        key: key,
        value: value as string,
      });
    });
  }

  if (responseHeaders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No headers available</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {responseHeaders.map(({ key, value }, index) => (
          <div
            key={index}
            className="flex gap-2 p-3 bg-muted/60 rounded-lg border border-border"
          >
            <div className="flex-shrink-0 min-w-[200px]">
              <Badge
                variant="outline"
                className="font-mono text-xs text-blue-400 border-blue-400/30"
              >
                {key}
              </Badge>
            </div>
            <div className="flex-1 font-mono text-sm text-foreground break-all">
              {value}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
