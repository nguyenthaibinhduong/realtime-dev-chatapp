import { useState, useEffect, useRef } from "react";
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
  id: string;
  content: string;
  type: string;
  user_id: string;
  created_at: string;
  username?: string;
}

export default function ChatLayout() {
  const { toast } = useToast();
  const { user } = useAuth();

  // State cho danh sách kênh và kênh đang chọn
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  // Các state cho menu và dialog (giữ nguyên logic cũ nếu có)
  const [showChannelTypeMenu, setShowChannelTypeMenu] = useState(false);

  // Hàm xử lý menu và tạo kênh (placeholder)
  const handleShowChannelTypeMenu = () => setShowChannelTypeMenu((v) => !v);
  const handleCreatePublicChannel = () => {};
  const handleCreatePrivateChannel = () => {};

  // Load danh sách kênh chat khi mount
  useEffect(() => {
    const loadChannels = async () => {
      try {
        const res = await ChatAPI.fetchChannel();
        if (Array.isArray(res)) {
          setChannels(res);
          setSelectedChannel(res[0] || null);
        } else if (res.data && Array.isArray(res.data)) {
          setChannels(res.data);
          setSelectedChannel(res.data[0] || null);
        }
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

  // Handle channel selection from search
  const handleSelectChannelFromSearch = (channel: any) => {};

  // Handle joining channel from search
  const handleJoinChannelFromSearch = async (channel: any) => {};
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
              onSelectChannel={setSelectedChannel}
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            Chat Coming Soon
          </h3>
          <p className="text-muted-foreground">
            Chat functionality will be implemented with the new backend API
          </p>
        </div>
      </div>
    </MasterLayout>
  );
}
