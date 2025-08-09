import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SidebarLayout from './SidebarLayout';
import { ChannelHeader } from './blocks/channels/ChannelHeader';
import { MessageList } from './blocks/messages/MessageList';
import { MessageInput } from './blocks/messages/MessageInput';
import { useAuth } from '@/hooks/useAuth';
import MenubarLayout from './MenubarLayout';
import MasterLayout from './MasterLayout';
import { ChannelSearch } from './blocks/channels/ChannelSearch';
import { ChannelSection } from './blocks/channels/ChannelSection';
import { ChannelDialog } from './blocks/channels/ChannelDialog';


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
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<any>('');
  const [newChannelName, setNewChannelName] = useState('');
  const [channelType, setChannelType] = useState<'public' | 'private'>('public');
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);
  const [showChannelTypeMenu, setShowChannelTypeMenu] = useState(false);
  const [privateChannelName, setPrivateChannelName] = useState('');
  const [privateMemberIds, setPrivateMemberIds] = useState<string>('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [searchChannel, setSearchChannel] = useState('');
  const [publicChannels, setPublicChannels] = useState<Channel[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth()

  // ==================================LOGIC CHO TRANG TIN NHẮN CHAT========================================

  // Tìm kiếm kênh public theo từ khóa
  // Sử dụng ilike để tìm kiếm không phân biệt chữ hoa chữ thường 
  const searchPublicChannels = async (keyword: string) => {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('is_private', false)
      .ilike('name', `%${keyword}%`);
    if (!error && data) setPublicChannels(data);
  };


  // Tham gia kênh
  // Thêm user vào kênh nếu chưa là thành viên
  // Nếu đã là thành viên thì chỉ cần chọn kênh đó
  // Cập nhật kênh đã chọn
  const joinChannel = async (channel: Channel) => {
    await supabase
      .from('channel_members')
      .insert([{ channel_id: channel.id, user_id: user.id }]);
    await loadChannels();
    setSelectedChannel(channel);
    setSearchChannel('');
    setPublicChannels([]);
    toast({
      title: "Tham gia kênh thành công",
      description: `Bạn đã tham gia kênh #${channel.name}`,
    });
  };

  // Lấy danh sách kênh từ Supabase
  // Kết hợp các kênh do user tạo và các kênh mà user là thành viên
  // Loại bỏ kênh trùng lặp 
  const loadChannels = async () => {
    // Lấy các kênh do user tạo
    const { data: createdChannels, error: createdError } = await supabase
      .from('channels')
      .select('*')
      .eq('created_by', user?.id);

    // Lấy các kênh user là thành viên
    const { data: memberChannels, error: memberError } = await supabase
      .from('channel_members')
      .select('channel_id, channels(*)')
      .eq('user_id', user?.id);

    // Gộp danh sách kênh
    let channels: Channel[] = [];
    if (createdChannels) channels = [...channels, ...createdChannels];
    if (memberChannels) {
      const memberChannelList = memberChannels
        .map((item: any) => item.channels)
        .filter((ch: any) => ch); // loại bỏ null
      channels = [...channels, ...memberChannelList];
    }

    // Loại bỏ kênh trùng lặp theo id
    const uniqueChannels = channels.filter(
      (ch, idx, arr) => arr.findIndex(c => c.id === ch.id) === idx
    );

    setChannels(uniqueChannels);
    if (uniqueChannels.length > 0) {
      setSelectedChannel(uniqueChannels[0]);
    }
  };
  // Tự động cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Tải danh sách tin nhắn khi chọn kênh
  // Lấy tin nhắn từ Supabase theo kênh đã chọn
  const loadMessages = async (channelId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, created_at, user_id')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Map lại dữ liệu để lấy username và email từ users
      const messagesWithUser = data.map((msg: any) => ({
        ...msg,
        username: msg.users?.username,
        email: msg.users?.email,
      }));
      setMessages(messagesWithUser);
    }
  };

  // Đăng ký lắng nghe sự kiện tin nhắn mới

  const subscribeToMessages = (channelId: string) => {
    // Dọn dẹp subscription cũ nếu có
    // Để tránh lặp lại khi chọn kênh khác
    if ((window as any).messageSubscription) {
      (window as any).messageSubscription.unsubscribe();
    }
    const subscription = supabase
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          setMessages((prev: any) => [...prev, payload.new]);
          scrollToBottom();
        }
      )
      .subscribe();
    // Lưu subscription vào window để có thể dọn dẹp sau này
    (window as any).messageSubscription = subscription;
  };


  // Gửi tin nhắn mới
  // Kiểm tra xem có kênh đã chọn và người dùng đã đăng nhập hay chưa
  // Nếu có thì thêm tin nhắn vào Supabase

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;

    const message = {
      content: newMessage,
      message_type: 'text',
      user_id: user.id,
      channel_id: selectedChannel.id,
      created_at: new Date().toISOString(),
    };

    // Thêm tin nhắn vào Supabase
    const { error } = await supabase
      .from('messages')
      .insert([message]);

    if (error) {
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi tin nhắn!",
        variant: "destructive"
      });
      return;
    }

    setNewMessage('');
  };



  // Tạo kênh mới
  const createChannel = async (name: string, type: 'public' | 'private', memberIds?: string[]) => {
    if (!name.trim() || !user) return;

    const newChannel = {
      name: name.toLowerCase().replace(/\s+/g, '-'),
      description: `Channel ${name}`,
      type: 'text',
      is_private: type === 'private',
      created_by: user.id,
    };

    const { data, error } = await supabase
      .from('channels')
      .insert([newChannel])
      .select()
      .single();

    if (error) {
      toast({
        title: "Lỗi",
        description: error?.message || "Không thể tạo kênh mới!",
        variant: "destructive"
      });
      return;
    }


    const members = memberIds && memberIds.length > 0
      ? [...memberIds, user.id]
      : [user.id];

    await supabase
      .from('channel_members')
      .insert(members.map(id => ({ channel_id: data.id, user_id: id })));

    setNewChannelName('');
    setShowCreateChannel(false);
    setShowPrivateDialog(false);
    setPrivateChannelName('');
    setPrivateMemberIds('');
    await loadChannels();
    setSelectedChannel(data);

    toast({
      title: "Tạo kênh thành công",
      description: `Kênh #${data.name} đã được tạo!`,
    });
  };

  // Hiển thị menu tạo kênh
  const handleShowChannelTypeMenu = () => {
    setShowChannelTypeMenu(!showChannelTypeMenu);
  };

  // Mở popup tạo kênh public
  const handleCreatePublicChannel = () => {
    setChannelType('public');
    setShowChannelTypeMenu(false);
    setShowCreateChannel(true);
  };

  // Mở popup tạo kênh private
  const handleCreatePrivateChannel = () => {
    setChannelType('private');
    setShowChannelTypeMenu(false);
    setShowPrivateDialog(true);
  };

  // Tìm kiếm kênh khi người dùng nhập vào ô tìm kiếm
  useEffect(() => {
    if (searchChannel.trim()) {
      searchPublicChannels(searchChannel);
    } else {
      setPublicChannels([]);
    }
  }, [searchChannel]);



  // Tải danh sách kênh khi component mount
  // Lấy kênh đã tạo và kênh mà user là thành viên
  useEffect(() => {
    loadChannels()
  }, []);

  // Tự động cuộn xuống cuối danh sách tin nhắn khi có tin nhắn mới

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      subscribeToMessages(selectedChannel.id);
    }
  }, [selectedChannel]);
  // Dọn dẹp subscription khi component unmount
  useEffect(() => {
    return () => {
      if ((window as any).messageSubscription) {
        (window as any).messageSubscription.unsubscribe();
      }
    };
  }, [selectedChannel]);




  return (
    // Layout cấu hình menu  , sidebar và nội dung chính
    <MasterLayout
      menu={<MenubarLayout />}
      sidebar={
        <SidebarLayout>
          {/* Tìm kiếm kênh */}
          <ChannelSearch
            searchChannel={searchChannel}
            setSearchChannel={setSearchChannel}
            publicChannels={publicChannels}
            joinChannel={joinChannel}
          />

          {/* Dialog tạo kênh mới */}
          <ChannelDialog
            open={showCreateChannel}
            onOpenChange={setShowCreateChannel}
            type="public"
            channelName={newChannelName}
            setChannelName={setNewChannelName}
            onCreate={() => createChannel(newChannelName, "public")}
          />
          <ChannelDialog
            open={showPrivateDialog}
            onOpenChange={setShowPrivateDialog}
            type="private"
            channelName={privateChannelName}
            setChannelName={setPrivateChannelName}
            memberIds={privateMemberIds}
            setMemberIds={setPrivateMemberIds}
            onCreate={() => {
              const ids = privateMemberIds.split(',').map(id => id.trim()).filter(Boolean);
              createChannel(privateChannelName, "private", ids);
            }}
          />


          {/* Danh sách kênh */}
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
      {/* Nội dung chính của khung chat */}
      {selectedChannel ? (
        <>
          {/* Tên kênh trogn khung chat*/}
          <ChannelHeader selectedChannel={selectedChannel} />
          <MessageList messages={messages} />
          <MessageInput
            newMessage={newMessage}
            sendMessage={sendMessage}
            selectedChannel={selectedChannel}
            setNewMessage={setNewMessage}
            createChannel={createChannel}
            userId={user?.id}
            toast={toast}
          />
        </>
      ) : (
        // Hiển thị thông báo nếu chưa chọn kênh
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              Chọn một kênh để bắt đầu trò chuyện
            </h3>
            <p className="text-muted-foreground">
              Chọn kênh từ sidebar hoặc tạo kênh mới
            </p>
          </div>
        </div>
      )}
    </MasterLayout>
  );
}


