export interface Notification {
  id: string;
  type: "mention" | "thread" | "reaction" | "invitation" | "message";
  title: string;
  message: string;
  avatar?: string;
  username: string;
  channel: string;
  timestamp: Date;
  isRead: boolean;
  isUnread?: boolean;
}

export type NotificationFilter =
  | "all"
  | "mentions"
  | "threads"
  | "reactions"
  | "invitations";
