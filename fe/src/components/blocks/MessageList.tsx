import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";

interface Message {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    username?: string;
}
interface MessageListProps {
    messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
    return (
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {messages.map((message) => (
                    <div key={message.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                {message.username?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline space-x-2">
                                <p className="text-sm font-medium text-white">
                                    {message.username || 'User'}
                                </p>
                                <p className="text-xs text-muted-white">
                                    {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                            <div className="text-sm text-white mt-1 message-content">
                                {message.content.includes('```') ? (
                                    <pre className="code-block my-2">
                                        <code>{message.content.split('```')[1]}</code>
                                    </pre>
                                ) : (
                                    message.content
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};
