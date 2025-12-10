import { useEffect } from "react";
import { chatSocketService } from "@/services/chatSocketService";

type UseChannelUpdateOpts = {
  channelId?: string; // nếu truyền, chỉ nhận sự kiện của kênh đó
  enabled?: boolean;  // tắt/bật listener
  onUpdate: (msg: any) => void; // callback khi có update
};

export function useChannelUpdate({
  channelId,
  enabled = true,
  onUpdate,
}: UseChannelUpdateOpts) {
  useEffect(() => {
    if (!enabled) return;

    const handler = (msg: any) => {
      if (channelId && msg?.channelId !== channelId) return;
      onUpdate?.(msg);
    };

    chatSocketService.onChannelUpdate(handler);
    return () => chatSocketService.offChannelUpdate(handler);
  }, [channelId, enabled, onUpdate]);
}