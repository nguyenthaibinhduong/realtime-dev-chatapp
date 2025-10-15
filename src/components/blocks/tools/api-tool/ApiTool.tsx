import React, { useState } from "react";
import Request from "./components/Workspace/Request/RequestPanel";
import Response from "./components/Workspace/Response/ResponsePanel";
import HistoryPanel from "./components/History/HistoryPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "./components/Layout/Layout";
import { type RequestHistoryItem } from "./utils/requestHistory";
import { toast } from "@/hooks/useToast";

const ApiTool: React.FC = () => {
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

    toast({
      title: "History Loaded",
      description: "Request loaded from history",
    });
  };

  return (
    <Layout>
      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-zinc-800">
          <TabsTrigger
            value="request"
            className="data-[state=active]:bg-zinc-700"
          >
            Request / Response
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-zinc-700"
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
