export interface Notification {
  id: string;
  type: "message" | "github" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO date string
  relatedChannelId?: string; // Optional, for group notifications
  relatedUserId?: string; // Optional, for personal notifications
  data?: Record<string, any>; // Additional data related to the notification

  read?: boolean;
}

export type NotificationFilter =
  | "all"
  | "mentions"
  | "threads"
  | "reactions"
  | "invitations";
