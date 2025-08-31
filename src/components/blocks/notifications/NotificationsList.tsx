import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationFilter, Notification } from "@/types/notifications";
import { useNotifications } from "@/hooks/useNotifications";
import NotificationItem from "./NotificationItem";
import { MoreHorizontal, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const filterOptions = [
    { value: "all", label: "All" },
    { value: "mentions", label: "Mentions", icon: "@" },
    { value: "threads", label: "Threads", icon: "#" },
    { value: "reactions", label: "Reactions", icon: ":)" },
    { value: "invitations", label: "Invitations", icon: ">" },
  ];

  const currentFilter = filterOptions.find((opt) => opt.value === filter);

  return (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-sidebar-border bg-sidebar/50">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-sidebar-foreground">
            Activity
          </h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-sidebar-foreground/70 hidden sm:block">
            Unreads
          </span>
          <Switch
            checked={showUnreadOnly}
            onCheckedChange={setShowUnreadOnly}
          />
        </div>
      </div>

      {/* Filter Section - Responsive */}
      <div className="p-3 border-b border-sidebar-border">
        {/* Desktop: Horizontal Tabs */}
        <div className="hidden lg:block">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as NotificationFilter)}
          >
            <TabsList className="w-full bg-sidebar-accent/50 h-8">
              {filterOptions.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="text-xs px-2 py-1 text-white data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-foreground"
                >
                  <span className="mr-1">{option.icon}</span>
                  <span className="hidden xl:inline">{option.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Mobile/Tablet: Dropdown */}
        <div className="lg:hidden flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                <span>{currentFilter?.icon}</span>
                <span className="hidden sm:inline">{currentFilter?.label}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {filterOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setFilter(option.value as NotificationFilter)}
                  className={cn(
                    "flex items-center gap-2",
                    filter === option.value && "bg-sidebar-accent"
                  )}
                >
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Notifications */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <div className="w-16 h-16 bg-sidebar-accent/50 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🔔</span>
            </div>
            <h3 className="font-medium mb-2 text-sidebar-foreground">
              No notifications yet
            </h3>
            <p className="text-sm text-sidebar-foreground/70">
              When you have notifications, they'll show up here.
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  "cursor-pointer transition-colors border-l-2",
                  selectedNotification?.id === notification.id
                    ? "bg-sidebar-accent border-l-blue-500"
                    : "border-l-transparent hover:bg-sidebar-accent/50"
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
        <div className="p-3 border-t border-sidebar-border bg-sidebar/50">
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="w-full text-xs"
          >
            Mark all as read
          </Button>
        </div>
      )}
    </div>
  );
}
