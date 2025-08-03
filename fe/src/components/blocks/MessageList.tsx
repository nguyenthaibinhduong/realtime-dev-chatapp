import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { Message } from "./Message";

interface Message {
    id: string;
    content: string;
    type: string;
    user_id: string;
    created_at: string;
    username?: string;
}
interface MessageListProps {
    messages: Message[];
}

export const MessageList = ({ messages }: MessageListProps) => {
    const { user } = useAuth()


    return (
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                {messages.map((message) => {
                    const isMe = message.user_id === user?.id;

                    return (
                        <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} space-x-3`}
                        >
                            {!isMe && (
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                                        {message.username?.[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            <div
                                className={`min-w-0  rounded-2xl px-4 py-2 ${isMe
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-700 text-white rounded-bl-none'
                                    }  ${message?.type == 'code' ? 'w-[80%] bg-transparent' : ''}`}
                            >
                                <div className="flex items-baseline justify-between mb-1">
                                    {!isMe && (
                                        <p className="text-sm font-medium">
                                            {message.username || 'Tôi'}
                                        </p>
                                    )}
                                    <p className="text-xs text-white/60 ml-2 whitespace-nowrap">
                                        {new Date(message.created_at).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>

                                <div className="text-sm whitespace-pre-wrap break-words">
                                    <Message content={message.content} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>

    );
};
