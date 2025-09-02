import { useCallback, useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Search } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import SidebarLayout from "./SidebarLayout";
import { ChannelHeader } from "./blocks/channels/ChannelHeader";
import { MessageList } from "./blocks/messages/MessageList";
import { MessageInput } from "./blocks/messages/MessageInput";
import { useAuth } from "@/hooks/useAuth";
import MenubarLayout from "./MenubarLayout";
import MasterLayout from "./MasterLayout";
import { ChannelSearch } from "./blocks/channels/ChannelSearch";
import { ChannelSection } from "./blocks/channels/ChannelSection";
import { ChannelDialog } from "./blocks/channels/ChannelDialog";
import { ChatAPI } from "@/api/api";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Message } from "@/types/message";
import { Channel, Member } from "@/types/channel";
import { chatSocketService } from "@/services/chatSocketService";

export default function ChatLayout() {
  const { toast } = useToast();
  const { user } = useAuth();

  // State cho danh sách kênh, kênh đang chọn, tin nhắn và thành viên
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showChannelTypeMenu, setShowChannelTypeMenu] = useState(false);

  // State cho modal tìm kiếm kênh
  const [openSearchModal, setOpenSearchModal] = useState(false);

  const handleShowChannelTypeMenu = () => setShowChannelTypeMenu((v) => !v);
  // Sử dụng useCallback cho loadChannels
  const loadChannels = useCallback(async () => {
    try {
      const res = await ChatAPI.fetchChannel();
      let loadedChannels: Channel[] = [];
      if (Array.isArray(res)) {
        loadedChannels = res;
      } else if (res.data && Array.isArray(res.data)) {
        loadedChannels = res.data;
      }
      setChannels(loadedChannels);

      // Lấy kênh đã chọn từ localStorage nếu có, nếu không thì lấy kênh đầu tiên
      const savedChannelId = localStorage.getItem("selectedChannelId");
      const foundChannel = loadedChannels.find(
        (c) => String(c.id) === savedChannelId
      );
      setSelectedChannel(foundChannel || loadedChannels[0] || null);
    } catch (error: any) {
      toast({
        title: "Lỗi tải kênh",
        description:
          error?.msg || error?.message || "Không thể tải danh sách kênh",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  // useCallback cho việc kết nối và tham gia kênh chat qua socket
  const joinChannelSocket = useCallback(() => {
    if (selectedChannel?.id) {
      chatSocketService.joinRoom(selectedChannel.id);
      chatSocketService.onMessage((msg) => {
        console.log("Socket message received:", msg); // Log object msg ra console
        setMessages((prev: any) => [...prev, msg]);
      });
    }
    return () => {
      chatSocketService.leaveRoom(selectedChannel?.id);
      chatSocketService.offMessage();
      // chatSocketService.disconnect();
    };
  }, [selectedChannel]);

  useEffect(() => {
    // Gọi lại mỗi khi selectedChannel?.id thay đổi
    const cleanup = joinChannelSocket();
    return cleanup;
  }, [joinChannelSocket]);

  const handleSelectChannel = (channel: Channel | null) => {
    setSelectedChannel(channel);
    if (channel) {
      localStorage.setItem("selectedChannelId", channel.id);
    } else {
      localStorage.removeItem("selectedChannelId");
    }
  };

  const loadMessages = useCallback(
    async (channelId: string) => {
      try {
        const res = await ChatAPI.fetchMessage(channelId);
        if (res && res.data) {
          setMessages(Array.isArray(res.data.items) ? res.data.items : []);
          setMembers(Array.isArray(res.data.members) ? res.data.members : []);
        } else {
          setMessages([]);
          setMembers([]);
        }
      } catch (error: any) {
        toast({
          title: "Lỗi tải tin nhắn",
          description: error?.msg || error?.message || "Không thể tải tin nhắn",
          variant: "destructive",
        });
        setMessages([]);
        setMembers([]);
      }
    },
    [selectedChannel]
  );

  useEffect(() => {
    if (selectedChannel?.id) {
      loadMessages(selectedChannel.id);
    } else {
      setMessages([]);
      setMembers([]);
    }
  }, [selectedChannel, loadMessages]);

  const handleSelectChannelFromSearch = (channel: any) => {
    handleSelectChannel(channel);
    setOpenSearchModal(false);
  };

  const handleJoinChannelFromSearch = async (id: string, type: string) => {
    try {
      const res = await ChatAPI.joinChannel({ id, type });

      if (res && res.status && [200, 201].includes(res.status) && res.data) {
        // Đầu tiên set vào localStorage
        localStorage.setItem("selectedChannelId", res.data.channelId);

        // Sau đó mới gọi loadChannels để cập nhật lại danh sách và kênh đang chọn
        await loadChannels();

        setOpenSearchModal(false);
        toast({
          title: "Tham gia kênh thành công",
          description: `${res.data.msg}`,
        });
      } else {
        toast({
          title: "Lỗi tham gia kênh",
          description: res?.data?.msg || "Không thể tham gia kênh",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi tham gia kênh",
        description: error?.msg || error?.message || "Không thể tham gia kênh",
        variant: "destructive",
      });
    }
  };

  // Hàm gửi tin nhắn qua socket
  const sendMessage = useCallback(
    (content: string) => {
      if (!selectedChannel?.id || !content.trim()) return;
      chatSocketService.sendMessage(selectedChannel.id, content.trim());
    },
    [selectedChannel]
  );

  return (
    <MasterLayout
      menu={<MenubarLayout />}
      sidebar={
        <SidebarLayout>
          <div className="flex items-center justify-between px-3 pt-2">
            <Dialog open={openSearchModal} onOpenChange={setOpenSearchModal}>
              <DialogTrigger asChild>
                <div
                  className="flex items-center w-full bg-[#222] rounded px-3 py-2 cursor-pointer hover:bg-[#333] transition"
                  title="Tìm kiếm kênh"
                  onClick={() => setOpenSearchModal(true)}
                  style={{ minHeight: 40 }}
                >
                  <Search className="h-5 w-5 text-white mr-2" />
                  <span className="text-white opacity-80 text-sm">
                    Tìm kiếm ...
                  </span>
                </div>
              </DialogTrigger>
              <DialogContent
                className="w-full max-w-2xl bg-[#18181b] text-white border-none"
                style={{
                  background: "#18181b",
                  color: "#fff",
                  height: "85vh",
                  minHeight: "85vh",
                  maxHeight: "85vh",
                }}
              >
                <DialogHeader>
                  <DialogTitle className="text-white">
                    Tìm kiếm kênh , người dùng
                  </DialogTitle>
                </DialogHeader>
                <div className="px-3 pt-2 h-[70vh]">
                  <ChannelSearch
                    onSelectChannel={handleSelectChannelFromSearch}
                    onJoinChannel={handleJoinChannelFromSearch}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1 px-3">
            <ChannelSection
              channels={channels}
              selectedChannel={selectedChannel}
              onSelectChannel={handleSelectChannel}
              onShowChannelTypeMenu={handleShowChannelTypeMenu}
              showChannelTypeMenu={showChannelTypeMenu}
              onChannelCreated={loadChannels}
            />
          </ScrollArea>
        </SidebarLayout>
      }
    >
      {/* Main Chat Content */}
      <div className="flex-1 flex flex-col">
        {selectedChannel && (
          <ChannelHeader channel={selectedChannel} members={members} />
        )}
        <div className="flex-1 flex items-center justify-center">
          {messages.length === 0 ? (
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Chat Coming Soon
              </h3>
              <p className="text-muted-foreground">
                Chat functionality will be implemented with the new backend API
              </p>
            </div>
          ) : (
            <MessageList messages={messages} />
          )}
        </div>
        {selectedChannel && (
          <MessageInput channelId={selectedChannel.id} onSend={sendMessage} />
        )}
      </div>
    </MasterLayout>
  );
}
