import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationFilter, Notification } from "@/types/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationItem from "./NotificationItem";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationsListProps {
  selectedNotification?: Notification | null;
  onNotificationSelect?: (notification: Notification) => void;
}

export default function NotificationsList({
  selectedNotification,
  onNotificationSelect,
}: NotificationsListProps) {
  const {
    notifications,
    filter,
    setFilter,
    showUnreadOnly,
    setShowUnreadOnly,
    unreadCount,
    markAsRead,
    markAllAsRead,
    loading,
  } = useNotifications();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-border border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    onNotificationSelect?.(notification);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Activity</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Unreads</span>
          <Switch
            checked={showUnreadOnly}
            onCheckedChange={setShowUnreadOnly}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-sidebar-border">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as NotificationFilter)}
        >
          <TabsList className="grid w-full grid-cols-5 bg-transparent">
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
            <TabsTrigger value="mentions" className="text-xs">
              @ Mentions
            </TabsTrigger>
            <TabsTrigger value="threads" className="text-xs">
              # Threads
            </TabsTrigger>
            <TabsTrigger value="reactions" className="text-xs">
              ⚡ Reactions
            </TabsTrigger>
            <TabsTrigger value="invitations" className="text-xs">
              ✉ Invitations
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Notifications */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-sidebar-accent rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="font-medium mb-2">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">
              When you have notifications, they'll show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-sidebar-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-colors",
                  selectedNotification?.id === notification.id &&
                    "bg-sidebar-accent"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {unreadCount > 0 && (
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="w-full"
          >
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
}
