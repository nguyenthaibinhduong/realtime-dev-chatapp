import { MessageSquare, Hash, Lock, Trash2 } from "lucide-react";
import DataTable, { ColumnConfig, FilterConfig } from "@/components/common/DataTable";
import { SystemAPI } from "@/api/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ChannelUpdate } from "@/components/blocks/channels/ChannelSettings";
import { toast } from "@/hooks/useToast";

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
    const [stats, setStats] = useState<ChannelStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
    const [selectedChannelForSettings, setSelectedChannelForSettings] = useState<Channel | null>(null);
    const [messageManagementOpen, setMessageManagementOpen] = useState(false);
    const [selectedChannelForMessages, setSelectedChannelForMessages] = useState<Channel | null>(null);
    const [messageSearchQuery, setMessageSearchQuery] = useState("");
    const [deletingMessageId, setDeletingMessageId] = useState<number | null>(null);

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

    // Load messages for management view
    const loadChannelMessages = async (channelId: number, beforeCursor?: number) => {
        try {
            setLoadingMoreMessages(true);
            const params: any = {
                method: "read-one",
                id: channelId,
                pageSize: 50,
            };

            if (beforeCursor) {
                params.before = beforeCursor;
            }

            const response = await SystemAPI.ChannelsManagement(params);

            if (response?.data) {
                if (beforeCursor && selectedChannelForMessages) {
                    // Append older messages
                    const newMessages = response.data.messages?.items || [];
                    setSelectedChannelForMessages({
                        ...selectedChannelForMessages,
                        messages: {
                            items: [...newMessages, ...(selectedChannelForMessages.messages?.items || [])],
                            pageSize: response.data.messages?.pageSize || 50,
                            hasMoreOlder: response.data.messages?.hasMoreOlder || false,
                            hasMoreNewer: response.data.messages?.hasMoreNewer || false,
                            cursors: response.data.messages?.cursors || selectedChannelForMessages.messages?.cursors,
                        },
                    });
                } else {
                    // Initial load
                    setSelectedChannelForMessages(response.data);
                }
            }
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoadingMoreMessages(false);
        }
    };

    // Delete message
    const handleDeleteMessage = async (messageId: number) => {
        if (!confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) return;

        try {
            setDeletingMessageId(messageId);
            await SystemAPI.ChannelsManagement({
                method: "delete-message-channel",
                messageId: messageId,
                channelId: selectedChannelForMessages?.id,
            });

            // Remove from local state
            if (selectedChannelForMessages?.messages) {
                setSelectedChannelForMessages({
                    ...selectedChannelForMessages,
                    messages: {
                        ...selectedChannelForMessages.messages,
                        items: selectedChannelForMessages.messages.items.filter(m => m.id !== messageId),
                    },
                });
            }

            toast({
                title: "Đã xóa tin nhắn",
                description: `#${messageId} đã được xóa thành công.`,
                duration: 2000,
            });
        } catch (error) {
            console.error("Failed to delete message:", error);
            toast({
                title: "Đã xóa tin nhắn thất bại",
                description: `#${messageId} không thể xóa.`,
                variant: "destructive",
                duration: 4000,
            });
        } finally {
            setDeletingMessageId(null);
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
            key: "json_data",
            label: "Dự án",
            type: "custom",
            render: (value: any, item) => {
                if (item.type === "group-private" && value?.projectName) {
                    return (
                        <span className="text-purple-400 font-medium">{value.projectName}</span>
                    );
                }
                return <span className="text-gray-500">-</span>;
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

    // Form Content - Using ChannelUpdate for member management
    const renderForm = (channel: Channel | null, onSubmit: (data: any) => void) => {
        // For edit mode, use ChannelUpdate component for member management
        if (channel) {
            return (
                <ChannelUpdate
                    open={true}
                    onOpenChange={() => { }}
                    channelId={channel.id}
                    channelName={channel.name}
                    channelData={channel}
                    onSuccess={() => {
                        // Reload data after successful update
                        loadData({
                            page: 1,
                            limit: 10,
                            search: "",
                            filters: {}
                        });
                    }}
                />
            );
        }

        // For create mode, show simple form
        const [formData, setFormData] = useState({
            name: "",
            type: "group" as "group" | "group-private" | "personal",
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
                        Tạo mới
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
                formContent={renderForm}
                customActions={[
                    {
                        label: "Quản lý tin nhắn",
                        icon: <MessageSquare className="h-4 w-4 mr-2" />,
                        onClick: async (channel: Channel) => {
                            await loadChannelMessages(channel.id);
                            setMessageManagementOpen(true);
                        },
                        className: "text-blue-400",
                    },
                    {
                        label: "Cài đặt kênh",
                        icon: <Hash className="h-4 w-4 mr-2" />,
                        onClick: async (channel: Channel) => {
                            try {
                                // Load full channel data with read-one
                                const result = await SystemAPI.ChannelsManagement({
                                    method: "read-one",
                                    id: channel.id
                                });
                                setSelectedChannelForSettings(result.data || channel);
                                setSettingsDialogOpen(true);
                            } catch (error) {
                                console.error("Failed to load channel:", error);
                                setSelectedChannelForSettings(channel);
                                setSettingsDialogOpen(true);
                            }
                        },
                        className: "text-purple-400",
                    },
                ]}
                enableCreate={true}
                enableEdit={false}
                enableDelete={true}
                enableView={false}
                enableActiveToggle={true}
                primaryColor="green"
                defaultLimit={10}
            />

            {/* Message Management Dialog */}
            <Dialog open={messageManagementOpen} onOpenChange={setMessageManagementOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-900 border-zinc-800 text-white overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                            <MessageSquare className="h-6 w-6 text-blue-400" />
                            Quản lý tin nhắn: {selectedChannelForMessages?.name}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedChannelForMessages && (
                        <div className="flex-1 overflow-hidden flex flex-col gap-4">
                            {/* Search Bar */}
                            <div className="relative">
                                <Input
                                    placeholder="Tìm kiếm tin nhắn..."
                                    value={messageSearchQuery}
                                    onChange={(e) => setMessageSearchQuery(e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 pl-10"
                                />
                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span>Tổng: {selectedChannelForMessages.messageCount} tin nhắn</span>
                                <span>•</span>
                                <span>Đang hiển thị: {selectedChannelForMessages.messages?.items.length || 0}</span>
                            </div>

                            {/* Load More Button */}
                            {selectedChannelForMessages.messages?.hasMoreOlder && (
                                <Button
                                    variant="outline"
                                    onClick={() => loadChannelMessages(
                                        selectedChannelForMessages.id,
                                        selectedChannelForMessages.messages?.cursors.before
                                    )}
                                    disabled={loadingMoreMessages}
                                    className="border-zinc-700 text-gray-900 hover:bg-zinc-800/50 hover:text-white"
                                >
                                    {loadingMoreMessages ? "Đang tải..." : "Tải thêm tin nhắn cũ"}
                                </Button>
                            )}

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                {selectedChannelForMessages.messages?.items
                                    .filter(msg => {
                                        if (!messageSearchQuery.trim()) return true;
                                        const query = messageSearchQuery.toLowerCase();
                                        return (
                                            msg.text.toLowerCase().includes(query) ||
                                            msg.sender?.username.toLowerCase().includes(query) ||
                                            msg.type.toLowerCase().includes(query)
                                        );
                                    })
                                    .map((message) => (
                                        <div
                                            key={message.id}
                                            className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 hover:bg-zinc-800 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex items-center gap-3 flex-1">
                                                    {message.sender?.avatar ? (
                                                        <img
                                                            src={message.sender.avatar}
                                                            alt={message.sender.username}
                                                            className="h-8 w-8 rounded-full"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-sm text-white">
                                                            {message.sender?.username[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className="font-medium text-white">{message.sender?.username}</p>
                                                            <span className="text-xs text-gray-400">
                                                                {new Date(message.send_at).toLocaleString("vi-VN")}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded ${message.type === "ba-require" ? "bg-blue-500/20 text-blue-400" :
                                                                message.type === "tester-report" ? "bg-red-500/20 text-red-400" :
                                                                    message.type === "code-share" ? "bg-green-500/20 text-green-400" :
                                                                        message.type === "tool" ? "bg-purple-500/20 text-purple-400" :
                                                                            "bg-gray-500/20 text-gray-400"
                                                                }`}>
                                                                {message.type}
                                                            </span>
                                                            {message.isPin && (
                                                                <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                                                    📌 Pinned
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleDeleteMessage(message.id)}
                                                    disabled={deletingMessageId === message.id}
                                                    className="h-8 w-8 p-0 hover:bg-red-600/20 text-red-400"
                                                    title="Xóa tin nhắn"
                                                >
                                                    {deletingMessageId === message.id ? (
                                                        <span className="text-xs">…</span>
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            <div className="text-sm text-gray-300 mb-2 whitespace-pre-wrap break-words">
                                                {message.text}
                                            </div>
                                            {message.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {message.attachments.map((att) => (
                                                        <div
                                                            key={att.id}
                                                            className="text-xs px-2 py-1 bg-zinc-700/50 rounded text-gray-400 flex items-center gap-1"
                                                        >
                                                            📎 {att.filename}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                {selectedChannelForMessages.messages?.items.length === 0 && (
                                    <div className="text-center py-12 text-gray-400">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Chưa có tin nhắn nào</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Channel Settings Dialog */}
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] bg-zinc-900 border-zinc-800 text-white overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">
                            Cài đặt kênh: {selectedChannelForSettings?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedChannelForSettings && (
                        <div className="flex-1 overflow-y-auto">
                            <ChannelUpdate
                                open={settingsDialogOpen}
                                onOpenChange={setSettingsDialogOpen}
                                channelId={selectedChannelForSettings.id}
                                channelName={selectedChannelForSettings.name}
                                channelData={selectedChannelForSettings}
                                onSuccess={() => {
                                    loadData({
                                        page: 1,
                                        limit: 10,
                                        search: "",
                                        filters: {}
                                    });
                                    setSettingsDialogOpen(false);
                                }}
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
