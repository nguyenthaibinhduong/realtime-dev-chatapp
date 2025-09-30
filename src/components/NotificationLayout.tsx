import MasterLayout from "@/components/MasterLayout";
import NotificationsList from "@/components/blocks/notifications/NotificationsList";
import NotificationDetail from "./blocks/notifications/NotificationDetail";
import { useCallback, useEffect, useState, useRef } from "react";
import MenubarLayout from "./MenubarLayout";
import { Notification } from "@/types/notifications";
import { NotificationAPI } from "@/api/api";
import { useAuth } from "@/hooks/useAuth";

export default function NotificationLayout() {
  const { user } = useAuth();
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState({
    search: "",
    type: "all",
    page: 1,
  });

  // Sử dụng ref để tránh dependency issues
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  // Fetch notifications với pagination - Loại bỏ dependencies gây loop
  const fetchNotifications = useCallback(async (reset = false, currentPage?: number, currentType?: string) => {
    const pageToFetch = currentPage || filter.page;
    const typeToFetch = currentType || filter.type;

    console.log("fetchNotifications called:", { reset, page: pageToFetch, loading: loadingRef.current, hasMore: hasMoreRef.current });

    if (loadingRef.current || (!hasMoreRef.current && !reset)) {
      console.log("Skip fetch:", { loading: loadingRef.current, hasMore: hasMoreRef.current, reset });
      return;
    }

    setLoading(true);
    loadingRef.current = true;

    try {
      const actualPage = reset ? 1 : pageToFetch;
      console.log("Fetching page:", actualPage);

      const response = await NotificationAPI.fetchNotifications({
        page: actualPage,
        limit: 5,
        type: typeToFetch === "all" ? undefined : typeToFetch
      });

      const newNotifications = response?.data?.notifications || [];
      console.log("Received notifications:", newNotifications.length);

      if (reset) {
        setNotifications(newNotifications);
        setFilter(prev => ({ ...prev, page: 1 }));
      } else {
        setNotifications(prev => {
          const combined = [...prev, ...newNotifications];
          console.log("Total notifications after merge:", combined.length);
          return combined;
        });
      }

      const stillHasMore = newNotifications.length >= 5;
      setHasMore(stillHasMore);
      hasMoreRef.current = stillHasMore;

    } catch (error) {
      console.error("Error fetching notifications:", error);
      setHasMore(false);
      hasMoreRef.current = false;
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []); // Loại bỏ tất cả dependencies

  // Load more function - Simplified
  const loadMore = useCallback(() => {
    console.log("loadMore triggered, current page:", filter.page);
    if (!loadingRef.current && hasMoreRef.current) {
      const nextPage = filter.page + 1;
      setFilter(prev => ({
        ...prev,
        page: nextPage
      }));
      // Gọi trực tiếp với page mới thay vì dựa vào useEffect
      fetchNotifications(false, nextPage, filter.type);
    }
  }, [fetchNotifications, filter.page, filter.type]);

  // Reset khi filter type thay đổi - Simplified
  useEffect(() => {
    console.log("Filter type changed to:", filter.type);
    setNotifications([]);
    setHasMore(true);
    hasMoreRef.current = true;
    fetchNotifications(true, 1, filter.type);
  }, [filter.type, fetchNotifications]);

  // Initial load - Simplified
  useEffect(() => {
    if (user && notifications.length === 0) {
      console.log("Initial load for user:", user.id);
      fetchNotifications(true, 1, "all");
    }
  }, [user, fetchNotifications]); // Loại bỏ notifications.length dependency

  // Loại bỏ useEffect cho page change vì đã handle trong loadMore
  // useEffect(() => {
  //   if (filter.page > 1) {
  //     console.log("Page changed, loading more:", filter.page);
  //     fetchNotifications();
  //   }
  // }, [filter.page, fetchNotifications]);

  // Handle mark as read
  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification._id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  return (
    <MasterLayout
      menu={<MenubarLayout selected="notifications" />}
      sidebar={
        <NotificationsList
          notifications={notifications}
          selectedNotification={selectedNotification}
          onNotificationSelect={setSelectedNotification}
          setFilter={setFilter}
          filter={filter}
          loading={loading}
          hasMore={hasMore}
          onLoadMore={loadMore}
        />
      }
    >
      <NotificationDetail
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        onMarkAsRead={handleMarkAsRead}
      />
    </MasterLayout>
  );
}
