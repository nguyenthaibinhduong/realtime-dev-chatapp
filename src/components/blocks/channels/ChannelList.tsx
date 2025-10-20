import { Hash, User, Globe, Lock } from "lucide-react";
import { Button } from "../../ui/button";
// import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Channel } from "@/types/channel";
import { OnlineDot } from "../auth/OnlineDot";
import { useAuth } from "@/hooks/useAuth";
import AvatarUser from "@/components/common/AvartarUser";
import AvatarGroup, { AvatarGroupGrid } from "@/components/common/AvatarGroup";

interface ChannelListProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    unreadMap?: Record<string, number>; // thêm prop
}



const getChannelIcon = (channel: Channel, user?: any) => {
    if (channel.type === "group") return '#';
    if (channel.type === "group-private") {
        return <Lock className="h-4 w-4 mr-2 text-muted-foreground" />;
    }
    if (channel.type === "personal") {
        return (
            <div className="relative mr-2">
                <AvatarUser user={user} size={8} />
                {/* Chấm online */}
                {
                    user?.id && channel.members && (
                        <OnlineDot userId={user?.id} />

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

export const ChannelList = ({
    channels,
    selectedChannel,
    onSelectChannel,
    unreadMap = {},
}: ChannelListProps) => {
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
                            let otherUser: any;
                            if (channel.type === "personal" && channel.members && user?.id) {
                                const otherMember = channel.members.find((m: any) => m.id !== user.id);
                                otherUser = otherMember;
                            }
                            // Nếu là kênh đang chọn thì không hiển thị số unread
                            // const isSelected = selectedChannel?.id === channel.id;
                            const unread = unreadMap[channel.id] || 0;
                            return (
                                <Button
                                    key={channel.id}
                                    variant="ghost"
                                    className={`w-full justify-between px-2 py-2 my-1 h-auto font-normal flex items-center
                                        ${selectedChannel?.id === channel.id
                                            ? 'bg-gray-800 text-gray-100 border border-gray-700 shadow-sm'
                                            : unread > 0
                                                ? 'font-bold text-white'
                                                : 'text-sidebar-foreground hover:bg-gray-800 hover:text-gray-100  shadow-sm'
                                        }`}
                                    onClick={() => onSelectChannel(channel)}
                                >
                                    <div className="flex items-center gap-2">
                                        {channel.type === "personal"
                                            ? getChannelIcon(channel, otherUser)
                                            : getChannelIcon(channel)}
                                        <span className="truncate">{channel.name}</span>
                                    </div>
                                    {unread > 0 && (
                                        <span className="ml-2 text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
                                            {unread}
                                        </span>
                                    )}
                                </Button>
                            );
                        })}
                    </div>
                )
            )}
        </div>
    );
};
