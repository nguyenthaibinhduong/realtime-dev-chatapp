import { useState, useEffect } from "react";
import { Notification, NotificationFilter } from "@/types/notifications";
import { set } from "date-fns";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "mention",
        title: "Mention in # all-dev-chat",
        message: "hello world",
        avatar: "https://example.com/avatar1.png",
        username: "John Doe",
        channel: "all-dev-chat",
        timestamp: new Date("2025-08-08T21:06:00"),
        isRead: false,
      },
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    if (showUnreadOnly && notification.isRead) return false;
    if (filter === "all") return true;
    if (filter === "mentions") return notification.type === "mention";
    if (filter === "threads") return notification.type === "thread";
    if (filter === "reactions") return notification.type === "reaction";
    if (filter === "invitations") return notification.type === "invitation";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  const getNotificationById = (id: string): void => {
      const notification = notifications.find((notification) => notification.id === id);
      setSelectedNotification(notification);
    };



  return {
    notifications: filteredNotifications,
    filter,
    selectedNotification,
    setFilter,
    showUnreadOnly,
    setShowUnreadOnly,
    unreadCount,
    markAsRead,
    markAllAsRead,
    getNotificationById,
    loading,
  };
}
