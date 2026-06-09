import { useEffect, useState } from "react";
import { Filter, Loader2, Paperclip, Pin, Search, X } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface SearchMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  channelMessages?: any[];
  onMessageSelect?: (messageId: string) => void;
}

const TYPE_STYLES: Record<
  string,
  { selected: string; badge: string; dot: string }
> = {
  zinc: {
    selected: "border-primary bg-primary text-white shadow-sm",
    badge: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  blue: {
    selected: "border-blue-600 bg-blue-600 text-white shadow-sm",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  violet: {
    selected: "border-violet-600 bg-violet-600 text-white shadow-sm",
    badge:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  red: {
    selected: "border-red-600 bg-red-600 text-white shadow-sm",
    badge:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300",
    dot: "bg-red-500",
  },
  emerald: {
    selected: "border-emerald-600 bg-emerald-600 text-white shadow-sm",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  amber: {
    selected: "border-amber-600 bg-amber-600 text-white shadow-sm",
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  rose: {
    selected: "border-rose-600 bg-rose-600 text-white shadow-sm",
    badge:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  cyan: {
    selected: "border-cyan-600 bg-cyan-600 text-white shadow-sm",
    badge:
      "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-300",
    dot: "bg-cyan-500",
  },
};

const FILTER_BUTTON_BASE =
  "inline-flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const FILTER_BUTTON_UNSELECTED =
  "border-border/80 bg-background text-muted-foreground hover:border-primary/30 hover:bg-accent hover:text-foreground";

const MESSAGE_TYPES = [
  { value: "all", label: "Tất cả", color: "zinc" },
  { value: "message", label: "Tin nhắn", color: "blue" },
  { value: "ba-require", label: "BA Require", color: "violet" },
  { value: "tester-report", label: "Tester Report", color: "red" },
  { value: "code-share", label: "Code Share", color: "emerald" },
  { value: "code-card", label: "Code Card", color: "emerald" },
  { value: "tool", label: "Tool", color: "amber" },
  { value: "file-upload", label: "File Upload", color: "rose" },
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
  const loadedMessages = channelMessages ?? [];

  useEffect(() => {
    if (open && !searchKey.trim()) {
      const messages = channelMessages ?? [];

      setResults(messages);
      setTotalResults(messages.length);
      setHasMore(false);
    }
  }, [open, searchKey, channelMessages]);

  useEffect(() => {
    const messages = channelMessages ?? [];

    if (!searchKey.trim() || searchKey.trim().length < 2) {
      setResults(messages);
      setTotalResults(messages.length);
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
    const messages = channelMessages ?? [];

    setSearchKey("");
    setSelectedType("all");
    setResults(messages);
    setTotalResults(messages.length);
    setHasMore(false);
    setPage(1);
  };

  const filteredResults =
    selectedType === "all"
      ? results
      : results.filter((msg) => msg.type === selectedType);

  const getTypeConfig = (type?: string) => {
    const config = MESSAGE_TYPES.find((item) => item.value === type);
    return config ?? MESSAGE_TYPES[1];
  };

  const getTypeStyle = (type?: string) => {
    const config = getTypeConfig(type);
    return TYPE_STYLES[config.color] ?? TYPE_STYLES.zinc;
  };

  const selectedTypeLabel = getTypeConfig(selectedType).label;
  const isSearching = searchKey.trim().length >= 2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(86vh,760px)] w-[calc(100vw-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-xl border border-border bg-background p-0 text-foreground shadow-xl shadow-black/10 dark:shadow-black/30 sm:w-[min(920px,calc(100vw-2rem))] [&>button]:rounded-md [&>button]:text-muted-foreground [&>button:hover]:bg-accent [&>button:hover]:text-foreground [&>button_svg]:text-muted-foreground">
        <div className="border-b border-border bg-card px-5 py-5 sm:px-6">
          <DialogHeader className="space-y-0">
            <DialogTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight text-foreground">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
                <Search className="h-5 w-5" />
              </span>
              Tìm kiếm tin nhắn
            </DialogTitle>
          </DialogHeader>

          <div className="mt-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Nhập từ khóa tối thiểu 2 ký tự, hoặc để trống để xem tin nhắn gần đây"
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="h-11 rounded-md border-input bg-background pl-9 pr-10 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-primary/25"
                autoFocus
              />
              {searchKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Lọc theo loại tin nhắn</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {MESSAGE_TYPES.map((type) => {
                const isSelected = selectedType === type.value;
                const style = TYPE_STYLES[type.color] ?? TYPE_STYLES.zinc;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={cn(
                      FILTER_BUTTON_BASE,
                      isSelected ? style.selected : FILTER_BUTTON_UNSELECTED
                    )}
                  >
                    {type.value !== "all" && (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          isSelected ? "bg-white/85" : style.dot
                        )}
                      />
                    )}
                    <span className="whitespace-nowrap">{type.label}</span>
                    {isSelected && (
                      <span className="rounded bg-white/15 px-1.5 py-0.5 text-[11px] leading-none">
                        {filteredResults.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {isSearching ? (
              <>
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-primary"
                >
                  {totalResults} kết quả tìm kiếm
                </Badge>
                {hasMore && (
                  <Badge
                    variant="outline"
                    className="border-border bg-muted text-muted-foreground"
                  >
                    Còn nhiều kết quả
                  </Badge>
                )}
              </>
            ) : (
              <Badge
                variant="outline"
                className="border-border bg-muted text-muted-foreground"
              >
                Hiển thị {filteredResults.length}/{loadedMessages.length} tin
                nhắn trong kênh
              </Badge>
            )}
            {selectedType !== "all" && (
              <Badge
                variant="outline"
                className={cn("gap-1.5", getTypeStyle(selectedType).badge)}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    getTypeStyle(selectedType).dot
                  )}
                />
                Lọc: {selectedTypeLabel}
              </Badge>
            )}
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-4 sm:px-6">
            {loading && results.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-2.5 pb-2">
                {filteredResults.map((msg) => {
                  const typeConfig = getTypeConfig(msg.type);
                  const typeStyle = getTypeStyle(msg.type);
                  const messageHtml = msg.highlightedText || msg.text;

                  return (
                    <button
                      key={msg.id}
                      type="button"
                      onClick={() => handleMessageClick(msg.id)}
                      className="group w-full rounded-lg border border-border/80 bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/25 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex items-start gap-3">
                        <AvatarUser user={msg.sender} size={8} />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {msg.sender?.username || "Unknown"}
                            </p>
                            {msg.isMine && (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                              >
                                Bạn
                              </Badge>
                            )}
                            {msg.type && msg.type !== "message" && (
                              <Badge
                                variant="outline"
                                className={cn("text-[11px]", typeStyle.badge)}
                              >
                                {typeConfig.label}
                              </Badge>
                            )}
                            {msg.json_data?.status && (
                              <StatusDropDown msg={msg} />
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {msg.send_at &&
                              formatDistanceToNow(new Date(msg.send_at), {
                                addSuffix: true,
                                locale: vi,
                              })}
                          </p>
                        </div>
                      </div>

                      {messageHtml ? (
                        <div
                          className="mt-3 line-clamp-3 break-words text-sm leading-6 text-foreground/90 [&_mark]:rounded [&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:text-yellow-950 dark:[&_mark]:bg-yellow-400/25 dark:[&_mark]:text-yellow-100"
                          dangerouslySetInnerHTML={{ __html: messageHtml }}
                          style={{ wordBreak: "break-word" }}
                        />
                      ) : (
                        <p className="mt-3 text-sm italic text-muted-foreground">
                          Tin nhắn không có nội dung
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {msg.attachments && msg.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            <Paperclip className="h-3.5 w-3.5" />
                            {msg.attachments.length} tệp đính kèm
                          </span>
                        )}
                        {msg.isPin && (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-300">
                            <Pin className="h-3.5 w-3.5" />
                            Đã ghim
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                {hasMore && isSearching && (
                  <Button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loading}
                    variant="outline"
                    className="h-11 w-full rounded-md border-border bg-background text-foreground hover:bg-accent"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </span>
                    ) : (
                      "Tải thêm kết quả"
                    )}
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center px-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                  <Search className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold text-foreground">
                  {isSearching
                    ? "Không tìm thấy kết quả"
                    : selectedType !== "all"
                      ? "Không có tin nhắn loại này"
                      : "Chưa có tin nhắn nào"}
                </p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  {isSearching
                    ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc hiện tại."
                    : selectedType !== "all"
                      ? "Thử chọn loại tin nhắn khác để mở rộng kết quả."
                      : "Kênh này chưa có tin nhắn để hiển thị."}
                </p>
                {(searchKey.trim() || selectedType !== "all") && (
                  <Button
                    type="button"
                    onClick={handleClear}
                    variant="outline"
                    className="mt-4 border-border bg-background hover:bg-accent"
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
