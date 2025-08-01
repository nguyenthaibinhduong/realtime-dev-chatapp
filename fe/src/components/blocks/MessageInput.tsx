import { Send } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}
interface MessageInputProps {
    newMessage: string;
    setNewMessage: (value: string) => void;
    sendMessage: () => void;
    selectedChannel: Channel;
}

export const MessageInput = ({
    newMessage,
    setNewMessage,
    sendMessage,
    selectedChannel,
}: MessageInputProps) => {
    return (
        <div className="p-4 border-t border-border">
            <div className="flex space-x-2">
                <div className="flex-1 relative">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Nhắn tin đến #${selectedChannel.name}...`}
                        className="pr-10 bg-[hsl(var(--chat-input))] border-border text-white"
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                </div>
                <Button onClick={sendMessage} size="sm" className="flex-shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Sử dụng <kbd className="px-1 py-0.5 text-xs bg-muted rounded">```</kbd> để chia sẻ code,{' '}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">/create</kbd> để tạo kênh mới
            </p>
        </div>
    );
};
