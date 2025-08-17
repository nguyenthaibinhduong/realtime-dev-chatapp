import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
}: NotificationItemProps) {

  const { getNotificationById } = useNotifications();
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    const notificationDetails = getNotificationById(notification.id);

    console.log(notification.id);
  };

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "mention":
        return "@";
      case "thread":
        return "#";
      case "reaction":
        return "👍";
      case "invitation":
        return "📧";
      default:
        return "#";
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-sidebar-accent/50 cursor-pointer border-l-2 transition-colors",
        !notification.isRead
          ? "bg-blue-500/10 border-l-blue-500"
          : "border-l-transparent"
      )}
      onClick={handleClick}
    >
      <div className="relative flex-shrink-0">
        <Avatar className="w-8 h-8">
          <AvatarImage src={notification.avatar} />
          <AvatarFallback className="text-xs">
            {notification.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center border border-blue-500">
          {getNotificationIcon()}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 text-sm min-w-0">
          <span className="text-muted-foreground flex-shrink-0">
            {getNotificationIcon()}
          </span>
          <span className="text-white truncate flex-1 min-w-0">
            {notification.title}
          </span>
          <span className="text-xs text-muted-foreground flex-shrink-0 ml-auto">
            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center gap-2 mt-1 min-w-0">
          <span className="font-medium text-sm flex-shrink-0 text-blue-500">
            {notification.username}
          </span>
          <span className="text-yellow-500 text-sm flex-shrink-0">
            @{notification.username.split(" ")[0]}
          </span>
          <span className="text-white text-sm truncate min-w-0 flex-1">
            {notification.message}
          </span>
        </div>
      </div>

      {!notification.isRead && (
        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
      )}
    </div>
  );
}
