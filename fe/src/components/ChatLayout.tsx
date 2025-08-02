import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadChannels();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      loadMessages(selectedChannel.id);
      subscribeToMessages(selectedChannel.id);
    }
  }, [selectedChannel]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    setUser(session.user);
  };

  const loadChannels = async () => {
    // For now, create some default channels
    const defaultChannels = [
      { id: '1', name: 'general', description: 'Thảo luận chung', type: 'text', member_count: 12 },
      { id: '2', name: 'frontend', description: 'Frontend development', type: 'text', member_count: 8 },
      { id: '3', name: 'backend', description: 'Backend development', type: 'text', member_count: 6 },
      { id: '4', name: 'bug-reports', description: 'Báo cáo lỗi', type: 'text', member_count: 15 }
    ];
    setChannels(defaultChannels);
    if (defaultChannels.length > 0) {
      setSelectedChannel(defaultChannels[0]);
    }
  };

  const loadMessages = async (channelId: string) => {
    // Mock messages for demo
    const mockMessages = [
      {
        id: '1',
        content: 'Chào mọi người! 👋',
        user_id: 'user1',
        created_at: new Date().toISOString(),
        username: 'alice'
      },
      {
        id: '2',
        content: 'Có ai đang làm việc với React Query không?',
        user_id: 'user2',
        created_at: new Date().toISOString(),
        username: 'bob'
      },
      {
        id: '3',
        content: '```typescript\nconst useData = () => {\n  return useQuery({\n    queryKey: [\"data\"],\n    queryFn: fetchData\n  });\n};\n```',
        user_id: null,
        created_at: new Date().toISOString(),
        username: 'charlie'
      }
    ];
    setMessages(mockMessages);
  };

  const subscribeToMessages = (channelId: string) => {
    // Real-time subscription will be implemented when types are ready
    console.log('Subscribing to channel:', channelId);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || !user) return;

    const message = {
      id: Date.now().toString(),
      content: newMessage,
      user_id: user.id,
      created_at: new Date().toISOString(),
      username: user.email?.split('@')[0] || 'user'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) return;

    const newChannel = {
      id: Date.now().toString(),
      name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
      description: `Channel ${newChannelName}`,
      type: 'text',
      member_count: 1
    };

    setChannels(prev => [...prev, newChannel]);
    setNewChannelName('');
    setShowCreateChannel(false);
    setSelectedChannel(newChannel);

    toast({
      title: "Tạo kênh thành công",
      description: `Kênh #${newChannel.name} đã được tạo!`,
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const renderMessageContent = (content: string) => {
    if (content.includes('```')) {
      const parts = content.split('```');
      return (
        <div>
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              return (
                <pre key={index} className="code-block my-2">
                  <code>{part}</code>
                </pre>
              );
            }
            return <span key={index}>{part}</span>;
          })}
        </div>
      );
    }
    return <span>{content}</span>;
  };

  return (
    <div className="h-screen flex bg-[hsl(var(--chat-background))]">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateChannel(!showCreateChannel)}
                className="h-6 w-6 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:text-black"
              >
                <Plus className="h-4 w-4 " />
              </Button>
            </div>

            {showCreateChannel && (
              <div className="mb-2 space-y-2">
                <Input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="tên-kênh-mới"

                  className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground z-10 w-[98%] mx-auto"
                  onKeyPress={(e) => e.key === 'Enter' && createChannel()}
                />
                <div className="flex justify-end gap-2 py-2">
                  <Button size="sm" onClick={createChannel}>
                    Tạo
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:text-gray-800"
                    onClick={() => setShowCreateChannel(false)}
                  >
                    Hủy
                  </Button>
                </div>
              </div>
            )}

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
              <h3 className="text-lg font-medium text-foreground mb-2">
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