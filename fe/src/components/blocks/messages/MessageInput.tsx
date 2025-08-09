
import { Send, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { useCommandAutocomplete } from "@/hooks/useCommandAutocomplete";
import { CommandSuggestions } from "./CommandSuggestions";
import { executeCommand } from "@/features/command/command-registry";
import { CommandContext } from "@/features/command/commands.type";

interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}

interface MessageInputProps {
    newMessage: string | any;
    setNewMessage: (value: string) => void;
    sendMessage: () => void;
    selectedChannel: Channel;
    createChannel: (name: string, type: 'public' | 'private', memberIds?: string[]) => void;
    userId: string;
    toast: (options: { title: string; description: string }) => void;
}

export const MessageInput = ({
    newMessage,
    setNewMessage,
    sendMessage,
    selectedChannel,
    createChannel,
    userId,
    toast,
}: MessageInputProps) => {
    const [isComposing, setIsComposing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        suggestions,
        selectedIndex,
        resetSelection,
        navigateUp,
        navigateDown,
        getSelectedSuggestion,
        hasSuggestions
    } = useCommandAutocomplete(newMessage);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        // Handle composition events (for international keyboards)
        if (isComposing) return;

        if (hasSuggestions) {
            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    navigateUp();
                    return;

                case 'ArrowDown':
                    e.preventDefault();
                    navigateDown();
                    return;

                case 'Tab':
                case 'Enter':
                    e.preventDefault();
                    const selected = getSelectedSuggestion();
                    if (selected) {
                        handleSuggestionSelect(selected);
                    }
                    return;

                case 'Escape':
                    e.preventDefault();
                    resetSelection();
                    return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await handleSendMessage();
        }
    };

    const handleSuggestionSelect = (suggestion: any) => {
        if (suggestion.type === 'command') {
            setNewMessage(suggestion.name + ' ');
        } else {
            // For option suggestions, append to current input
            const parts = newMessage.split(' ');
            parts[parts.length - 1] = suggestion.name;
            setNewMessage(parts.join(' ') + ' ');
        }

        resetSelection();
        inputRef.current?.focus();
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        // Check if it's a command
        if (newMessage.startsWith('/')) {
            const context: CommandContext = {
                channelId: selectedChannel.id,
                userId,
                sendMessage: (content: string) => {
                    // You'll need to modify your parent component to accept this
                    // For now, we'll use the regular sendMessage with the content
                    setNewMessage(content);
                    sendMessage();
                    setNewMessage('');
                },
                createChannel,
                toast
            };

            const wasCommand = await executeCommand(newMessage, context);
            if (wasCommand) {
                setNewMessage('');
                return;
            }
        }

        // Regular message
        sendMessage();
    };

    // Reset selection when input changes and it's not a command
    useEffect(() => {
        if (!newMessage.startsWith('/')) {
            resetSelection();
        }
    }, [newMessage, resetSelection]);

    return (
        <div className="p-4 border-t border-border relative">
            {hasSuggestions && (
                <CommandSuggestions
                    suggestions={suggestions}
                    selectedIndex={selectedIndex}
                    onSelect={handleSuggestionSelect}
                />
            )}

            <div className="flex space-x-2">
                <div className="flex-1 relative">
                    <Input
                        ref={inputRef}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={() => setIsComposing(false)}
                        placeholder={`Nhắn tin đến #${selectedChannel.name}...`}
                        className="pr-10 bg-[hsl(var(--chat-input))] border-border text-white"
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <Button onClick={handleSendMessage} size="sm" className="flex-shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
                Sử dụng <kbd className="px-1 py-0.5 text-xs bg-muted rounded">```</kbd> để chia sẻ code,{' '}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">/</kbd> để sử dụng lệnh
            </p>
        </div>
    );
};