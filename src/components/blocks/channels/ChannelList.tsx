import { Hash, User, Globe, Lock } from "lucide-react";
import { Button } from "../../ui/button";
// import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Channel } from "@/types/channel";
import { OnlineDot } from "../auth/OnlineDot";
import { useAuth } from "@/hooks/useAuth";

interface ChannelListProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
}



const getChannelIcon = (channel: Channel, userId?: any) => {
    if (channel.type === "group-private") return <Lock className="h-4 w-4 mr-2 text-red-500" />;
    if (channel.type === "group") return <Globe className="h-4 w-4 mr-2 text-blue-500" />;
    if (channel.type === "personal") {
        return (
            <div className="relative mr-2">
                <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {channel.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                </Avatar>
                {/* Chấm online */}
                {
                    userId && channel.members && (


                        <OnlineDot userId={userId} />

                    )
                }
            </div>
        );
    }
    return <Hash className="h-4 w-4 mr-2 text-muted-foreground" />;
};

const SECTION_LABELS: Record<string, string> = {
    group: "Kênh công khai",
    "group-private": "Kênh riêng tư",
    personal: "Chat cá nhân",
    other: "Khác"
};

export const ChannelList = ({ channels, selectedChannel, onSelectChannel }: ChannelListProps) => {
    // Phân loại kênh, chỉ lấy kênh có isActive !== false
    const grouped: Record<string, Channel[]> = {
        group: [],
        "group-private": [],
        personal: [],
        other: []
    };

    const { user } = useAuth();

    channels
        .filter((c: any) => c.isActive !== false) // Lọc kênh không active
        .forEach((c) => {
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
                        {list.map((channel) => {
                            // Nếu là kênh personal, lấy ra user trong members có id khác với user.id hiện tại
                            let otherUserId: string | number | undefined;
                            if (channel.type === "personal" && channel.members && user?.id) {
                                const otherMember = channel.members.find((m: any) => m.id !== user.id);
                                otherUserId = otherMember?.id;
                            }
                            return (
                                <Button
                                    key={channel.id}
                                    variant="ghost"
                                    className={`w-full justify-start px-2 py-1.5 h-auto font-normal ${selectedChannel?.id === channel.id
                                        ? 'bg-[hsl(var(--chat-selected))] text-white'
                                        : 'text-sidebar-foreground hover:text-white hover:bg-[hsl(var(--chat-selected))]'
                                        }`}
                                    onClick={() => onSelectChannel(channel)}
                                >
                                    {channel.type === "personal"
                                        ? getChannelIcon(channel, otherUserId)
                                        : getChannelIcon(channel)}
                                    <span className="truncate">{channel.name}</span>
                                </Button>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};
