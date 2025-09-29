import { EventSourcePolyfill } from "event-source-polyfill";

class SSEConnection {
  private eventSource: EventSourcePolyfill | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // 1 second

  constructor(
    url: string = `${import.meta.env.VITE_SOCKET_URL || "http://localhost:3088"}/v1/notifications/stream`
  ) {
    this.url = url;
  }

  connect(): EventSourcePolyfill | null {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No token found in localStorage");
        return null;
      }

      // Create EventSource with Authorization header
      this.eventSource = new EventSourcePolyfill(this.url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
        },
        withCredentials: false, // Không cần credentials khi dùng Bearer token
        heartbeatTimeout: 30000, // 30 seconds
      });

      // Setup event handlers
      this.setupEventHandlers();

      console.log("SSE connection established with Bearer token");
      return this.eventSource;
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      return null;
    }
  }

  private setupEventHandlers(): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = (event) => {
      console.log("✅ SSE connection opened");
      this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    };

    this.eventSource.onmessage = (event) => {
      console.log("📩 New SSE message:", event.data);
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (parseError) {
        console.error("Failed to parse SSE message:", parseError);
      }
    };

    this.eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);

      // Check if connection is closed
      if (this.eventSource?.readyState === EventSourcePolyfill.CLOSED) {
        console.log("🔒 SSE connection closed by server");
        this.attemptReconnect();
      } else if (
        this.eventSource?.readyState === EventSourcePolyfill.CONNECTING
      ) {
        console.log("🔄 SSE connection is trying to reconnect");
      }
    };
  }

  private handleMessage(data: any): void {
    // Handle different types of messages
    console.log("Processing message:", data);

    // You can dispatch custom events or call callbacks here
    const customEvent = new CustomEvent("sse-message", { detail: data });
    window.dispatchEvent(customEvent);
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached. Giving up.");
      return;
    }

    // Check if token is still available before reconnecting
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No token available for reconnection");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      this.close();
      this.connect();
    }, delay);
  }

  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log("🔌 SSE connection closed");
    }
  }

  // Get current connection state
  getReadyState(): number | null {
    return this.eventSource?.readyState || null;
  }

  // Check if connection is open
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSourcePolyfill.OPEN;
  }

  // Add custom event listener for specific message types
  addEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    this.eventSource?.addEventListener(type, listener);
  }

  // Remove event listener
  removeEventListener(
    type: string,
    listener: (event: MessageEvent) => void
  ): void {
    this.eventSource?.removeEventListener(type, listener);
  }

  // Method to update Authorization header (useful for token refresh)
  updateToken(newToken: string): void {
    if (this.isConnected()) {
      console.log("Updating token, reconnecting SSE...");
      this.close();
      setTimeout(() => this.connect(), 100);
    }
  }
}

// Create singleton instance
const sseConnection = new SSEConnection();

// Export both class and instance
export { SSEConnection };
export default sseConnection;

// Helper function to initialize SSE with token validation
export function initializeSSE(url?: string): EventSourcePolyfill | null {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("Cannot initialize SSE: No token found in localStorage");
    return null;
  }

  if (url) {
    const customSSE = new SSEConnection(url);
    return customSSE.connect();
  }

  return sseConnection.connect();
}

// Helper function to check token and reconnect if needed
export function ensureSSEConnection(): boolean {
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("No token available for SSE connection");
    sseConnection.close();
    return false;
  }

  if (!sseConnection.isConnected()) {
    console.log("SSE not connected, attempting to connect...");
    const connection = sseConnection.connect();
    return connection !== null;
  }

  return true;
}

// Listen for token changes in localStorage
window.addEventListener("storage", (event) => {
  if (event.key === "token") {
    if (event.newValue) {
      // Token updated, reconnect with new token
      console.log("Token updated, reconnecting SSE...");
      sseConnection.updateToken(event.newValue);
    } else {
      // Token removed, close connection
      console.log("Token removed, closing SSE connection");
      sseConnection.close();
    }
  }
});
