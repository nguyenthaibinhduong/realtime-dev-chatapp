import { MessageSquare, Hash, Lock } from "lucide-react";
import DataTable, { ColumnConfig, FilterConfig } from "@/components/common/DataTable";
import { SystemAPI } from "@/api/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { DialogFooter } from "@/components/ui/dialog";

interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string | null;
    isActive: boolean;
}

interface Attachment {
    id: number;
    filename: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    key: string;
}

interface Message {
    id: number;
    type: string;
    text: string;
    json_data?: any;
    isPin: boolean;
    replyTo: number | null;
    like_data: any;
    send_at: string;
    created_at: string;
    updated_at: string;
    sender: {
        id: number;
        username: string;
        email: string;
        avatar?: string | null;
    };
    attachments: Attachment[];
    channelId: number | null;
}

interface Channel {
    id: number;
    name: string;
    type: "group" | "group-private" | "personal";
    key?: string | null;
    json_data?: any;
    member_count: number;
    messageCount: number;
    owner?: User | null;
    members: User[];
    messages?: {
        items: Message[];
        pageSize: number;
        hasMoreOlder: boolean;
        hasMoreNewer: boolean;
        cursors: {
            before: number;
            after: number;
        };
    };
    isActive: boolean;
    created_at: string;
    updated_at: string;
}

interface ChannelStats {
    totalChannels: number;
    personalChannels: number;
    groupChannels: number;
    privateChannels: number;
    totalMessages: number;
    topChannels: {
        id: number;
        name: string;
        type: string;
        member_count: number;
        messageCount: number;
        owner: User | null;
    }[];
}

