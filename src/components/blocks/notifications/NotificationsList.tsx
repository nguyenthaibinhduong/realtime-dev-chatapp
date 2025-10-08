import { cn, formatExactTimeHelper, formatTimeHelper } from "@/lib/utils";
import { Notification } from "@/types/notifications";
import {
  Users,
  MessageCircle,
  Loader2,
  Settings,
  GitBranch,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useEffect, useRef, useCallback, useState, useMemo, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "path";

interface NotificationsListProps {
  notifications: Notification[] | any[];
  selectedNotification?: Notification | any | null;
  onNotificationSelect?: (notification: Notification | any) => void;
  setFilter: (filter: any) => void;
  filter: any;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onMarkAllAsRead?: () => void;
}

// Skeleton Components
const NotificationSkeleton = memo(() => (
  <div className="p-4 border-b border-sidebar-border/20">
    <div className="flex items-start gap-3">
      {/* Avatar skeleton */}
      <div className="w-8 h-8 bg-sidebar-accent/50 rounded-full animate-pulse flex-shrink-0" />

      <div className="flex-1 min-w-0 space-y-2">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-3 bg-sidebar-accent/50 rounded animate-pulse w-24" />
          <div className="h-3 bg-sidebar-accent/30 rounded animate-pulse w-12" />
        </div>

        {/* Content skeleton */}
        <div className="h-3 bg-sidebar-accent/40 rounded animate-pulse w-3/4" />

        {/* Time skeleton */}
        <div className="h-2 bg-sidebar-accent/30 rounded animate-pulse w-20" />
      </div>
    </div>
  </div>
));
NotificationSkeleton.displayName = "NotificationSkeleton";

const InitialLoadingSkeleton = memo(() => (
  <div className="space-y-0">
    {Array.from({ length: 6 }, (_, i) => (
      <NotificationSkeleton key={i} />
    ))}
  </div>
));
InitialLoadingSkeleton.displayName = "InitialLoadingSkeleton";

const LoadMoreSkeleton = memo(() => (
  <div className="border-t border-sidebar-border/20 space-y-0">
    {Array.from({ length: 3 }, (_, i) => (
      <NotificationSkeleton key={i} />
    ))}
  </div>
));
LoadMoreSkeleton.displayName = "LoadMoreSkeleton";

// Memoized NotificationIcon Component
const NotificationIcon = memo(({ type }: { type: string }) => {
  const iconClass = "w-4 h-4 text-white";

  const iconConfig = useMemo(
    () => ({
      group: { bg: "bg-blue-500", Icon: Users },
      system: { bg: "bg-orange-500", Icon: Settings },
      git: { bg: "bg-green-500", Icon: GitBranch },
      default: { bg: "bg-blue-500", Icon: MessageCircle },
    }),
    []
  );

  const config =
    iconConfig[type as keyof typeof iconConfig] || iconConfig.default;
  const { bg, Icon } = config;

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        bg
      )}
    >
      <Icon className={iconClass} />
    </div>
  );
});
NotificationIcon.displayName = "NotificationIcon";

