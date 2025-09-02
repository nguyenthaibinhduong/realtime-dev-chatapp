// chatSocketService.ts
import { getSocket } from "@/api/Socket";

type Message = {
  channelId: string;
  senderId?: string;
  text: string;
};

type PresenceUpdate = {
  online: string[];
  offline: { userId: string; lastSeen: number }[];
};

class ChatSocketService {
  connect() {
    getSocket().connect();
  }

  disconnect() {
    getSocket().disconnect();
  }

  /** ================== CHANNEL ================== */

  joinRoom(channelId: string) {
    getSocket().emit("join_channel", { channelId });
  }

  leaveRoom(channelId: string) {
    getSocket().emit("leave_channel", { channelId });
  }

  switchRoom(oldChannelId: string, newChannelId: string) {
    getSocket().emit("switch_channel", { oldChannelId, newChannelId });
  }

  /** ================== MESSAGE ================== */

  sendMessage(channelId: string, text: string) {
    getSocket().emit("send_message", { channelId, text });
  }

  onMessage(callback: (msg: Message) => void) {
    getSocket().on("receiveMessage", callback);
  }

  offMessage(callback?: (msg: Message) => void) {
    getSocket().off("receiveMessage", callback);
  }

  /** ================== UNREAD ================== */

  onUnread(callback: (data: { channelId: string; count: number }) => void) {
    getSocket().on("unreadCount", callback);
  }

  offUnread(callback?: (data: { channelId: string; count: number }) => void) {
    getSocket().off("unreadCount", callback);
  }

  /** ================== PRESENCE ================== */

  onPresenceUpdate(callback: (data: PresenceUpdate) => void) {
    getSocket().on("presenceUpdate", callback);
  }

  offPresenceUpdate(callback?: (data: PresenceUpdate) => void) {
    getSocket().off("presenceUpdate", callback);
  }
}

export const chatSocketService = new ChatSocketService();