export default function ChannelManagementNew() {
    const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
    const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
    const [stats, setStats] = useState<ChannelStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Load stats function
    const loadStats = async () => {
        try {
            setLoadingStats(true);
            const response = await SystemAPI.ChannelsManagement({
                method: "stats",
            });
            if (response?.data) {
                setStats(response.data);
            }
        } catch (error) {
            console.error("Failed to load stats:", error);
        } finally {
            setLoadingStats(false);
        }
    };

    // Load stats on component mount
    useEffect(() => {
        loadStats();
    }, []);

    // Load more messages function
    const loadMoreMessages = async (channelId: number, beforeCursor: number) => {
        try {
            setLoadingMoreMessages(true);
            const response = await SystemAPI.ChannelsManagement({
                method: "read-one",
                id: channelId,
                pageSize: 50,
                before: beforeCursor,
            });

            if (response?.data && currentChannel) {
                const newMessages = response.data.messages?.items || [];
                const updatedChannel = {
                    ...currentChannel,
                    messages: {
                        items: [...newMessages, ...(currentChannel.messages?.items || [])],
                        pageSize: response.data.messages?.pageSize || 50,
                        hasMoreOlder: response.data.messages?.hasMoreOlder || false,
                        hasMoreNewer: response.data.messages?.hasMoreNewer || false,
                        cursors: response.data.messages?.cursors || currentChannel.messages?.cursors,
                    },
                };
                setCurrentChannel(updatedChannel);
            }
        } catch (error) {
            console.error("Failed to load more messages:", error);
        } finally {
            setLoadingMoreMessages(false);
        }
    };

    // Columns configuration
    const columns: ColumnConfig<Channel>[] = [
        {
            key: "name",
            label: "Tên kênh",
            type: "custom",
            render: (value, item) => (
                <div className="flex items-center gap-2">
                    {item.type === "group-private" || item.type === "personal" ? (
                        <Lock className="h-4 w-4 text-orange-400" />
                    ) : (
                        <Hash className="h-4 w-4 text-blue-400" />
                    )}
                    <span className="text-white font-medium">{value}</span>
                </div>
            ),
        },
        {
            key: "type",
            label: "Loại",
            type: "badge",
            getBadgeConfig: (type) => {
                if (type === "group-private") {
                    return {
                        label: "Project",
                        color: "bg-purple-500/20 text-purple-400 border-purple-500/50",
                    };
                }
                if (type === "personal") {
                    return {
                        label: "Personal",
                        color: "bg-orange-500/20 text-orange-400 border-orange-500/50",
                    };
                }
                return {
                    label: "Public",
                    color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
                };
            },
        },
        {
            key: "owner",
            label: "Chủ sở hữu",
            type: "custom",
            render: (value: User | null) => (
                <span className="text-white">{value?.username || "Không có"}</span>
            ),
        },
        {
            key: "member_count",
            label: "Thành viên",
            type: "custom",
            render: (value) => (
                <span className="text-white">{value || 0}</span>
            ),
        },
        {
            key: "messageCount",
            label: "Tin nhắn",
            type: "custom",
            render: (value) => (
                <span className="text-white">{value || 0}</span>
            ),
        },
        {
            key: "created_at",
            label: "Ngày tạo",
            type: "date",
        },
    ];

    // Filters configuration
    const filters: FilterConfig[] = [
        {
            key: "type",
            label: "Loại kênh",
            type: "select",
            options: [
                { label: "Tất cả", value: "" },
                { label: "Group", value: "group" },
                { label: "Group Private", value: "group-private" },
                { label: "Personal", value: "personal" },
            ],
        },
    ];

    // Load data function
    const loadData = async (params: {
        page: number;
        limit: number;
        search: string;
        filters: Record<string, any>;
    }) => {
        try {
            const response = await SystemAPI.ChannelsManagement({
                method: "read-all",
                page: params.page ?? 1,
                limit: params.limit ?? 10,
                keySearch: params.search ?? '',
                ...params.filters,
            });


            if (!response || !response.data) {
                return { data: [], total: 0 };
            }
            return {
                data: response.data.items || [],
                total: response.total || 0,
            };
        } catch (error) {
            console.error("Failed to load users:", error);
            return { data: [], total: 0 };
        }
    };

    // Detail Modal Content
    const renderDetailModal = (channel: Channel) => {
        // Set current channel when modal opens
        if (currentChannel?.id !== channel.id) {
            setCurrentChannel(channel);
        }
        const displayChannel = currentChannel?.id === channel.id ? currentChannel : channel;

        return (
            <div className="space-y-4 py-4">
                <div className="flex items-center gap-3 mb-4">
                    {channel.type === "group-private" || channel.type === "personal" ? (
                        <Lock className="h-8 w-8 text-orange-400" />
                    ) : (
                        <Hash className="h-8 w-8 text-blue-400" />
                    )}
                    <div>
                        <h3 className="text-xl font-bold text-white">{channel.name}</h3>
                        <p className="text-sm text-gray-400">
                            {channel.type === "group-private"
                                ? "Group Private"
                                : channel.type === "personal"
                                    ? "Personal"
                                    : "Group"}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Chủ sở hữu</p>
                        <p className="text-white">{channel.owner?.username || "Không có"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Số thành viên</p>
                        <p className="text-white text-2xl font-bold">{channel.member_count}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Số tin nhắn</p>
                        <p className="text-white text-2xl font-bold">{channel.messageCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Trạng thái</p>
                        <p className="text-white">{channel.isActive ? "Active" : "Inactive"}</p>
                    </div>
                </div>
                {channel.type === "group-private" && channel.json_data && (
                    <div>
                        <p className="text-sm text-gray-400 mb-1">Dự án</p>
                        <p className="text-white">{channel.json_data.projectName || "Không có"}</p>
                    </div>
                )}
                <div>
                    <p className="text-sm text-gray-400 mb-1">Ngày tạo</p>
                    <p className="text-white">{new Date(channel.created_at).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 mb-1">Cập nhật</p>
                    <p className="text-white">{new Date(channel.updated_at).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 mb-2">Danh sách thành viên ({channel.members.length})</p>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                        {channel.members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-md border border-zinc-700"
                            >
                                {member.avatar && (
                                    <img
                                        src={member.avatar}
                                        alt={member.username}
                                        className="h-5 w-5 rounded-full"
                                    />
                                )}
                                <span className="text-white text-sm">{member.username}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quản lý tin nhắn */}
                {displayChannel.messages && displayChannel.messages.items.length > 0 && (
                    <div className="border-t border-zinc-800 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-gray-400">
                                Quản lý tin nhắn ({displayChannel.messages.items.length}/{displayChannel.messageCount})
                            </p>
                            {displayChannel.messages.hasMoreOlder && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => loadMoreMessages(displayChannel.id, displayChannel.messages!.cursors.before)}
                                    disabled={loadingMoreMessages}
                                    className="border-zinc-700 text-xs"
                                >
                                    {loadingMoreMessages ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
                                </Button>
                            )}
                        </div>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {displayChannel.messages!.items.map((message) => (
                                <div
                                    key={message.id}
                                    className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {message.sender.avatar ? (
                                                <img
                                                    src={message.sender.avatar}
                                                    alt={message.sender.username}
                                                    className="h-6 w-6 rounded-full"
                                                />
                                            ) : (
                                                <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-white">
                                                    {message.sender.username[0]?.toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white text-sm font-medium">
                                                    {message.sender.username}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(message.send_at).toLocaleString("vi-VN")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded ${message.type === "ba-require"
                                                    ? "bg-blue-500/20 text-blue-400"
                                                    : message.type === "tester-report"
                                                        ? "bg-red-500/20 text-red-400"
                                                        : message.type === "code-share"
                                                            ? "bg-green-500/20 text-green-400"
                                                            : message.type === "tool"
                                                                ? "bg-purple-500/20 text-purple-400"
                                                                : "bg-gray-500/20 text-gray-400"
                                                    }`}
                                            >
                                                {message.type}
                                            </span>
                                            {message.isPin && (
                                                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                                    📌 Pinned
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-300 mb-2 line-clamp-2">
                                        {message.text}
                                    </div>
                                    {message.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {message.attachments.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="text-xs px-2 py-1 bg-zinc-700/50 rounded text-gray-400"
                                                >
                                                    📎 {att.filename}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Form Content
    const renderForm = (channel: Channel | null, onSubmit: (data: any) => void) => {
        const [formData, setFormData] = useState({
            name: channel?.name || "",
            type: channel?.type || "group",
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSubmit(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                    <Label className="text-gray-400">Tên kênh</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-zinc-950 border-zinc-700 mt-1"
                        placeholder="Nhập tên kênh..."
                        required
                    />
                </div>
                <div>
                    <Label className="text-gray-400">Loại kênh</Label>
                    <select
                        value={formData.type}
                        onChange={(e) =>
                            setFormData({ ...formData, type: e.target.value as "group" | "group-private" | "personal" })
                        }
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded mt-1 text-white"
                    >
                        <option value="group">Group</option>
                        <option value="group-private">Group Private</option>
                        <option value="personal">Personal</option>
                    </select>
                </div>
                <DialogFooter>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        {channel ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </DialogFooter>
            </form>
        );
    };

    return (
        <div className="space-y-6">
            {/* Statistics Section */}
            {loadingStats ? (
                <div className="flex items-center justify-center p-8 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <p className="text-gray-400">Đang tải thống kê...</p>
                </div>
            ) : stats ? (
                <div className="space-y-4 pt-4 px-2">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-400 font-medium">Tổng kênh</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.totalChannels}</p>
                                </div>
                                <MessageSquare className="h-10 w-10 text-blue-400/50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-green-400 font-medium">Group</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.groupChannels}</p>
                                </div>
                                <Hash className="h-10 w-10 text-green-400/50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-purple-400 font-medium">Private</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.privateChannels}</p>
                                </div>
                                <Lock className="h-10 w-10 text-purple-400/50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-orange-400 font-medium">Personal</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.personalChannels}</p>
                                </div>
                                <Lock className="h-10 w-10 text-orange-400/50" />
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-pink-500/10 to-pink-600/10 border border-pink-500/30 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-pink-400 font-medium">Tổng tin nhắn</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stats.totalMessages.toLocaleString()}</p>
                                </div>
                                <MessageSquare className="h-10 w-10 text-pink-400/50" />
                            </div>
                        </div>
                    </div>

                    {/* Top Channels */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            🏆 Top 5 Kênh Hoạt Động Nhiều Nhất
                        </h3>
                        <div className="space-y-3">
                            {stats.topChannels.map((channel, index) => (
                                <div
                                    key={channel.id}
                                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                                            index === 1 ? "bg-gray-400/20 text-gray-300" :
                                                index === 2 ? "bg-orange-600/20 text-orange-400" :
                                                    "bg-zinc-700 text-gray-400"
                                            }`}>
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {channel.type === "group-private" || channel.type === "personal" ? (
                                                    <Lock className="h-4 w-4 text-orange-400" />
                                                ) : (
                                                    <Hash className="h-4 w-4 text-blue-400" />
                                                )}
                                                <p className="text-white font-medium">{channel.name}</p>
                                                <span className={`text-xs px-2 py-0.5 rounded ${channel.type === "group-private" ? "bg-purple-500/20 text-purple-400" :
                                                    channel.type === "personal" ? "bg-orange-500/20 text-orange-400" :
                                                        "bg-blue-500/20 text-blue-400"
                                                    }`}>
                                                    {channel.type === "group-private" ? "Project" :
                                                        channel.type === "personal" ? "Personal" : "Public"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Owner: {channel.owner?.username || "Không có"} • {channel.member_count} thành viên
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-white">{channel.messageCount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-400">tin nhắn</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : null}

            {/* DataTable */}
            <DataTable<Channel>
                title="Quản lý Kênh Chat"
                icon={<MessageSquare className="h-8 w-8 text-green-400" />}
                description="Xem, thêm, sửa và quản lý kênh chat"
                columns={columns}
                filters={filters}
                onLoadData={loadData}
                apiEndpoint={SystemAPI.ChannelsManagement}
                detailModalContent={renderDetailModal}
                detailModalTitle="Thông tin Kênh"
                formContent={renderForm}
                enableCreate={true}
                enableEdit={true}
                enableDelete={true}
                enableView={true}
                enableActiveToggle={true}
                primaryColor="green"
                defaultLimit={10}
            />
        </div>
    );
}
