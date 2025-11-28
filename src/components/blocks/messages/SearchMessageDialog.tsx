import { useState, useCallback, useEffect } from "react";
import { Search, X, Loader2, MessageSquare } from "lucide-react";
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

interface SearchMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  onMessageSelect?: (messageId: string) => void;
}

export const SearchMessageDialog = ({
  open,
  onOpenChange,
  channelId,
  onMessageSelect,
}: SearchMessageDialogProps) => {
  const [searchKey, setSearchKey] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const { toast } = useToast();

  // Debounced search
  useEffect(() => {
    if (!searchKey.trim() || searchKey.trim().length < 2) {
      setResults([]);
      setTotalResults(0);
      setHasMore(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(searchKey, 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKey, channelId]);

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
      console.log("Search response:", response);
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
    setResults([]);
    setTotalResults(0);
    setHasMore(false);
    setPage(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
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
              placeholder="Nhập từ khóa (tối thiểu 2 ký tự)..."
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

          {/* Results Count */}
          {totalResults > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                {totalResults} kết quả
              </Badge>
              {hasMore && (
                <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700">
                  Còn nhiều kết quả
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 px-6">
          {loading && results.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-3 pb-4">
              {results.map((msg) => (
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
                    className="text-sm text-black dark:text-white break-words"
                    dangerouslySetInnerHTML={{
                      __html: msg.highlightedText || msg.text,
                    }}
                    style={
                      {
                        // Style cho <mark> tag
                        "& mark": {
                          backgroundColor: "rgb(59 130 246 / 0.3)",
                          color: "inherit",
                          padding: "2px 4px",
                          borderRadius: "4px",
                          fontWeight: "600",
                        },
                      } as any
                    }
                  />

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
                      <MessageSquare className="h-3 w-3" />
                      {msg.attachments.length} tệp đính kèm
                    </div>
                  )}

                  {/* Channel Info (if searching across channels) */}
                  {msg.channelName && (
                    <div className="mt-2 text-xs text-zinc-500">
                      trong #{msg.channelName}
                    </div>
                  )}
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
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
          ) : searchKey.trim().length >= 2 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Không tìm thấy kết quả</p>
              <p className="text-sm">Thử tìm kiếm với từ khóa khác</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
              <Search className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nhập từ khóa để tìm kiếm</p>
              <p className="text-sm">Tối thiểu 2 ký tự</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
