import React, { useState, useEffect } from "react";
import {
  getRequestHistory,
  deleteRequestFromHistory,
  clearRequestHistory,
  searchRequestHistory,
  type RequestHistoryItem,
} from "../../utils/requestHistory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  Trash2,
  Search,
  X,
  RefreshCw,
  ArrowRight,
  Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { chatSocketService } from "@/services/chatSocketService";
import { toast } from "@/hooks/useToast";

interface HistoryPanelProps {
  onSelectHistory?: (item: RequestHistoryItem) => void;
}

const getMethodColor = (method: string) => {
  switch (method.toUpperCase()) {
    case "GET":
      return "bg-green-500";
    case "POST":
      return "bg-blue-500";
    case "PUT":
      return "bg-yellow-500";
    case "DELETE":
      return "bg-red-500";
    case "PATCH":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
};

const getStatusColor = (status: number) => {
  if (status >= 200 && status < 300) return "text-green-500";
  if (status >= 300 && status < 400) return "text-blue-500";
  if (status >= 400 && status < 500) return "text-yellow-500";
  return "text-red-500";
};

export default function HistoryPanel({ onSelectHistory }: HistoryPanelProps) {
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredHistory, setFilteredHistory] = useState<RequestHistoryItem[]>(
    []
  );

  const loadHistory = () => {
    const data = getRequestHistory();
    setHistory(data);
    setFilteredHistory(data);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchRequestHistory(searchQuery);
      setFilteredHistory(results);
    } else {
      setFilteredHistory(history);
    }
  }, [searchQuery, history]);

  const handleDelete = (id: string) => {
    deleteRequestFromHistory(id);
    loadHistory();
  };

  const handleClearAll = () => {
    clearRequestHistory();
    loadHistory();
  };

  const handleShare = (item: RequestHistoryItem) => {
    chatSocketService.sendMessage({
      channelId: localStorage.getItem("selectedChannelId") || "",
      text: `Thông tin request đã được chia sẻ:\n\n**${item.method} ${item.url}**\n- Status: ${item.response.status}\n- Time: ${item.response.time}\n- Size: ${item.response.size}\n\nBạn có thể xem chi tiết trong lịch sử request.`,
      type: "tool",
      json_data: JSON.stringify({ ...item, timeshared: new Date().toISOString() }),
    });
    toast({
      title: "Thông tin request đã được chia sẻ",
      description: `Thông tin request đã được chia sẻ:\n\n**${item.method} ${item.url}**\n- Status: ${item.response.status}\n- Time: ${item.response.time}\n- Size: ${item.response.size}\n\nBạn có thể xem chi tiết trong lịch sử request.`,
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return "Vừa xong";
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-black dark:text-white">Request History</h2>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadHistory}
            className="text-zinc-400 hover:text-black dark:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300"
                >
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-zinc-50
dark:bg-zinc-900 border-zinc-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black dark:text-white">
                    Clear History
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-zinc-400">
                    Are you sure you want to clear all request history? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-zinc-100 dark:bg-zinc-800 border-zinc-700 text-black dark:text-white hover:bg-zinc-200 dark:bg-zinc-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          placeholder="Search history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 bg-zinc-100 dark:bg-zinc-800 border-zinc-700 text-black dark:text-white"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-zinc-200 dark:bg-zinc-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-zinc-50
dark:bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500">
          <Clock className="h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">
            {searchQuery ? "No matching requests found" : "No history yet"}
          </p>
          <p className="text-xs mt-1">
            {searchQuery
              ? "Try a different search query"
              : "Your request history will appear here"}
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-2">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-zinc-50
dark:bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={cn(
                          "font-mono text-xs",
                          getMethodColor(item.method)
                        )}
                      >
                        {item.method}
                      </Badge>
                      <span
                        className={cn(
                          "font-mono text-sm font-semibold",
                          getStatusColor(item.response.status)
                        )}
                      >
                        {item.response.status}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-black dark:text-white truncate mb-1">
                      {item.url}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>⏱ {item.response.time}</span>
                      <span>📦 {item.response.size}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onSelectHistory && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectHistory(item)}
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-black dark:text-white"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleShare(item)}
                          className="h-8 w-8 p-0 text-black dark:text-white hover:bg-blue-800"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
