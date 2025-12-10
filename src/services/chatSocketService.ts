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
  connect(token?: string, forceNew = false) {
    getSocket(token, forceNew).connect();
  }

  disconnect() {
    getSocket().disconnect();
  }

  /** ================== CHANNEL ================== */

  joinRoom(channelId: string) {
    console.log("Joining channel socket:", channelId);
    getSocket().emit("join_channel", { channelId });
  }

  leaveRoom(channelId: string) {
    console.log("Leaving channel socket:", channelId);
    getSocket().emit("leave_channel", { channelId });
  }

  registerUnread(channelIds: string[]) {
    getSocket().emit("register_unread_channels", { channelIds });
  }

  switchRoom(oldChannelId: string, newChannelId: string) {
    getSocket().emit("switch_channel", { oldChannelId, newChannelId });
  }

  updateChannelSent(data: any) {  
    getSocket().emit("update_channel", data);
  }

  /** ================== MESSAGE ================== */

  sendMessage(data: any) {
    getSocket().emit("send_message", data);
  }

  createChannel(data: any) {
    getSocket().emit("create_channel", data);
  }

  onMessage(callback: (msg: any) => void) {
    getSocket().on("receiveMessage", callback);
  }

  offMessage(callback?: (msg: any) => void) {
    getSocket().off("receiveMessage", callback);
  }

  onChannel(callback: (msg: any) => void) {
    getSocket().on("receiveChannel", callback);
  }

  offChannel(callback?: (msg: any) => void) {
    getSocket().off("receiveChannel", callback);
  }

  onChannelUpdate(callback: (msg: any) => void) {
    getSocket().on("receiveUpdateChannel", callback);
  }

  offChannelUpdate(callback?: (msg: any) => void) {
    
    getSocket().off("receiveUpdateChannel", callback);
  }

   onRemoveChannel(callback: (msg: any) => void) {
    getSocket().on("receiveRemoveChannel", callback);
  }

  offRemoveChannel(callback?: (msg: any) => void) {
    getSocket().off("receiveRemoveChannel", callback);
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

  onNotification(callback: (data: any) => void) {
    getSocket().on("receiveNotification", callback);
  }

  offNotification(callback?: (data: any) => void) {
    getSocket().off("receiveNotification", callback);
  }
}

export const chatSocketService = new ChatSocketService();
