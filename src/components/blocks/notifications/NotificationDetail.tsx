import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Notification } from "@/types/notifications";
import { formatDistanceToNow, format } from "date-fns";
import {
  Bell,
  Hash,
  AtSign,
  ThumbsUp,
  Mail,
  MessageSquare,
  X,
  ExternalLink,
} from "lucide-react";

interface NotificationDetailProps {
  notification: Notification | null;
  onClose?: () => void;
  onMarkAsRead?: (id: string) => void;
}

export default function NotificationDetail({
  notification,
  onClose,
  onMarkAsRead,
}: NotificationDetailProps) {
  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6">
          <Bell className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          Select a notification
        </h2>
        <p className="text-muted-foreground max-w-md leading-relaxed">
          Choose a notification from the sidebar to view its details here.
        </p>
      </div>
    );
  }

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "mention":
        return <AtSign className="w-5 h-5 text-blue-500" />;
      case "thread":
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case "reaction":
        return <ThumbsUp className="w-5 h-5 text-yellow-500" />;
      case "invitation":
        return <Mail className="w-5 h-5 text-purple-500" />;
      default:
        return <Hash className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeBadge = () => {
    const variants = {
      mention: "default",
      thread: "secondary",
      reaction: "outline",
      invitation: "destructive",
      message: "default",
    } as const;

    return (
      <Badge
        variant={variants[notification.type] || "default"}
        className="capitalize"
      >
        {notification.type}
      </Badge>
    );
  };

  const handleMarkAsRead = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {getNotificationIcon()}
          <h1 className="text-lg font-semibold text-foreground">
            Notification Details
          </h1>
          {getNotificationTypeBadge()}
        </div>
        <div className="flex items-center gap-2">
          {!notification.isRead && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAsRead}
              className="text-sm"
            >
              Mark as read
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Card className="max-w-2xl mx-auto border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-4">
              <Avatar className="w-12 h-12 border border-border">
                <AvatarImage src={notification.avatar} />
                <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                  {notification.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">
                    {notification.username}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    in #{notification.channel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{format(notification.timestamp, "PPP")}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(notification.timestamp, {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              {!notification.isRead && (
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
              )}
            </div>
          </CardHeader>

          <Separator className="bg-border/50" />

          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3 text-foreground">
                  Notification Title
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {notification.title}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-3 text-foreground">Message</h4>
                <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
                  <p className="text-foreground leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>

              {notification.type === "mention" && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-blue-600">
                    Mention Context
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    You were mentioned in the #{notification.channel} channel.
                    Click to view the full conversation.
                  </p>
                </div>
              )}

              {notification.type === "reaction" && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-yellow-600">
                    Reaction Details
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {notification.username} reacted to your message with 👍
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Button variant="default" className="flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            View in Channel
          </Button>
          <Button variant="outline">Reply</Button>
          <Button variant="ghost">Dismiss</Button>
        </div>
      </div>
    </div>
  );
}
