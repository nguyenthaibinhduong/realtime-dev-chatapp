import { Hash, User, Globe, Lock, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { Button } from "../../ui/button";
// import { Badge } from "../../ui/badge";
import { Avatar, AvatarFallback } from "../../ui/avatar";
import { Channel } from "@/types/channel";
import { OnlineDot } from "../auth/OnlineDot";
import { useAuth } from "@/hooks/useAuth";
import AvatarUser from "@/components/common/AvartarUser";
import { useState, useEffect } from "react";

interface ChannelListProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    unreadMap?: Record<string, number>; // thêm prop
}

interface ProjectGroup {
    key: string;
    projectName: string;
    channels: Channel[];
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
    "group-private": "Kênh dự án",
    personal: "Chat cá nhân",
    other: "Khác"
};

const COLLAPSED_PROJECTS_KEY = 'channelList_collapsedProjects';

export const ChannelList = ({
    channels,
    selectedChannel,
    onSelectChannel,
    unreadMap = {},
}: ChannelListProps) => {
    const { user } = useAuth();

    // Load collapsed projects from localStorage (projects are expanded by default)
    const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(() => {
        try {
            const stored = localStorage.getItem(COLLAPSED_PROJECTS_KEY);
            if (stored) {
                return new Set(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Error loading collapsed projects:', error);
        }
        return new Set();
    });

    // Save collapsed projects to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(COLLAPSED_PROJECTS_KEY, JSON.stringify(Array.from(collapsedProjects)));
        } catch (error) {
            console.error('Error saving collapsed projects:', error);
        }
    }, [collapsedProjects]);

    // Phân loại kênh, chỉ lấy kênh có isActive !== false
    const grouped: Record<string, Channel[]> = {
        group: [],
        "group-private": [],
        personal: [],
        other: []
    };

    channels
        .filter((c: any) => c.isActive !== false) // Lọc kênh không active
        .forEach((c) => {
            if (grouped[c.type]) grouped[c.type].push(c);
            else grouped.other.push(c);
        });

    // Nhóm các kênh group-private theo project key
    const projectGroups: ProjectGroup[] = [];
    const groupPrivateByKey = new Map<string, Channel[]>();
    const groupPrivateWithoutKey: Channel[] = []; // Kênh group-private không có key

    grouped["group-private"].forEach((channel: any) => {
        if (channel.key) {
            // Có key -> nhóm theo dự án
            if (!groupPrivateByKey.has(channel.key)) {
                groupPrivateByKey.set(channel.key, []);
            }
            groupPrivateByKey.get(channel.key)!.push(channel);
        } else {
            // Không có key -> hiển thị như kênh bình thường
            groupPrivateWithoutKey.push(channel);
        }
    });

    groupPrivateByKey.forEach((channels: any, key: string) => {
        const projectName = channels[0]?.json_data?.projectName || "Dự án không tên";
        projectGroups.push({ key, projectName, channels });
    });

    // Sắp xếp project groups theo thời gian tạo mới nhất
    projectGroups.sort((a, b) => {
        const ta = a.channels[0]?.created_at ? new Date(a.channels[0].created_at).getTime() : 0;
        const tb = b.channels[0]?.created_at ? new Date(b.channels[0].created_at).getTime() : 0;
        return tb - ta;
    });

    // Sắp xếp channels trong mỗi project
    projectGroups.forEach(project => {
        project.channels.sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
        });
    });

    // Sắp xếp các kênh khác theo thời gian tạo mới nhất lên trên
    ['group', 'personal', 'other'].forEach(type => {
        grouped[type].sort((a, b) => {
            const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
            const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
            return tb - ta;
        });
    });

    const toggleProject = (key: string) => {
        setCollapsedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                // If collapsed, expand it (remove from collapsed set)
                newSet.delete(key);
            } else {
                // If expanded, collapse it (add to collapsed set)
                newSet.add(key);
            }
            return newSet;
        });
    };

    const renderChannel = (channel: Channel) => {
        // Nếu là kênh personal, lấy ra user trong members có id khác với user.id hiện tại
        let otherUser: any;
        if (channel.type === "personal" && channel.members && user?.id) {
            const otherMember = channel.members.find((m: any) => m.id !== user.id);
            otherUser = otherMember;
        }
        const unread = unreadMap[channel.id] || 0;

        return (
            <Button
                key={channel.id}
                variant="ghost"
                className={`w-full justify-between px-2 py-2 my-1 h-auto font-normal flex items-center
                    ${selectedChannel?.id === channel.id
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-900  dark:text-gray-100 border border-gray-300 dark:border-gray-700 shadow-sm'
                        : unread > 0
                            ? 'font-bold text-gray-900 dark:text-white'
                            : 'text-gray-700 dark:text-sidebar-foreground hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 dark:text-gray-100 shadow-sm'
                    }`}
                onClick={() => onSelectChannel(channel)}
            >
                <div className="flex items-center gap-2">
                    {channel.type === "personal"
                        ? getChannelIcon(channel, otherUser)
                        : getChannelIcon(channel)}
                    <span className="truncate">
                        {channel.type === "personal" && otherUser
                            ? (otherUser.username || otherUser.name || otherUser.email || channel.name)
                            : channel.name
                        }
                    </span>
                </div>
                {unread > 0 && (
                    <span className="ml-2 text-xs bg-red-500 dark:bg-red-600 text-white rounded-full px-2 py-0.5">
                        {unread}
                    </span>
                )}
            </Button>
        );
    };

    return (
        <div>
            {/* Kênh công khai */}
            {grouped.group.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 dark:text-muted-foreground mb-2 pl-2">
                        {SECTION_LABELS.group}
                    </div>
                    {grouped.group.map(renderChannel)}
                </div>
            )}

            {/* Kênh riêng tư không có key - hiển thị như kênh bình thường */}
            {groupPrivateWithoutKey.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 dark:text-muted-foreground mb-2 pl-2">
                        Kênh riêng tư
                    </div>
                    {groupPrivateWithoutKey.map(renderChannel)}
                </div>
            )}

            {/* Kênh dự án - nhóm theo project (chỉ những kênh có key) */}
            {projectGroups.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 dark:text-muted-foreground mb-2 pl-2">
                        {SECTION_LABELS["group-private"]}
                    </div>
                    {projectGroups.map((project) => {
                        // Project is expanded by default (when NOT in collapsed set)
                        const isExpanded = !collapsedProjects.has(project.key);
                        const totalUnread = project.channels.reduce((sum, ch) => sum + (unreadMap[ch.id] || 0), 0);

                        return (
                            <div key={project.key} className="mb-2">
                                {/* Project Header */}
                                <Button
                                    variant="ghost"
                                    className="w-full justify-between px-2 py-1.5 h-auto font-medium flex items-center text-gray-700 dark:text-sidebar-foreground hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-800 dark:text-gray-100"
                                    onClick={() => toggleProject(project.key)}
                                >
                                    <div className="flex items-center gap-2">
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                        <Folder className="h-4 w-4 text-purple-400 dark:text-purple-400" />
                                        <span className="truncate">{project.projectName}</span>
                                        <span className="text-xs text-gray-500 dark:text-muted-foreground">
                                            ({project.channels.length})
                                        </span>
                                    </div>
                                    {totalUnread > 0 && (
                                        <span className="ml-2 text-xs bg-red-500 dark:bg-red-600 text-white rounded-full px-2 py-0.5">
                                            {totalUnread}
                                        </span>
                                    )}
                                </Button>

                                {/* Project Channels */}
                                {isExpanded && (
                                    <div className="ml-4 mt-1">
                                        {project.channels.map(renderChannel)}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Chat cá nhân */}
            {grouped.personal.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 dark:text-muted-foreground mb-2 pl-2">
                        {SECTION_LABELS.personal}
                    </div>
                    {grouped.personal.map(renderChannel)}
                </div>
            )}

            {/* Khác */}
            {grouped.other.length > 0 && (
                <div className="mb-4">
                    <div className="text-xs font-semibold text-gray-600 dark:text-muted-foreground mb-2 pl-2">
                        {SECTION_LABELS.other}
                    </div>
                    {grouped.other.map(renderChannel)}
                </div>
            )}
        </div>
    );
};
