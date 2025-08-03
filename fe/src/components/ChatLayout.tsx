import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Hash,
  Plus,
  Search,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import SidebarLayout from './SidebarLayout';
import { ChannelHeader } from './blocks/ChannelHeader';
import { MessageList } from './blocks/MessageList';
import { MessageInput } from './blocks/MessageInput';
import { useAuth } from '@/hooks/useAuth';
import MenubarLayout from './MenubarLayout';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';


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
  const [newMessage, setNewMessage] = useState('');
  const [newChannelName, setNewChannelName] = useState('');
  const [channelType, setChannelType] = useState<'public' | 'private'>('public');
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);
  const [showChannelTypeMenu, setShowChannelTypeMenu] = useState(false);
  const [privateChannelName, setPrivateChannelName] = useState('');
  const [privateMemberIds, setPrivateMemberIds] = useState<string>('');
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const { user } = useAuth()


  useEffect(() => {
    loadChannels()
  }, []);


  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      subscribeToMessages(selectedChannel.id);
    }
  }, [selectedChannel]);



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
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  const loadMessages = async (channelId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });
    if (!error && data) setMessages(data);
  };

  // ...existing code...

  const subscribeToMessages = (channelId: string) => {
    // Unsubscribe previous subscription if needed
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
    (window as any).messageSubscription = subscription;
  };

  // Hủy đăng ký khi unmount hoặc đổi channel
  useEffect(() => {
    return () => {
      if ((window as any).messageSubscription) {
        (window as any).messageSubscription.unsubscribe();
      }
    };
  }, [selectedChannel]);

  // ...existing code...

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

    // Thêm user vào bảng channel_members
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

  const handleShowChannelTypeMenu = () => {
    setShowChannelTypeMenu(true);
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









  return (
    <div className="h-screen flex bg-[hsl(var(--chat-background))]">
      <MenubarLayout />
      {/* Sidebar */}
      <SidebarLayout>
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
            <Input
              placeholder="Tìm kiếm..."
              className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
            />
          </div>
        </div>

        {/* Channels */}
        <ScrollArea className="flex-1 px-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between py-2">
              <h3 className="text-sm font-medium text-sidebar-foreground/70 uppercase tracking-wide">
                Kênh chat
              </h3>
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowChannelTypeMenu}
                  className="h-6 w-6 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:text-black"
                >
                  <Plus className="h-4 w-4 " />
                </Button>
                {showChannelTypeMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white rounded shadow z-50 border border-gray-700">
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-800"
                      onClick={handleCreatePublicChannel}
                    >
                      Tạo kênh Public
                    </button>
                    <button
                      className="w-full px-4 py-2 text-left hover:bg-gray-800"
                      onClick={handleCreatePrivateChannel}
                    >
                      Tạo kênh Private
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Popup tạo kênh Public */}
            <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
              <DialogContent className="bg-gray-900 text-white border border-gray-700">
                <DialogHeader>
                  <DialogTitle>Tạo kênh Public</DialogTitle>
                </DialogHeader>
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="Tên kênh public"
                  className="mb-2 bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                />
                <DialogFooter>
                  <Button
                    size="sm"
                    onClick={() => createChannel(newChannelName, 'public')}
                  >
                    Tạo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCreateChannel(false)}
                  >
                    Hủy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Popup tạo kênh Private */}
            <Dialog open={showPrivateDialog} onOpenChange={setShowPrivateDialog}>
              <DialogContent className="bg-gray-900 text-white border border-gray-700">
                <DialogHeader>
                  <DialogTitle>Tạo kênh Private</DialogTitle>
                </DialogHeader>
                <Input
                  value={privateChannelName}
                  onChange={(e) => setPrivateChannelName(e.target.value)}
                  placeholder="Tên kênh private"
                  className="mb-2 bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                />
                <Input
                  value={privateMemberIds}
                  onChange={(e) => setPrivateMemberIds(e.target.value)}
                  placeholder="Nhập các user_id, phân cách bằng dấu phẩy"
                  className="mb-2 bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                />
                <DialogFooter>
                  <Button
                    size="sm"
                    onClick={() => {
                      const ids = privateMemberIds.split(',').map(id => id.trim()).filter(Boolean);
                      createChannel(privateChannelName, 'private', ids);
                    }}
                  >
                    OK
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPrivateDialog(false)}
                  >
                    Hủy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant="ghost"
                className={`w-full justify-start px-2 py-1.5 h-auto font-normal ${selectedChannel?.id === channel.id
                  ? 'bg-[hsl(var(--chat-selected))] text-white'
                  : 'text-sidebar-foreground hover:text-white hover:bg-[hsl(var(--chat-selected))]'
                  }`}
                onClick={() => setSelectedChannel(channel)}
              >
                <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{channel.name}</span>
                {channel.member_count && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {channel.member_count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </SidebarLayout>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <ChannelHeader selectedChannel={selectedChannel} />

            {/* Messages */}
            <MessageList messages={messages} />
            {/* Message Input */}
            <MessageInput newMessage={newMessage} sendMessage={sendMessage} selectedChannel={selectedChannel} setNewMessage={setNewMessage} />
          </>
        ) : (
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
      </div>
    </div>
  );
}