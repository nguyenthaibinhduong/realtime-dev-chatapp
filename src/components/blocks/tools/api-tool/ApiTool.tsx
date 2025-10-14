import React, { useState } from "react";
import Request from "./components/Workspace/Request/RequestPanel";
import Response from "./components/Workspace/Response/ResponsePanel";
import { Card, CardContent } from "@/components/ui/card";
import Layout from "./components/Layout/Layout";

const ApiTool: React.FC = () => {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Layout>
      {/* Request Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <Request
            setResponse={setResponse}
            setLoading={setLoading}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Response Section */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6">
          <Response response={response} loading={loading} />
        </CardContent>
      </Card>
    </Layout>
  );
};

export default ApiTool;
