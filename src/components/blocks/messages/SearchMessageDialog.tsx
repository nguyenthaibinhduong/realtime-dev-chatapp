import { useState, useCallback, useEffect } from "react";
import { Search, X, Loader2, MessageSquare, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatAPI } from "@/api/api";
import { useToast } from "@/hooks/useToast";
import AvatarUser from "@/components/common/AvartarUser";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { StatusDropDown } from "./StatusDropDown";
import { useAuth } from "@/hooks/useAuth";

interface SearchMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelMessages?: any[]; // Tin nhắn đã load trong kênh
  onMessageSelect?: (messageId: string) => void;
}

// Message type configurations
const MESSAGE_TYPES = [
  { value: "all", label: "Tất cả", color: "zinc" },
  { value: "message", label: "Tin nhắn", color: "blue" },
  { value: "ba-require", label: "BA Require", color: "purple" },
  { value: "tester-report", label: "Tester Report", color: "red" },
  { value: "code-share", label: "Code Share", color: "green" },
  { value: "code-card", label: "Code Card", color: "emerald" },
  { value: "tool", label: "Tool", color: "orange" },
  { value: "file-upload", label: "File Upload", color: "pink" },
  { value: "reply-message", label: "Reply", color: "cyan" },
];

export const SearchMessageDialog = ({
  open,
  onOpenChange,
  channelId,
  channelMessages,
  onMessageSelect,
}: SearchMessageDialogProps) => {
  const [searchKey, setSearchKey] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedType, setSelectedType] = useState("all");
  const { toast } = useToast();

  // Load tin nhắn từ channel khi mở dialog (nếu chưa search)
  useEffect(() => {
    if (open && !searchKey.trim()) {
      // Hiển thị tin nhắn đã load trong kênh
      setResults(channelMessages);
      setTotalResults(channelMessages.length);
      setHasMore(false);
    }
  }, [open, searchKey, channelMessages]);

  // Debounced search
  useEffect(() => {
    if (!searchKey.trim() || searchKey.trim().length < 2) {
      // Hiển thị lại tin nhắn trong kênh
      setResults(channelMessages);
      setTotalResults(channelMessages.length);
      setHasMore(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(searchKey, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKey, channelId, channelMessages]);

  const handleSearch = async (key: string, pageNum: number) => {
    if (!key.trim() || key.trim().length < 2) return;

    setLoading(true);
    try {
      const response = await ChatAPI.searchMessagesByKeyword({
        key: key.trim(),
        channelId: channelId,
        limit: 20,
        page: pageNum,
      });

      if (response?.data) {
        const { items, total, hasMore: hasMoreResults } = response.data;

        if (pageNum === 1) {
          setResults(items || []);
        } else {
          setResults((prev) => [...prev, ...(items || [])]);
        }

        setTotalResults(total || 0);
        setHasMore(hasMoreResults || false);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Lỗi tìm kiếm",
        description: error?.message || "Không thể tìm kiếm tin nhắn",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      handleSearch(searchKey, page + 1);
    }
  };

  const handleMessageClick = (messageId: string) => {
    onMessageSelect?.(messageId);
    onOpenChange(false);
  };

  const handleClear = () => {
    setSearchKey("");
    setSelectedType("all");
    setResults(channelMessages);
    setTotalResults(channelMessages.length);
    setHasMore(false);
    setPage(1);
  };

  // Filter messages by type (client-side)
  const filteredResults =
    selectedType === "all"
      ? results
      : results.filter((msg) => msg.type === selectedType);

  // Get badge color based on type
  const getTypeBadgeColor = (type: string) => {
    const config = MESSAGE_TYPES.find((t) => t.value === type);
    return config?.color || "zinc";
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-800 -mx-6 -mt-6 px-6 py-6 mb-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-black dark:text-white tracking-tight flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Search className="h-6 w-6 text-blue-500" />
              </div>
              Tìm kiếm tin nhắn
            </DialogTitle>
          </DialogHeader>

          {/* Search Input */}
          <div className="mt-4 relative">
            <Input
              placeholder="Nhập từ khóa để tìm kiếm (tối thiểu 2 ký tự) hoặc để trống để xem tất cả..."
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              className="pl-10 pr-10 h-12 bg-zinc-100 dark:bg-zinc-800 border-zinc-700 text-black dark:text-white placeholder:text-zinc-400 rounded-xl"
              autoFocus
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            {searchKey && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-zinc-400" />
              </button>
            )}
          </div>

          {/* Filter by Type */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Filter className="h-4 w-4" />
              <span>Lọc theo loại tin nhắn:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedType === type.value
                    ? `bg-${type.color}-500/30 text-${type.color}-300 border border-${type.color}-500/50 shadow-lg`
                    : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/50"
                    }`}
                >
                  {type.label}
                  {selectedType === type.value && (
                    <span className="ml-1.5">({filteredResults.length})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 flex items-center gap-2">
            {searchKey.trim() ? (
              <>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  {totalResults} kết quả tìm kiếm
                </Badge>
                {hasMore && (
                  <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
                    Còn nhiều kết quả
                  </Badge>
                )}
              </>
            ) : (
              <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/50">
                Hiển thị {filteredResults.length}/{channelMessages.length} tin nhắn
                trong kênh
              </Badge>
            )}
            {selectedType !== "all" && (
              <Badge
                className={`bg-${getTypeBadgeColor(selectedType)}-500/20 text-${getTypeBadgeColor(
                  selectedType
                )}-400 border-${getTypeBadgeColor(selectedType)}-500/50`}
              >
                Lọc:{" "}
                {MESSAGE_TYPES.find((t) => t.value === selectedType)?.label}
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 px-6">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="space-y-3 pb-4">
              {filteredResults.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleMessageClick(msg.id)}
                  className="p-4 bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl border border-zinc-800 cursor-pointer transition-all duration-200 group"
                >
                  {/* Sender Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <AvatarUser user={msg.sender} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-black dark:text-white truncate">
                          {msg.sender?.username || "Unknown"}
                        </p>
                        {msg.isMine && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
                            Bạn
                          </Badge>
                        )}
                        {/* Message Type Badge */}
                        {msg.type && msg.type !== "message" && (
                          <Badge
                            className={`bg-${getTypeBadgeColor(msg.type)}-500/20 text-${getTypeBadgeColor(
                              msg.type
                            )}-400 border-${getTypeBadgeColor(msg.type)}-500/50 text-xs`}
                          >
                            {MESSAGE_TYPES.find((t) => t.value === msg.type)?.label ||
                              msg.type}
                          </Badge>
                        )}
                        {msg.json_data?.status && (
                          <StatusDropDown
                            msg={msg}
                          />
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        {msg.send_at &&
                          formatDistanceToNow(new Date(msg.send_at), {
                            addSuffix: true,
                            locale: vi,
                          })}
                      </p>
                    </div>
                  </div>

                  {/* Message Content with Highlight */}
                  <div
                    className="text-sm text-black dark:text-white break-words line-clamp-3"
                    dangerouslySetInnerHTML={{
                      __html: msg.highlightedText || msg.text,
                    }}
                    style={{
                      wordBreak: "break-word",
                    }}
                  />

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                      <MessageSquare className="h-3 w-3" />
                      {msg.attachments.length} tệp đính kèm
                    </div>
                  )}

                  {/* Pinned Indicator */}
                  {msg.isPin && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
                      <span>📌</span>
                      <span>Đã ghim</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && searchKey.trim() && (
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </span>
                  ) : (
                    "Tải thêm kết quả"
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {searchKey.trim().length >= 2
                  ? "Không tìm thấy kết quả"
                  : selectedType !== "all"
                    ? "Không có tin nhắn loại này"
                    : "Chưa có tin nhắn nào"}
              </p>
              <p className="text-sm">
                {searchKey.trim().length >= 2
                  ? "Thử tìm kiếm với từ khóa khác"
                  : selectedType !== "all"
                    ? "Thử chọn loại tin nhắn khác"
                    : "Gửi tin nhắn đầu tiên trong kênh này"}
              </p>
              {(searchKey.trim() || selectedType !== "all") && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="mt-4 bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
