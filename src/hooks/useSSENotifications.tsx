import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import sseConnection, { initializeSSE, ensureSSEConnection } from "@/api/sse";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

interface SSEMessage {
  userId: number;
  type: "group" | "personal"; //Thêm loại message (git, tag,...)
  data: any
  createAt: string;
}

interface NotificationContextType {
  connected: boolean;
  lastMessage: SSEMessage | null;
  messageCount: number;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  isConnecting: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
  enableToast?: boolean;
  toastConfig?: {
    duration?: number;
    variant?: "default" | "destructive";
  };
}

function renderNotificationContent(message: SSEMessage): [string, React.ReactNode] {
  if (!message) return ["", null];

  let title: string = "";
  let description: React.ReactNode = "";

  switch (message.type) {
    case "group":
      title = `Channel: ${message.data.channel?.name}`;
      description = (
        <div>
          <div><strong>From:</strong> {message.data.sender?.username}</div>
          <div><strong>Message:</strong> {message.data.text}</div>
        </div>
      );
      break;

    case "personal":
      title = `Direct message`;
      description = (
        <div>
          <div><strong>From:</strong> {message.data.sender?.username}</div>
          <div><strong>Message:</strong> {message.data.text}</div>
        </div>
      );
      break;

    default:
      title = `New ${message.type} notification`;
      description = null;
  }

  return [title, description];
}



export function NotificationProvider({
  children,
  autoConnect = true,
  enableToast = true,
  toastConfig = { duration: 5000, variant: "default" },
}: NotificationProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const currentUserId = user?.id;

  const { toast } = useToast();

  
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SSEMessage | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Use ref to track if we're already connected to prevent multiple connections
  const connectionAttempted = useRef(false);
  const currentEventSource = useRef<EventSource | null>(null);

  // Handle SSE messages - stable reference
  const handleSSEMessage = useCallback((event: CustomEvent<SSEMessage>) => {
    const message = event.detail;
    console.log("📩 Received SSE notification:", message);

    setLastMessage(message);
    setMessageCount(prev => prev + 1);

    if (enableToast) {
      const [title, description] = renderNotificationContent(message);

      toast({
        title,
        description,
        variant: toastConfig.variant,
        duration: toastConfig.duration,
      });
    }
  }, [currentUserId, enableToast, toastConfig.variant, toastConfig.duration]);

  // Stable connect function
  const connect = useCallback(() => {
    // Prevent multiple connection attempts
    if (connectionAttempted.current || isConnecting) {
      console.log("Connection already attempted or in progress");
      return;
    }

    if (!isAuthenticated()) {
      console.warn("Cannot connect SSE: User not authenticated");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("Cannot connect SSE: No token found");
      return;
    }

    console.log("Attempting SSE connection...");
    connectionAttempted.current = true;
    setIsConnecting(true);
    
    const eventSource = initializeSSE();
    
    if (eventSource) {
      currentEventSource.current = eventSource;
      
      eventSource.addEventListener('open', () => {
        console.log("✅ SSE connection established");
        setConnected(true);
        setIsConnecting(false);
      });
      
      eventSource.addEventListener('error', () => {
        console.log("❌ SSE connection error");
        setConnected(false);
        setIsConnecting(false);
        connectionAttempted.current = false; // Allow retry
      });
    } else {
      setIsConnecting(false);
      connectionAttempted.current = false;
    }
  }, [isAuthenticated]);

  // Stable disconnect function
  const disconnect = useCallback(() => {
    console.log("Disconnecting SSE...");
    sseConnection.close();
    if (currentEventSource.current) {
      currentEventSource.current.close();
      currentEventSource.current = null;
    }
    setConnected(false);
    setIsConnecting(false);
    connectionAttempted.current = false;
  }, []);

  // Stable reconnect function
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, 1000);
  }, [connect, disconnect]);

  // Setup event listeners - chỉ chạy 1 lần
  useEffect(() => {
    window.addEventListener('sse-message', handleSSEMessage);

    return () => {
      window.removeEventListener('sse-message', handleSSEMessage);
    };
  }, [handleSSEMessage]);

  // Auto-connect logic - tách riêng và chỉ phụ thuộc vào authentication state
  useEffect(() => {
    if (autoConnect && isAuthenticated() && currentUserId && !connected && !isConnecting) {
      console.log(`Auto-connecting SSE for user ID: ${currentUserId}`);
      connect();
    } else if (!isAuthenticated() && (connected || isConnecting)) {
      console.log("User not authenticated, disconnecting SSE");
      disconnect();
    }
  }, [autoConnect, isAuthenticated, currentUserId, connected, isConnecting]); // Bỏ connect/disconnect khỏi deps

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // Monitor connection state
  useEffect(() => {
    const checkConnection = () => {
      const isConnected = sseConnection.isConnected();
      if (connected !== isConnected) {
        setConnected(isConnected);
      }
    };

    const interval = setInterval(checkConnection, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [connected]);

  // Handle token changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token') {
        if (event.newValue) {
          // Token updated, reconnect
          reconnect();
        } else {
          // Token removed, disconnect
          disconnect();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [reconnect, disconnect]);

  const value: NotificationContextType = {
    connected,
    lastMessage,
    messageCount,
    connect,
    disconnect,
    reconnect,
    isConnecting,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use the notification context
export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}

// Helper hook for easy access to notification status
export function useNotificationStatus() {
  const { connected, messageCount, isConnecting } = useNotificationContext();
  return { connected, messageCount, isConnecting };
}

// Helper hook to get last message
export function useLastNotification() {
  const { lastMessage } = useNotificationContext();
  return lastMessage;
}