// Memoized NotificationItem Component với format mới
const NotificationItem = memo(
  ({
    notification,
    isSelected,
    onSelect,
    formatTime,
    formatExactTime,
  }: {
    notification: any;
    isSelected: boolean;
    onSelect: (notification: any) => void;
    formatTime: (dateString: string) => string;
    formatExactTime: (dateString: string) => string;
  }) => {
    // Format notification content dựa trên type
    const getNotificationDisplay = useMemo(() => {
      switch (notification.type) {
        case "message":
          const messageType = notification.data?.type || 'message';
          let messageTitle = `#${notification.data?.channel?.name || "kênh"}`;
          let messageContent = '';

          switch (messageType) {
            case "code-share":
              messageTitle = `🔗 ${notification.data?.channel?.name || "kênh"}`;
              messageContent = `${notification.data?.sender?.username || "Ai đó"} đã chia sẻ code: ${notification.data?.text || ""}`;
              break;
            case "file-upload":
              messageTitle = `📁 ${notification.data?.channel?.name || "kênh"}`;
              const attachmentCount = notification.data?.attachments?.length || 0;
              messageContent = `${notification.data?.sender?.username || "Ai đó"} đã gửi ${attachmentCount} file${attachmentCount > 1 ? 's' : ''}`;
              break;
            case "notification":
              messageTitle = `🔔 ${notification.data?.channel?.name || "kênh"}`;
              messageContent = `${notification.data?.sender?.username || "Ai đó"} ${notification.data?.text || ""}`;
              break;
            default:
              messageContent = `${notification.data?.sender?.username || "Ai đó"}: ${notification.data?.text || "tin nhắn"}`;
          }

          return {
            title: messageTitle,
            content: messageContent,
            titleClass: "text-blue-400 font-medium",
          };

        case "github":
          // GitHub có nhiều loại action khác nhau
          const action = notification.data?.action;

          if (action === "created") {
            // Installation created
            const repoCount = notification.data?.repositories?.length || 0;
            const owner = notification.data?.installation?.account?.login || "Unknown";

            return {
              title: `🔧 GitHub App - ${owner}`,
              content: `Đã cài đặt ứng dụng cho ${repoCount} repository${repoCount > 1 ? 's' : ''}`,
              titleClass: "text-green-400 font-medium",
              metadata: {
                action: "installation_created",
                repoCount,
                owner,
                createdAt: notification.data?.installation?.created_at,
              },
            };
          } else if (notification.data?.repository && notification.data?.commits) {
            // Push event
            const repository = notification.data.repository.name;
            const owner = notification.data.repository.owner?.login || notification.data.pusher?.name || "Unknown";
            const commitMessage = notification.data.head_commit?.message || "No commit message";
            const branch = notification.data.ref ? notification.data.ref.replace("refs/heads/", "") : "main";
            const commitsCount = notification.data.commits?.length || 1;

            return {
              title: `📦 ${owner}/${repository}`,
              content: `${commitsCount} commit${commitsCount > 1 ? "s" : ""} to ${branch}: ${commitMessage}`,
              titleClass: "text-green-400 font-medium",
              metadata: {
                action: "push",
                branch,
                commitsCount,
                author: notification.data.head_commit?.author?.name || owner,
                compareUrl: notification.data.compare,
              },
            };
          } else {
            // Other GitHub events
            return {
              title: `🐙 GitHub Event`,
              content: `Action: ${action || 'unknown'}`,
              titleClass: "text-green-400 font-medium",
              metadata: {
                action: action || 'unknown',
              },
            };
          }

        case "system":
          return {
            title: notification.data?.title || "Hệ thống",
            content:
              notification.data?.message ||
              notification.data?.description ||
              "Thông báo hệ thống",
            titleClass: "text-orange-400 font-medium",
          };

        default:
          return {
            title: notification.data?.title || "Thông báo",
            content:
              notification.data?.text ||
              notification.data?.message ||
              notification.data?.description ||
              "Nội dung thông báo",
            titleClass: "text-sidebar-foreground font-medium",
          };
      }
    }, [notification]);

    // Kiểm tra xem có phải notification mới không (có fakeID)
    const isNewNotification = Boolean(notification.fakeID);

    return (
      <div
        className={cn(
          "cursor-pointer transition-all duration-200 p-4 hover:bg-sidebar-accent/30 border-b border-sidebar-border/20",
          isSelected && !isNewNotification
            ? "bg-sidebar-accent/50 border-l-2 border-l-blue-500"
            : "border-l-2 border-l-transparent hover:border-l-blue-300",
          !notification.read && "bg-blue-50/5",
          // Animation cho notification mới - nền trắng chữ đen
          isNewNotification &&
          "bg-white text-black border-l-2 border-l-green-500"
        )}
        onClick={() => onSelect(notification)}
        style={
          isNewNotification
            ? {
              background: "white",
              color: "black",
              animation: "flash-white 0.8s ease-in-out 4",
              border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }
            : undefined
        }
      >
        <div className="flex items-start gap-3">
          <NotificationIcon type={notification.type} />

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header với thời gian và dot */}
            <div className="flex items-center justify-between">
              <h4
                className={cn(
                  "text-sm truncate",
                  getNotificationDisplay.titleClass,
                  isNewNotification && "text-gray-900 font-semibold" // Chữ đen đậm trên nền trắng
                )}
              >
                {getNotificationDisplay.title}
              </h4>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  className={cn(
                    "text-xs font-medium",
                    isNewNotification
                      ? "text-gray-600" // Xám đậm trên nền trắng
                      : "text-sidebar-foreground/50"
                  )}
                >
                  {formatTime(notification.createdAt)}
                </span>
                {!notification.read && (
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isNewNotification
                        ? "bg-green-600" // Xanh đậm hơn để thấy rõ trên nền trắng
                        : "bg-blue-500"
                    )}
                    style={
                      isNewNotification
                        ? {
                          animation: "pulse 1s ease-in-out infinite",
                          boxShadow: "0 0 4px rgba(34, 197, 94, 0.6)",
                        }
                        : undefined
                    }
                  />
                )}
              </div>
            </div>

            {/* Content - tin nhắn trên 1 hàng với ellipsis */}
            <p
              className={cn(
                "text-sm truncate leading-relaxed",
                isNewNotification
                  ? "text-gray-800" // Xám đậm cho content trên nền trắng
                  : "text-sidebar-foreground/80"
              )}
            >
              {getNotificationDisplay.content}
            </p>

            {/* GitHub specific metadata */}
            {notification.type === "github" && getNotificationDisplay.metadata && (
              <div className="flex items-center gap-3 text-xs text-sidebar-foreground/50">
                {getNotificationDisplay.metadata.action === "push" && (
                  <>
                    <span>Branch: {getNotificationDisplay.metadata.branch}</span>
                    <span>•</span>
                    <span>By: {getNotificationDisplay.metadata.author}</span>
                    {getNotificationDisplay.metadata.commitsCount > 1 && (
                      <>
                        <span>•</span>
                        <span>{getNotificationDisplay.metadata.commitsCount} commits</span>
                      </>
                    )}
                  </>
                )}
                {getNotificationDisplay.metadata.action === "installation_created" && (
                  <>
                    <span>Repositories: {getNotificationDisplay.metadata.repoCount}</span>
                    <span>•</span>
                    <span>Owner: {getNotificationDisplay.metadata.owner}</span>
                  </>
                )}
              </div>
            )}

            {/* Thời gian chính xác */}
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isNewNotification
                  ? "text-gray-500" // Xám nhạt cho thời gian trên nền trắng
                  : "text-sidebar-foreground/40"
              )}
            >
              <Clock className="w-3 h-3" />
              <span>{formatExactTime(notification.createdAt)}</span>
            </div>

            {/* Metadata nhỏ cho các loại khác */}
            {notification.type === "system" && (
              <div className="flex items-center gap-3 text-xs text-sidebar-foreground/40 pt-1">
                <span>Thông báo hệ thống</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);
NotificationItem.displayName = "NotificationItem";

// Memoized EmptyState Component
const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center h-64 text-center p-6">
    <div className="w-16 h-16 bg-sidebar-accent/30 rounded-full flex items-center justify-center mb-4">
      <span className="text-2xl">🔔</span>
    </div>
    <h3 className="font-semibold mb-2 text-sidebar-foreground">
      Chưa có hoạt động nào
    </h3>
    <p className="text-sm text-sidebar-foreground/60 max-w-sm">
      Khi có tin nhắn mới hoặc hoạt động khác, chúng sẽ xuất hiện ở đây.
    </p>
  </div>
));
EmptyState.displayName = "EmptyState";

