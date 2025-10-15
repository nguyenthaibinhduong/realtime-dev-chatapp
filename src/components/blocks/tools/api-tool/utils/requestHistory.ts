export interface RequestHistoryItem {
  id: string;
  timestamp: number;
  url: string;
  method: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: string;
  response: {
    status: number;
    statusText: string;
    headers: Record<string, any>;
    data: any;
    time: string;
    size: string;
  };
}

const HISTORY_KEY = "api_tool_request_history";
const MAX_HISTORY_ITEMS = 100;

export const saveRequestToHistory = (
  requestData: Omit<RequestHistoryItem, "id" | "timestamp">
) => {
  try {
    const history = getRequestHistory();
    const newItem: RequestHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...requestData,
    };

    // Add new item at the beginning
    history.unshift(newItem);

    // Keep only the last MAX_HISTORY_ITEMS
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmedHistory));
    return newItem;
  } catch (error) {
    console.error("Error saving request to history:", error);
    return null;
  }
};

export const getRequestHistory = (): RequestHistoryItem[] => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error("Error getting request history:", error);
    return [];
  }
};

export const getRequestHistoryById = (
  id: string
): RequestHistoryItem | null => {
  try {
    const history = getRequestHistory();
    return history.find((item) => item.id === id) || null;
  } catch (error) {
    console.error("Error getting request history by id:", error);
    return null;
  }
};

export const deleteRequestFromHistory = (id: string): boolean => {
  try {
    const history = getRequestHistory();
    const filteredHistory = history.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filteredHistory));
    return true;
  } catch (error) {
    console.error("Error deleting request from history:", error);
    return false;
  }
};

export const clearRequestHistory = (): boolean => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing request history:", error);
    return false;
  }
};

export const searchRequestHistory = (query: string): RequestHistoryItem[] => {
  try {
    const history = getRequestHistory();
    const lowercaseQuery = query.toLowerCase();

    return history.filter((item) => {
      return (
        item.url.toLowerCase().includes(lowercaseQuery) ||
        item.method.toLowerCase().includes(lowercaseQuery) ||
        JSON.stringify(item.response.data)
          .toLowerCase()
          .includes(lowercaseQuery)
      );
    });
  } catch (error) {
    console.error("Error searching request history:", error);
    return [];
  }
};
