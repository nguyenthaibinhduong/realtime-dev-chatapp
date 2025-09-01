import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";

interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}

interface MessageInputProps {
    channelId: string;
    onSend?: (content: string) => void;
}

export const MessageInput = ({ channelId, onSend }: MessageInputProps) => {
    const [newMessage, setNewMessage] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;
        if (onSend) onSend(newMessage.trim());
        setNewMessage("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, [channelId]);

    return (
        <div className="p-4 border-t border-border relative">
            <div className="flex space-x-2">
                <div className="flex-1 relative">
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Nhắn tin đến #${channelId}...`}
                        className="pr-10 bg-[hsl(var(--chat-input))] border-border text-white"
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <Button onClick={handleSendMessage} size="sm" className="flex-shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Sử dụng <kbd className="px-1 py-0.5 text-xs bg-muted rounded">```</kbd> để chia sẻ code
            </p>
        </div>
    );
};