// Memoized LoadingSpinner Component
const LoadingSpinner = memo(({ page }: { page?: number }) => (
  <div className="flex items-center justify-center py-4">
    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
    <span className="ml-2 text-sm text-sidebar-foreground/50">
      {page ? `Đang tải trang ${page}...` : "Đang tải..."}
    </span>
  </div>
));
LoadingSpinner.displayName = "LoadingSpinner";

// Manual Load More Button Component
const LoadMoreButton = memo(
  ({
    loading,
    page,
    notificationCount,
    onLoadMore,
  }: {
    loading: boolean;
    page: number;
    notificationCount: number;
    onLoadMore: () => void;
  }) => (
    <div className="p-4 border-t border-sidebar-border/30">
      {loading ? (
        <div>
          <LoadingSpinner page={page + 1} />
          <LoadMoreSkeleton />
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/30"
          onClick={onLoadMore}
        >
          <ChevronDown className="w-4 h-4 mr-2" />
          Xem thông báo trước đó
          <span className="ml-2 text-xs text-sidebar-foreground/50">
            ({notificationCount} đã tải)
          </span>
        </Button>
      )}
    </div>
  )
);
LoadMoreButton.displayName = "LoadMoreButton";

// Memoized LoadMoreTrigger Component (for auto scroll after page 2)
const LoadMoreTrigger = memo(
  ({
    loading,
    page,
    notificationCount,
    onRef,
  }: {
    loading: boolean;
    page: number;
    notificationCount: number;
    onRef: (ref: HTMLDivElement | null) => void;
  }) => (
    <div
      ref={onRef}
      className="min-h-[60px] flex items-center justify-center border-t border-sidebar-border/20"
    >
      {loading ? (
        <div className="w-full">
          <LoadingSpinner page={page + 1} />
          <LoadMoreSkeleton />
        </div>
      ) : (
        <div className="text-center py-3">
          <div className="text-xs text-sidebar-foreground/40 mb-1">
            Cuộn để tải thêm...
          </div>
        </div>
      )}
    </div>
  )
);
LoadMoreTrigger.displayName = "LoadMoreTrigger";

