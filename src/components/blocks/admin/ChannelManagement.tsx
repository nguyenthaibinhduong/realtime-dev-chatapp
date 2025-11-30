import { MessageSquare, Hash, Lock } from "lucide-react";
import DataTable, { ColumnConfig, FilterConfig } from "@/components/common/DataTable";
import { SystemAPI } from "@/api/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";

interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string | null;
    isActive: boolean;
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
    isActive: boolean;
    created_at: string;
    updated_at: string;
}

export default function ChannelManagementNew() {
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
    const renderDetailModal = (channel: Channel) => (
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
        </div>
    );

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
    );
}
