import React, { useEffect, useRef, useState } from "react";

const DEFAULT_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoidXNlcjFAZXhhbXBsZS5jb20iLCJ1c2VybmFtZSI6InVzZXIxIiwicm9sZSI6InVzZXIiLCJnaXRodWJfdmVyaWZpZWQiOnRydWUsImdpdGh1Yl9pbnN0YWxsYXRpb25faWQiOm51bGwsImlhdCI6MTc1ODgxMjMyMiwiZXhwIjoxNzU4ODk4NzIyfQ.bn89y5x7NrNEHKQtuGiPzctTqEG0XKUXnO-KoUX0grU";
const DEFAULT_URL = "http://localhost:3088/v1/notifications/stream";

export default function TestNotiLayout(): JSX.Element {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [token, setToken] = useState(DEFAULT_TOKEN);
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addLog(message: string) {
    setLogs((s) => {
      const next = [`[${new Date().toLocaleTimeString()}] ${message}`, ...s];
      return next.slice(0, 200);
    });
  }

  function connect() {
    disconnect(); // ensure no duplicate
    // set cookie used by server-side auth (path optional)
    document.cookie = `access_token=${token}; path=/`;

    try {
      const es = new EventSource(url, { withCredentials: true } as any);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
        addLog("✅ SSE connected");
      };

      es.onmessage = (ev) => {
        addLog(`📩 message: ${ev.data}`);
      };

      es.onerror = (err) => {
        addLog("❌ SSE error (check server).");
        // Some servers close connection; mark disconnected if readyState is CLOSED
        const ready = esRef.current?.readyState;
        if (ready === EventSource.CLOSED) {
          setConnected(false);
          addLog("🔒 SSE closed by server");
        }
        console.error("SSE error", err);
      };
    } catch (err) {
      addLog("❌ Failed to create EventSource: " + String(err));
    }
  }

  // Force reconnect even if already connected
  function forceConnect() {
    disconnect();
    // small delay to ensure previous connection closed
    setTimeout(() => {
      connect();
    }, 100);
  }

  function disconnect() {
    const es = esRef.current;
    if (es) {
      es.close();
      esRef.current = null;
      setConnected(false);
      addLog("🔌 Disconnected");
    }
  }

  return (
    <div className="p-4 font-sans">
      <h2 className="text-2xl font-semibold mb-4">SSE Notifications Test</h2>

      <div className="mb-3">
        <label className="block mb-1 text-sm text-gray-700">SSE URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="mb-3">
        <label className="block mb-1 text-sm text-gray-700">
          Access token (will be set as cookie)
        </label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={connect}
          disabled={connected}
          className="px-4 py-2 rounded-md text-white bg-red-600 disabled:opacity-50"
        >
          Connect
        </button>

        <button
          onClick={forceConnect}
          className="px-4 py-2 rounded-md text-white bg-yellow-500"
        >
          Force Connect
        </button>

        <button
          onClick={disconnect}
          disabled={!connected}
          className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 disabled:opacity-50"
        >
          Disconnect
        </button>

        <button
          onClick={() => {
            setLogs([]);
          }}
          className="px-3 py-2 rounded-md bg-blue-600 text-white ml-2"
        >
          Clear logs
        </button>

        <span className="ml-3 text-sm text-gray-600">
          Status:{" "}
          <span className="font-medium">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </span>
      </div>

      <div className="border border-gray-200 p-3 h-80 overflow-auto bg-gray-50 rounded-md">
        {logs.length === 0 ? (
          <div className="text-gray-500">No events yet</div>
        ) : null}
        <ul className="pl-4">
          {logs.map((l, i) => (
            <li key={i} className="mb-2 text-sm whitespace-pre-wrap">
              {l}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