// Memoized EndState Component
const EndState = memo(
  ({
    notificationCount,
    pageCount,
  }: {
    notificationCount: number;
    pageCount: number;
  }) => (
    <div className="text-center py-6 border-t border-sidebar-border/30">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <span className="text-green-500 text-sm">✓</span>
        </div>
        <span className="text-sm text-sidebar-foreground/50">
          Đã hiển thị tất cả hoạt động
        </span>
        <span className="text-xs text-sidebar-foreground/30">
          Tổng cộng {notificationCount} mục
        </span>
      </div>
    </div>
  )
);
EndState.displayName = "EndState";

export default function NotificationsList({
  notifications,
  selectedNotification,
  onNotificationSelect,
  setFilter,
  filter,
  loading = false,
  hasMore = true,
  onLoadMore,
  onMarkAllAsRead,
}: NotificationsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const isLoadingRef = useRef(false);
  const lastLoadedCountRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Memoized filter options
  const filterOptions = useMemo(
    () => [
      { value: "all", label: "Tất cả", icon: MessageCircle },
      { value: "message", label: "Tin nhắn", icon: Users },
      { value: "system", label: "Hệ thống", icon: Settings },
      { value: "github", label: "GitHub", icon: GitBranch },
    ],
    []
  );

  const formatTime = useMemo(() => formatTimeHelper(), []);
  const formatExactTime = useMemo(() => formatExactTimeHelper(), []);

  const handleFilterChange = useCallback(
    (value: string) => {
      console.log("Filter changed to:", value);
      setActiveFilter(value);
      lastLoadedCountRef.current = 0;
      isLoadingRef.current = false;
      setIsInitialLoad(true);
      setFilter((prev: any) => ({
        ...prev,
        type: value,
        page: 1,
      }));
    },
    [setFilter]
  );

  // Memoized notification select handler
  const handleNotificationSelect = useCallback(
    (notification: any) => {
      onNotificationSelect?.(notification);
    },
    [onNotificationSelect]
  );

  // Manual load more handler
  const handleManualLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      onLoadMore?.();
    }
  }, [loading, hasMore, onLoadMore]);

  // Track initial load completion
  useEffect(() => {
    if (!loading && notifications.length > 0 && isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loading, notifications.length, isInitialLoad]);

  // Reset initial load state on filter change
  useEffect(() => {
    if (notifications.length === 0) {
      setIsInitialLoad(true);
    }
  }, [notifications.length]);

  // Cleanup observer function
  const cleanupObserver = useCallback(() => {
    if (observerRef.current && loadingRef.current) {
      observerRef.current.unobserve(loadingRef.current);
    }
  }, []);

  // Setup observer function - chỉ hoạt động từ trang 2 trở đi
  const setupObserver = useCallback(() => {
    if (!loadingRef.current || !hasMore || filter.page < 2) return;

    cleanupObserver();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];

        if (
          target.isIntersecting &&
          hasMore &&
          !loading &&
          !isLoadingRef.current &&
          notifications.length > 0 &&
          notifications.length > lastLoadedCountRef.current &&
          filter.page >= 2 // Chỉ auto scroll từ trang 2
        ) {
          console.log("🚀 Auto scroll triggering load more...");
          isLoadingRef.current = true;
          lastLoadedCountRef.current = notifications.length;
          onLoadMore?.();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "20px",
      }
    );

    observerRef.current.observe(loadingRef.current);
  }, [
    hasMore,
    loading,
    notifications.length,
    onLoadMore,
    cleanupObserver,
    filter.page,
  ]);

  // Setup observer khi dependencies thay đổi
  useEffect(() => {
    if (filter.page >= 2) {
      // Chỉ setup từ trang 2
      const timeoutId = setTimeout(() => {
        setupObserver();
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        cleanupObserver();
      };
    }
  }, [setupObserver, filter.page]);

  // Reset loading state khi loading complete
  useEffect(() => {
    if (!loading && isLoadingRef.current) {
      setTimeout(() => {
        isLoadingRef.current = false;
      }, 500);
    }
  }, [loading]);

  // Reset count khi notifications reset
  useEffect(() => {
    if (notifications.length === 0) {
      lastLoadedCountRef.current = 0;
      isLoadingRef.current = false;
    }
  }, [notifications.length]);

  // Memoized rendered notifications
  const renderedNotifications = useMemo(
    () =>
      notifications.map((notification: any, index) => (
        <NotificationItem
          key={`${notification._id}-${index}`}
          notification={notification}
          isSelected={selectedNotification?._id === notification._id}
          onSelect={handleNotificationSelect}
          formatTime={formatTime}
          formatExactTime={formatExactTime}
        />
      )),
    [
      notifications,
      selectedNotification?._id,
      handleNotificationSelect,
      formatTime,
      formatExactTime,
    ]
  );

  // Memoized filter tabs
  const filterTabs = useMemo(
    () =>
      filterOptions.map((option) => {
        const IconComponent = option.icon;
        return (
          <TabsTrigger
            key={option.value}
            value={option.value}
            className={cn(
              "text-xs px-3 py-1.5 transition-all",
              "text-sidebar-foreground/70 hover:text-sidebar-foreground/90",
              "data-[state=active]:bg-white data-[state=active]:text-black",
              "data-[state=active]:shadow-sm"
            )}
          >
            <IconComponent className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">{option.label}</span>
          </TabsTrigger>
        );
      }),
    [filterOptions]
  );

  // Memoized header content với unread count
  const headerContent = useMemo(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-sidebar-foreground">Hoạt động</h1>
        {notifications.length > 0 && !isInitialLoad && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-sidebar-accent px-2 py-1 rounded-full text-sidebar-foreground/70">
              {notifications.length}
            </span>
            {unreadCount > 0 && (
              <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [notifications, isInitialLoad]);

  // Memoized loading ref callback
  const setLoadingRef = useCallback((ref: HTMLDivElement | null) => {
    loadingRef.current = ref;
  }, []);

  const handleMarkAllAsRead = () => {
    onMarkAllAsRead?.();
    // Optionally, you can also refresh the notifications list here
  };

  return (
    <div className="flex flex-col h-[calc(100vh)] bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar/80 backdrop-blur-sm">
        {headerContent}
      </div>

      {/* Filter Tabs */}
      <div className="p-3 border-b border-sidebar-border/50">
        <Tabs value={activeFilter} onValueChange={handleFilterChange}>
          <TabsList className="w-full bg-sidebar-accent/30 h-9">
            {filterTabs}
          </TabsList>
        </Tabs>
      </div>

      {/* Content với ScrollArea */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="h-full">
          {/* Initial Loading Skeleton */}
          {isInitialLoad && loading && notifications.length === 0 ? (
            <InitialLoadingSkeleton />
          ) : notifications.length === 0 && !loading ? (
            <EmptyState />
          ) : (
            <div>
              {renderedNotifications}

              {/* Loading/Load More Section */}
              {hasMore && (
                <>
                  {filter.page === 1 ? (
                    // Trang 1: Hiển thị button manual
                    <LoadMoreButton
                      loading={loading}
                      page={filter.page}
                      notificationCount={notifications.length}
                      onLoadMore={handleManualLoadMore}
                    />
                  ) : (
                    // Từ trang 2: Auto scroll trigger
                    <LoadMoreTrigger
                      loading={loading}
                      page={filter.page}
                      notificationCount={notifications.length}
                      onRef={setLoadingRef}
                    />
                  )}
                </>
              )}

              {/* End State */}
              {!hasMore && notifications.length > 0 && (
                <EndState
                  notificationCount={notifications.length}
                  pageCount={filter.page}
                />
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Button */}
      <div className="h-[4rem] p-2 py-4 flex justify-center items-center bg-gradient-to-t from-sidebar to-transparent">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={handleMarkAllAsRead}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </div>
    </div>
  );
}
