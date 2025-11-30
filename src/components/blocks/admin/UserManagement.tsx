import { Users, Shield } from "lucide-react";
import DataTable, { ColumnConfig, FilterConfig } from "@/components/common/DataTable";
import { SystemAPI } from "@/api/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { DialogFooter } from "@/components/ui/dialog";

interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    role: "user" | "admin";
    isActive: boolean;
    created_at: string;
}

export default function UserManagementNew() {
    // Columns configuration
    const columns: ColumnConfig<User>[] = [
        {
            key: "avatar",
            label: "Avatar",
            type: "avatar",
            avatarKey: "avatar",
            fallbackKey: "username",
            width: "80px",
        },
        {
            key: "username",
            label: "Tên người dùng",
            type: "text",
        },
        {
            key: "email",
            label: "Email",
            type: "text",
        },
        {
            key: "role",
            label: "Vai trò",
            type: "badge",
            getBadgeConfig: (role) => {
                if (role === "admin") {
                    return {
                        label: "Admin",
                        color: "bg-purple-500/20 text-purple-400 border-purple-500/50",
                    };
                }
                return {
                    label: "User",
                    color: "bg-blue-500/20 text-blue-400 border-blue-500/50",
                };
            },
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
            key: "role",
            label: "Vai trò",
            type: "select",
            options: [
                { label: "Tất cả", value: "" },
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
            ],
        },
        {
            key: "isActive",
            label: "Trạng thái",
            type: "select",
            options: [
                { label: "Tất cả", value: "" },
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
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
            const response = await SystemAPI.UsersManagement({
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

    // Custom actions
    const customActions = [
        {
            label: "Cấp quyền Admin",
            icon: <Shield className="h-4 w-4 mr-2" />,
            onClick: async (user: User) => {
                if (confirm(`Cấp quyền Admin cho ${user.username}?`)) {
                    try {
                        await SystemAPI.UsersManagement({
                            method: "update",
                            id: user.id,
                            role: "admin",
                        });
                        alert("Cấp quyền thành công!");
                    } catch (error) {
                        alert("Cấp quyền thất bại!");
                    }
                }
            },
            className: "text-purple-400",
        },
    ];

    // Detail Modal Content
    const renderDetailModal = (user: User) => (
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
                <img
                    src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}`}
                    alt={user.username}
                    className="h-20 w-20 rounded-full"
                />
                <div>
                    <h3 className="text-xl font-bold text-white">{user.username}</h3>
                    <p className="text-gray-400">{user.email}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm text-gray-400 mb-1">Vai trò</p>
                    <p className="text-white">{user.role === "admin" ? "Admin" : "User"}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 mb-1">Trạng thái</p>
                    <p className="text-white">{user.isActive ? "Active" : "Inactive"}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 mb-1">Ngày tạo</p>
                    <p className="text-white">{new Date(user.created_at).toLocaleString("vi-VN")}</p>
                </div>
            </div>
        </div>
    );

    // Form Content
    const renderForm = (user: User | null, onSubmit: (data: any) => void) => {
        const [formData, setFormData] = useState({
            username: user?.username || "",
            email: user?.email || "",
            password: "",
            role: user?.role || "user",
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            onSubmit(formData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                    <Label className="text-gray-400">Tên người dùng</Label>
                    <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="bg-zinc-950 border-zinc-700 mt-1"
                        required
                    />
                </div>
                <div>
                    <Label className="text-gray-400">Email</Label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-zinc-950 border-zinc-700 mt-1"
                        required
                    />
                </div>
                {!user && (
                    <div>
                        <Label className="text-gray-400">Mật khẩu</Label>
                        <Input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="bg-zinc-950 border-zinc-700 mt-1"
                            required
                        />
                    </div>
                )}
                <div>
                    <Label className="text-gray-400">Vai trò</Label>
                    <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "user" | "admin" })}
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded mt-1 text-white"
                    >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <DialogFooter>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        {user ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </DialogFooter>
            </form>
        );
    };

    return (
        <DataTable<User>
            title="Quản lý User"
            icon={<Users className="h-8 w-8 text-green-400" />}
            description="Xem, thêm, sửa và quản lý người dùng hệ thống"
            columns={columns}
            filters={filters}
            onLoadData={loadData}
            apiEndpoint={SystemAPI.UsersManagement}
            customActions={customActions}
            detailModalContent={renderDetailModal}
            detailModalTitle="Thông tin User"
            formContent={renderForm}
            enableCreate={true}
            enableEdit={true}
            enableDelete={true}
            enableView={true}
            enableActiveToggle={true}
            primaryColor="green"
        />
    );
}
