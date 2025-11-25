import React, { useState, useEffect } from "react";
import prettyBytes from "pretty-bytes";
import ResponseTabGroup from "../../Tab-Groups/ResponseTabGroup";
import { Badge } from "@/components/ui/badge";
import { Clock, Database, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResponseProps {
  response: any;
  loading: boolean;
}

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return "bg-green-500";
  if (status >= 300 && status < 400) return "bg-blue-500";
  if (status >= 400 && status < 500) return "bg-yellow-500";
  return "bg-red-500";
};

export default function Response({ response, loading }: ResponseProps) {
  const [doc, setDoc] = useState("{}");

  useEffect(() => {
    if (response === null) return;
    const jsonResponse = JSON.stringify(response.data, null, 2);
    setDoc(jsonResponse);
  }, [response]);

  const hasResponse = response != null;

  let time = "";
  let status = 0;
  let size = "";

  if (hasResponse) {
    const hasCustomData = "customData" in response;
    const hasData = "data" in response;
    const hasHeaders = "headers" in response;

    status = response.status || 0;

    if (hasData && hasHeaders) {
      const dataSize = JSON.stringify(response.data).length;
      const headersSize = JSON.stringify(response.headers).length;
      size = prettyBytes(dataSize + headersSize);
    }

    if (hasCustomData) {
      time = response.customData.time;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-black dark:text-white">Response</h2>
        {response && (
          <div className="flex items-center gap-3">
            <Badge className={cn("font-mono", getStatusColor(status))}>
              Status: {status}
            </Badge>
            {time && (
              <div className="flex items-center gap-1 text-sm text-zinc-400">
                <Clock className="h-4 w-4" />
                <span>{time}</span>
              </div>
            )}
            {size && (
              <div className="flex items-center gap-1 text-sm text-zinc-400">
                <Database className="h-4 w-4" />
                <span>{size}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!response && !loading && (
        <div className="flex flex-col items-center justify-center py-12 bg-zinc-50
dark:bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500">
          <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">No response yet</p>
          <p className="text-xs mt-1">Send a request to see the response</p>
        </div>
      )}

      {(response || loading) && (
        <ResponseTabGroup
          doc={doc}
          setDoc={setDoc}
          response={response}
          loading={loading}
        />
      )}
    </div>
  );
}
