import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KeyValuePane from "../Panes/KeyValue/KeyValuePane";
import JsonEditorPane from "../Panes/Json/JsonEditorPane";
import { Badge } from "@/components/ui/badge";

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
  const enabledQueryParams = queryParams.filter(
    (p) => p.enabled !== false
  ).length;
  const enabledHeaders = headers.filter((h) => h.enabled !== false).length;

  return (
    <Tabs defaultValue="body" className="mt-4">
      <TabsList className="bg-zinc-800 border-zinc-700">
        <TabsTrigger
          value="query-params"
          className="data-[state=active]:bg-zinc-700"
        >
          Query Params
          {enabledQueryParams > 0 && (
            <Badge className="ml-2 bg-blue-600 text-xs px-1.5 py-0">
              {enabledQueryParams}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger
          value="headers"
          className="data-[state=active]:bg-zinc-700"
        >
          Headers
          {enabledHeaders > 0 && (
            <Badge className="ml-2 bg-blue-600 text-xs px-1.5 py-0">
              {enabledHeaders}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="body" className="data-[state=active]:bg-zinc-700">
          Body
        </TabsTrigger>
      </TabsList>

      <TabsContent
        value="query-params"
        className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
      >
        <KeyValuePane paneValue={queryParams} setPaneValue={setQueryParams} />
      </TabsContent>

      <TabsContent
        value="headers"
        className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
      >
        <KeyValuePane paneValue={headers} setPaneValue={setHeaders} />
      </TabsContent>

      <TabsContent
        value="body"
        className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-400">Request Body (JSON)</span>
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
