import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KeyValuePane from "../Panes/KeyValue/KeyValuePane";
import JsonEditorPane from "../Panes/Json/JsonEditorPane";
import { Badge } from "@/components/ui/badge";
import { blockUi } from "@/components/blocks/block-ui";

interface KeyPair {
  id: string;
  keyItem: string;
  valueItem: string;
  enabled?: boolean;
}

interface RequestTabGroupProps {
  queryParams: KeyPair[];
  setQueryParams: React.Dispatch<React.SetStateAction<KeyPair[]>>;
  headers: KeyPair[];
  setHeaders: React.Dispatch<React.SetStateAction<KeyPair[]>>;
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
}

export default function RequestTabGroup({
  queryParams,
  setQueryParams,
  headers,
  setHeaders,
  body,
  setBody,
}: RequestTabGroupProps) {
  const enabledQueryParams = queryParams.filter((p) => p.enabled !== false).length;
  const enabledHeaders = headers.filter((h) => h.enabled !== false).length;

  return (
    <Tabs
      defaultValue="body"
      className="mt-2 w-full text-foreground"
    >
      {/* Tabs header: dark, mobile-friendly, wrap/scroll, reduced padding */}
      <TabsList
        className="
          w-full bg-muted border border-border rounded-md
          p-1 flex flex-wrap gap-1 overflow-x-auto
          sticky top-0 z-10
        "
      >
        <TabsTrigger
          value="query-params"
          className="
            text-xs sm:text-sm px-2 py-1 rounded-md
            text-muted-foreground hover:text-foreground hover:bg-accent
            data-[state=active]:bg-background data-[state=active]:text-foreground
            outline-none focus-visible:ring-2 focus-visible:ring-ring
            transition
          "
        >
          Query Params
          {enabledQueryParams > 0 && (
            <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 rounded">
              {enabledQueryParams}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger
          value="headers"
          className="
            text-xs sm:text-sm px-2 py-1 rounded-md
            text-muted-foreground hover:text-foreground hover:bg-accent
            data-[state=active]:bg-background data-[state=active]:text-foreground
            outline-none focus-visible:ring-2 focus-visible:ring-ring
            transition
          "
        >
          Headers
          {enabledHeaders > 0 && (
            <Badge className="ml-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0 rounded">
              {enabledHeaders}
            </Badge>
          )}
        </TabsTrigger>

        <TabsTrigger
          value="body"
          className="
            text-xs sm:text-sm px-2 py-1 rounded-md
            text-muted-foreground hover:text-foreground hover:bg-accent
            data-[state=active]:bg-background data-[state=active]:text-foreground
            outline-none focus-visible:ring-2 focus-visible:ring-ring
            transition
          "
        >
          Body
        </TabsTrigger>
      </TabsList>

      {/* Panels: darker bg, white text, thinner padding, rounded */}
      <TabsContent
        value="query-params"
        className={`mt-2 p-2 sm:p-3 ${blockUi.section}`}
      >
        <KeyValuePane paneValue={queryParams} setPaneValue={setQueryParams} />
      </TabsContent>

      <TabsContent
        value="headers"
        className={`mt-2 p-2 sm:p-3 ${blockUi.section}`}
      >
        <KeyValuePane paneValue={headers} setPaneValue={setHeaders} />
      </TabsContent>

      <TabsContent
        value="body"
        className={`mt-2 p-2 sm:p-3 ${blockUi.section}`}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Request Body (JSON)
            </span>
          </div>
          <JsonEditorPane
            paneValue={body}
            setPaneValue={setBody}
            isEditable={true}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
