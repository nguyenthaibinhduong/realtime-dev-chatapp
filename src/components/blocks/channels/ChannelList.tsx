import { Hash, User, Globe, Lock } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
    created_at?: string;
}

interface ChannelListProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
}

const getChannelIcon = (type: string) => {
    if (type === "group-private") return <Lock className="h-4 w-4 mr-2 text-red-500" />;
    if (type === "group") return <Globe className="h-4 w-4 mr-2 text-blue-500" />;
    if (type === "personal") return <User className="h-4 w-4 mr-2 text-green-500" />;
    return <Hash className="h-4 w-4 mr-2 text-muted-foreground" />;
};

const SECTION_LABELS: Record<string, string> = {
    group: "Kênh công khai",
    "group-private": "Kênh riêng tư",
    personal: "Chat cá nhân",
    other: "Khác"
};

export const ChannelList = ({ channels, selectedChannel, onSelectChannel }: ChannelListProps) => {
    // Phân loại kênh
    const grouped: Record<string, Channel[]> = {
        group: [],
        "group-private": [],
        personal: [],
        other: []
    };
    channels.forEach((c) => {
        if (grouped[c.type]) grouped[c.type].push(c);
        else grouped.other.push(c);
    });

    // Sắp xếp từng nhóm theo thời gian tạo mới nhất lên trên
    Object.keys(grouped).forEach(type => {
        grouped[type].sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
        });
    });

    return (
        <div>
            {Object.entries(grouped).map(([type, list]) =>
                list.length > 0 && (
                    <div key={type} className="mb-4">
                        <div className="text-xs font-semibold text-muted-foreground mb-2 pl-2">
                            {SECTION_LABELS[type] || SECTION_LABELS.other}
                        </div>
                        {list.map((channel) => (
                            <Button
                                key={channel.id}
                                variant="ghost"
                                className={`w-full justify-start px-2 py-1.5 h-auto font-normal ${selectedChannel?.id === channel.id
                                    ? 'bg-[hsl(var(--chat-selected))] text-white'
                                    : 'text-sidebar-foreground hover:text-white hover:bg-[hsl(var(--chat-selected))]'
                                    }`}
                                onClick={() => onSelectChannel(channel)}
                            >
                                {getChannelIcon(channel.type)}
                                <span className="truncate">{channel.name}</span>
                                {/* {channel.member_count && (
                                    <Badge variant="secondary" className="ml-auto text-xs">
                                        {channel.member_count}
                                    </Badge>
                                )} */}
                            </Button>
                        ))}
                    </div>
                )
            )}
        </div>
    );
};
