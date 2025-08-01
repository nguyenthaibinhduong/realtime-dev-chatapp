import { Hash } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}
interface ChannelListProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
}

export const ChannelList = ({ channels, selectedChannel, onSelectChannel }: ChannelListProps) => {
    return (
        <>
            {channels.map((channel) => (
                <Button
                    key={channel.id}
                    variant="ghost"
                    className={`w-full justify-start px-2 py-1.5 h-auto font-normal ${selectedChannel?.id === channel.id
                        ? 'bg-[hsl(var(--chat-selected))] text-white'
                        : 'text-sidebar-foreground hover:text-white hover:bg-[hsl(var(--chat-selected))]'
                        }`}
                    onClick={() => onSelectChannel(channel)}
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
        </>
    );
};
