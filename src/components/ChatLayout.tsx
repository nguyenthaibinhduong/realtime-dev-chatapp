import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare } from "lucide-react";
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

interface Channel {
  id: string;
  name: string;
  description?: string;
  type: string;
  member_count?: number;
}

interface Message {
  id: number;
  text: string;
  created_at: string;
  updated_at: string;
  sender: {
    id: number;
    username: string;
    email: string;
  };
  isMine: boolean;
}

interface Member {
  id: number;
  username: string;
  email: string;
  isMine?: boolean;
}

export default function ChatLayout() {
  const { toast } = useToast();
  const { user } = useAuth();

  // State cho danh sách kênh, kênh đang chọn, tin nhắn và thành viên
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  // Các state cho menu và dialog (giữ nguyên logic cũ nếu có)
  const [showChannelTypeMenu, setShowChannelTypeMenu] = useState(false);

  // Hàm xử lý menu và tạo kênh (placeholder)
  const handleShowChannelTypeMenu = () => setShowChannelTypeMenu((v) => !v);
  const handleCreatePublicChannel = () => { };
  const handleCreatePrivateChannel = () => { };

  // Load danh sách kênh chat khi mount
  useEffect(() => {
    const loadChannels = async () => {
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
        const foundChannel = loadedChannels.find(c => String(c.id) === savedChannelId);
        setSelectedChannel(foundChannel || loadedChannels[0] || null);
      } catch (error: any) {
        toast({
          title: "Lỗi tải kênh",
          description:
            error?.msg || error?.message || "Không thể tải danh sách kênh",
          variant: "destructive",
        });
      }
    };
    loadChannels();
  }, [toast]);

  // Khi đổi kênh, lưu lại vào localStorage
  const handleSelectChannel = (channel: Channel | null) => {
    setSelectedChannel(channel);
    if (channel) {
      localStorage.setItem("selectedChannelId", channel.id);
    } else {
      localStorage.removeItem("selectedChannelId");
    }
  };

  // useCallback để load message và member theo selectedChannel
  const loadMessages = useCallback(async (channelId: string) => {
    try {
      const res = await ChatAPI.fetchMessage(channelId);
      // Đúng cấu trúc: lấy từ res.data.items và res.data.members
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
  }, [toast]);

  // useEffect gọi loadMessages khi selectedChannel thay đổi
  useEffect(() => {
    if (selectedChannel?.id) {
      loadMessages(selectedChannel.id);
    } else {
      setMessages([]);
      setMembers([]);
    }
  }, [selectedChannel, loadMessages]);
  const handleSelectChannelFromSearch = (channel: any) => { };

  // Handle joining channel from search
  const handleJoinChannelFromSearch = async (channel: any) => { };

  return (
    <MasterLayout
      menu={<MenubarLayout />}
      sidebar={
        <SidebarLayout>
          <ScrollArea className="px-3 pt-2">
            <ChannelSearch
              onSelectChannel={handleSelectChannelFromSearch}
              onJoinChannel={handleJoinChannelFromSearch}
            />
          </ScrollArea>
          <ScrollArea className="flex-1 px-3">
            <ChannelSection
              channels={channels}
              selectedChannel={selectedChannel}
              onSelectChannel={handleSelectChannel}
              onShowChannelTypeMenu={handleShowChannelTypeMenu}
              showChannelTypeMenu={showChannelTypeMenu}
              onCreatePublic={handleCreatePublicChannel}
              onCreatePrivate={handleCreatePrivateChannel}
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
          <MessageInput channelId={selectedChannel.id} />
        )}
      </div>
    </MasterLayout>
  );
}
