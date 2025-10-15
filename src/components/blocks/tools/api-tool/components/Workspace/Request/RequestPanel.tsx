import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import prettyBytes from "pretty-bytes";
import {
  convertKeyValueToObject,
  convertObjectToKeyValue,
} from "../../../utils/helpers";
import UrlEditor from "../../Panes/RequestUrl/UrlEditor";
import RequestTabGroup from "../../Tab-Groups/RequestTabGroup";
import { toast } from "@/hooks/useToast";
import { saveRequestToHistory } from "../../../utils/requestHistory";

interface KeyPair {
  id: string;
  keyItem: string;
  valueItem: string;
  enabled?: boolean;
}

const keyPairInitState: KeyPair[] = [
  {
    id: uuidv4(),
    keyItem: "",
    valueItem: "",
    enabled: true,
  },
];

interface RequestProps {
  setResponse: (response: any) => void;
  setLoading: (loading: boolean) => void;
  loading: boolean;
  historyItem?: any;
  onHistoryLoaded?: () => void;
}

export default function Request({
  setResponse,
  setLoading,
  loading,
  historyItem,
  onHistoryLoaded,
}: RequestProps) {
  const [url, setUrl] = useState(
    "https://jsonplaceholder.typicode.com/todos/1"
  );
  const [reqMethod, setReqMethod] = useState("GET");
  const [queryParams, setQueryParams] = useState<KeyPair[]>(keyPairInitState);
  const [headers, setHeaders] = useState<KeyPair[]>([
    {
      id: uuidv4(),
      keyItem: "Content-Type",
      valueItem: "application/json",
      enabled: true,
    },
  ]);
  const [body, setBody] = useState("{\n  \n}");

  // Load history item when provided
  useEffect(() => {
    if (historyItem) {
      setUrl(historyItem.url);
      setReqMethod(historyItem.method);

      // Convert headers object to key-value pairs
      const historyHeaders = convertObjectToKeyValue(historyItem.headers);
      setHeaders(
        historyHeaders.length > 0
          ? historyHeaders
          : [
              {
                id: uuidv4(),
                keyItem: "Content-Type",
                valueItem: "application/json",
                enabled: true,
              },
            ]
      );

      // Convert params object to key-value pairs
      const historyParams = convertObjectToKeyValue(historyItem.params);
      setQueryParams(
        historyParams.length > 0 ? historyParams : keyPairInitState
      );

      // Set body
      if (historyItem.body) {
        setBody(historyItem.body);
      } else {
        setBody("{\n  \n}");
      }

      // Notify parent that history has been loaded
      if (onHistoryLoaded) {
        onHistoryLoaded();
      }
    }
  }, [historyItem]);

  const handleOnInputSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const startTime = performance.now();

    const requestBody = body.toString();
    console.log("HTTP Method:", reqMethod);
    console.log("Headers:", headers);
    console.log("Query Params:", queryParams);
    console.log("Body:", requestBody);

    let data;
    if (reqMethod !== "GET" && requestBody.trim()) {
      try {
        data = JSON.parse(requestBody);
      } catch (e) {
        toast({
          title: "JSON Error",
          description: "Request body is not valid JSON",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await axios({
        url: url,
        method: reqMethod,
        params: convertKeyValueToObject(queryParams),
        headers: convertKeyValueToObject(headers),
        data,
      });

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Calculate response size
      const dataSize = JSON.stringify(response.data).length;
      const headersSize = JSON.stringify(response.headers).length;
      const size = prettyBytes(dataSize + headersSize);

      // Add custom data for time tracking
      const responseWithCustomData = {
        ...response,
        customData: {
          time: `${duration}ms`,
        },
      };

      setResponse(responseWithCustomData);

      // Save to history
      saveRequestToHistory({
        url,
        method: reqMethod,
        headers: convertKeyValueToObject(headers),
        params: convertKeyValueToObject(queryParams),
        body: requestBody || "",
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          time: `${duration}ms`,
          size,
        },
      });

      toast({
        title: "Success",
        description: `Request completed in ${duration}ms`,
      });
    } catch (error: any) {
      console.error("Request error:", error);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      // Handle error response
      if (error.response) {
        // Calculate response size
        const dataSize = JSON.stringify(error.response.data).length;
        const headersSize = JSON.stringify(error.response.headers).length;
        const size = prettyBytes(dataSize + headersSize);

        const errorResponseWithCustomData = {
          ...error.response,
          customData: {
            time: `${duration}ms`,
          },
        };
        setResponse(errorResponseWithCustomData);

        // Save error response to history
        saveRequestToHistory({
          url,
          method: reqMethod,
          headers: convertKeyValueToObject(headers),
          params: convertKeyValueToObject(queryParams),
          body: requestBody || "",
          response: {
            status: error.response.status,
            statusText: error.response.statusText,
            headers: error.response.headers,
            data: error.response.data,
            time: `${duration}ms`,
            size,
          },
        });
      } else {
        setResponse({
          status: 0,
          data: {
            error: true,
            message: error.message || "Network error",
          },
          headers: {},
          customData: {
            time: `${duration}ms`,
          },
        });

        // Save network error to history
        saveRequestToHistory({
          url,
          method: reqMethod,
          headers: convertKeyValueToObject(headers),
          params: convertKeyValueToObject(queryParams),
          body: requestBody || "",
          response: {
            status: 0,
            statusText: "Network Error",
            headers: {},
            data: {
              error: true,
              message: error.message || "Network error",
            },
            time: `${duration}ms`,
            size: "0 B",
          },
        });
      }

      toast({
        title: "Request Failed",
        description: error.message || "Unable to send request",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <UrlEditor
        url={url}
        setUrl={setUrl}
        reqMethod={reqMethod}
        setReqMethod={setReqMethod}
        onInputSend={handleOnInputSend}
        loading={loading}
      />
      <RequestTabGroup
        queryParams={queryParams}
        setQueryParams={setQueryParams}
        headers={headers}
        setHeaders={setHeaders}
        body={body}
        setBody={setBody}
      />
    </div>
  );
}
