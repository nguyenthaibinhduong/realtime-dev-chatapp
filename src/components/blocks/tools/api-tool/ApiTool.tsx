import React, { useState, useEffect } from "react";
import Request from "./components/Workspace/Request/RequestPanel";
import Response from "./components/Workspace/Response/ResponsePanel";
import HistoryPanel from "./components/History/HistoryPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "./components/Layout/Layout";
import { type RequestHistoryItem } from "./utils/requestHistory";
import { toast } from "@/hooks/useToast";

type ApiToolProps = {
  initialHistoryItem?: any;
};

const ApiTool: React.FC<ApiToolProps> = ({ initialHistoryItem }) => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("request");
  const [loadHistoryItem, setLoadHistoryItem] =
    useState<RequestHistoryItem | null>(null);

  const handleSelectHistory = (item: RequestHistoryItem) => {
    setLoadHistoryItem(item);
    setSelectedTab("request");

    // Also load the response
    setResponse({
      status: item.response.status,
      statusText: item.response.statusText,
      data: item.response.data,
      headers: item.response.headers,
      customData: {
        time: item.response.time,
      },
    });
  };

  // Normalize arbitrary shared payload into RequestHistoryItem-like shape
  const normalizeToHistoryItem = (i: any): RequestHistoryItem => {
    const method = (i.method || i.request?.method || "GET").toUpperCase();
    const url = i.url || i.request?.url || "";
    const headers = i.headers || i.request?.headers || {};
    const body = i.body || i.request?.body || null;
    const params = i.params || i.request?.params || {};

    return {
      id: i.id || String(Date.now()),
      name: i.name || url || "Shared Request",
      // keep nested request for other consumers
      request: {
        method,
        url,
        headers,
        body,
      },
      // top-level fields for RequestPanel compatibility
      method,
      url,
      headers,
      params,
      body,
      response: {
        status: i.response?.status || i.status || 0,
        statusText: i.response?.statusText || "",
        data: i.response?.data || i.response?.body || null,
        headers: i.response?.headers || {},
        time: i.response?.time || "",
      },
      createdAt: i.createdAt || new Date().toISOString(),
    } as unknown as RequestHistoryItem;
  };

  // If parent passes an initialHistoryItem (e.g., from a shared tool message), load it
  useEffect(() => {
    if (initialHistoryItem) {
      try {
        const normalized = normalizeToHistoryItem(initialHistoryItem);
        handleSelectHistory(normalized);
      } catch (err) {
        // swallow
        // eslint-disable-next-line no-console
        console.warn("Failed to load initial history item", err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHistoryItem]);

  return (
    <Layout>
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800 px-5">
          <TabsTrigger
            value="request"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            Request / Response
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-white data-[state=active]:text-black"
          >
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-4">
          {/* Request Section */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <Request
                setResponse={setResponse}
                setLoading={setLoading}
                loading={loading}
                historyItem={loadHistoryItem}
                onHistoryLoaded={() => setLoadHistoryItem(null)}
              />
            </CardContent>
          </Card>

          {/* Response Section */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <Response response={response} loading={loading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6 h-[calc(100vh-200px)]">
              <HistoryPanel onSelectHistory={handleSelectHistory} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default ApiTool;
