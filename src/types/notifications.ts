export interface Notification {
  id: string;
  type: "personal" | "group" | "system";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string; // ISO date string
  relatedChannelId?: string; // Optional, for group notifications
  relatedUserId?: string; // Optional, for personal notifications

  read?: boolean;
}

export type NotificationFilter =
  | "all"
  | "mentions"
  | "threads"
  | "reactions"
  | "invitations";
