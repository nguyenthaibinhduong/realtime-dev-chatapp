import { Users, Shield } from "lucide-react";
import DataTable, { ColumnConfig, FilterConfig } from "@/components/common/DataTable";
import { SystemAPI, GithubAPI } from "@/api/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import UserDashboard from "./Dashboard";
import RepoTable from "../github/RepoTable";
import AvatarUser from "@/components/common/AvartarUser";
import { OnlineDot } from "../auth/OnlineDot";

interface User {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    role: "user" | "admin";
    isActive: boolean;
    created_at: string;
    updated_at?: string;
    github_avatar?: string;
    email_verified?: boolean;
    github_verified?: boolean;
    github_installation_id?: string;
    github_user_id?: string;
    github_email?: string;
    totalRepositories?: number;
}

export default function UserManagementNew() {
    const [reloadTrigger, setReloadTrigger] = useState(0);
    const [filterValues, setFilterValues] = useState<Record<string, any>>({
        role: '',
        isActive: '',
    });
    const [showRepoDialog, setShowRepoDialog] = useState(false);
    const [selectedUserForRepo, setSelectedUserForRepo] = useState<User | null>(null);
    const [userRepos, setUserRepos] = useState<any[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);

    // Columns configuration
    const columns: ColumnConfig<User>[] = [
        {
            key: "avatar",
            label: "Avatar",
            type: "custom",
            render: (value, user) => (
                <div className="relative inline-block">
                    <AvatarUser user={user} size={8} />
                </div>
            ),
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
            // Merge filters từ params và filterValues state
            const mergedFilters = {
                ...filterValues,
                ...params.filters,
            };

            const response = await SystemAPI.UsersManagement({
                method: "read-all",
                page: params.page ?? 1,
                limit: params.limit ?? 10,
                keySearch: params.search ?? '',
                role: mergedFilters?.role ?? '',
                isActive: mergedFilters?.isActive ?? '',
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

    // Handle filter change từ DataTable
    const handleFilterChange = (newFilters: Record<string, any>) => {
        console.log('Filter changed:', newFilters);
        setFilterValues(newFilters);
        setReloadTrigger(prev => prev + 1); // Trigger reload
    };

    // Load user repositories
    const loadUserRepos = async (user: User) => {
        if (!user.github_installation_id) {
            setUserRepos([]);
            return;
        }
        setLoadingRepos(true);
        try {
            // Use getInstallationRepos with user's installation_id
            const response = await GithubAPI.getInstallationRepos({
                installation_id: user.github_installation_id,
                toUserId: user.id.toString(),
            });
            const repos = response?.data?.repositories || response?.data || [];
            setUserRepos(Array.isArray(repos) ? repos : []);
        } catch (error) {
            console.error('Failed to load user repos:', error);
            setUserRepos([]);
        } finally {
            setLoadingRepos(false);
        }
    };

    // Handle click on totalRepositories
    const handleViewRepos = async (user: User) => {
        setSelectedUserForRepo(user);
        setShowRepoDialog(true);
        await loadUserRepos(user);
    };

    // Custom actions
    const customActions = [
        {
            label: (user: User) => user.role === "admin" ? "Thu hồi quyền Admin" : "Cấp quyền Admin",
            icon: <Shield className="h-4 w-4 mr-2" />,
            onClick: async (user: User) => {
                // Không cho phép toggle admin cho root admin
                if (user.email === 'admin@example.com') {
                    alert('Không thể thay đổi quyền của tài khoản root admin');
                    return;
                }

                const action = user.role === "admin" ? "thu hồi" : "cấp";
                const confirmMsg = user.role === "admin"
                    ? `Thu hồi quyền Admin của ${user.username}?`
                    : `Cấp quyền Admin cho ${user.username}?`;

                if (confirm(confirmMsg)) {
                    try {
                        const response = await SystemAPI.UsersManagement({
                            method: "set-toggle-admin",
                            id: user.id,
                        });

                        alert(response?.msg || `${action === "cấp" ? "Cấp" : "Thu hồi"} quyền thành công!`);
                        // Trigger reload data
                        setReloadTrigger(prev => prev + 1);
                    } catch (error: any) {
                        console.error("Toggle admin failed:", error);
                        alert(error?.response?.data?.msg || `${action === "cấp" ? "Cấp" : "Thu hồi"} quyền thất bại!`);
                    }
                }
            },
            className: (user: User) => user.role === "admin" ? "text-orange-400" : "text-purple-400",
            hidden: (user: User) => user.email === 'admin@example.com',
        },
    ];

    // Detail Modal Content Component - Fixed hooks issue
    const UserDetailModal = ({ user }: { user: User }) => {
        const [userDetail, setUserDetail] = useState<User | null>(null);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const fetchUserDetail = async () => {
                try {
                    setLoading(true);
                    const response = await SystemAPI.UsersManagement({
                        method: "read-one",
                        id: user.id,
                    });
                    if (response?.data) {
                        setUserDetail(response.data);
                    }
                } catch (error) {
                    console.error("Failed to load user detail:", error);
                    setUserDetail(user);
                } finally {
                    setLoading(false);
                }
            };
            fetchUserDetail();
        }, [user.id]);

        if (loading) {
            return (
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-400">Đang tải thông tin...</div>
                </div>
            );
        }

        const displayUser = userDetail || user;

        return (
            <div className="space-y-6 py-4">
                {/* Header with Avatar */}
                <div className="flex items-start gap-4 pb-4 border-b border-zinc-300 dark:border-zinc-800">
                    <img
                        src={displayUser.avatar || displayUser.github_avatar || `https://ui-avatars.com/api/?name=${displayUser.username}`}
                        alt={displayUser.username}
                        className="h-24 w-24 rounded-full border-2 border-zinc-300 dark:border-zinc-700"
                    />
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{displayUser.username}</h3>
                            {displayUser.email === 'admin@example.com' && (
                                <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                    🔒 Root Admin
                                </span>
                            )}
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">{displayUser.email}</p>
                        <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-1 rounded ${displayUser.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {displayUser.role === "admin" ? "👑 Admin" : "👤 User"}
                            </span>
                            <span className={`px-2 py-1 rounded ${displayUser.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                {displayUser.isActive ? "✓ Active" : "✗ Inactive"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-200 dark:bg-zinc-800/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Người dùng</p>
                        <p className="text-gray-900 dark:text-white font-mono">#{displayUser.username}</p>
                    </div>
                    <div
                        className="bg-zinc-200 dark:bg-zinc-800/50 p-3 rounded-lg cursor-pointer hover:bg-zinc-300 dark:hover:bg-zinc-700/50 transition-colors"
                        onClick={() => handleViewRepos(displayUser)}
                        title="Xem danh sách repository"
                    >
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tổng Repository</p>
                        <p className="text-gray-900 dark:text-white font-semibold hover:text-blue-600 dark:hover:text-blue-400">
                            {displayUser.totalRepositories || 0} repos
                        </p>
                    </div>
                    <div className="bg-zinc-200 dark:bg-zinc-800/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Email Verified</p>
                        <p className="text-gray-900 dark:text-white">
                            {displayUser.email_verified ? (
                                <span className="text-green-400">✓ Đã xác thực</span>
                            ) : (
                                <span className="text-yellow-400">⚠ Chưa xác thực</span>
                            )}
                        </p>
                    </div>
                    <div className="bg-zinc-200 dark:bg-zinc-800/50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">GitHub Verified</p>
                        <p className="text-gray-900 dark:text-white">
                            {displayUser.github_verified ? (
                                <span className="text-green-400">✓ Đã liên kết</span>
                            ) : (
                                <span className="text-gray-400">✗ Chưa liên kết</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* GitHub Info */}
                {displayUser.github_verified && (
                    <div className="bg-zinc-200/50 dark:bg-zinc-800/30 p-4 rounded-lg border border-zinc-300 dark:border-zinc-700">
                        <h4 className="text-gray-900 dark:text-white font-semibold mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Thông tin GitHub
                        </h4>
                        <div className="space-y-2 text-sm">
                            {/* <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">GitHub User ID:</span>
                                <span className="text-gray-900 dark:text-white font-mono">{displayUser.github_user_id}</span>
                            </div> */}
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">GitHub Email:</span>
                                <span className="text-gray-900 dark:text-white">{displayUser.github_email}</span>
                            </div>
                            {/* <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Installation ID:</span>
                                <span className="text-gray-900 dark:text-white font-mono">{displayUser.github_installation_id}</span>
                            </div> */}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">📅 Ngày tạo</p>
                        <p className="text-gray-900 dark:text-white text-sm">{new Date(displayUser.created_at).toLocaleString("vi-VN")}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">🔄 Cập nhật lần cuối</p>
                        <p className="text-gray-900 dark:text-white text-sm">{new Date(displayUser.updated_at).toLocaleString("vi-VN")}</p>
                    </div>
                </div>
            </div>
        );
    };

    // Render function for DataTable
    const renderDetailModal = (user: User) => <UserDetailModal user={user} />;

    // Form Content Component
    const UserFormContent = ({ user, onSubmit }: { user: User | null; onSubmit: (data: any) => void }) => {
        const [formData, setFormData] = useState({
            username: user?.username || "",
            email: user?.email || "",
            role: user?.role || "user",
            password: "",
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();

            // Khi tạo mới: gửi tất cả thông tin
            if (!user) {
                onSubmit({
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                });
                return;
            }

            // Khi cập nhật: chỉ gửi các field cần update
            const submitData: any = {
                username: formData.username,
                role: formData.role,
            };

            // Chỉ gửi password nếu user nhập (đổi mật khẩu)
            if (formData.password) {
                submitData.password = formData.password;
            }

            onSubmit(submitData);
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                    <Label className="text-gray-400">Tên người dùng</Label>
                    <Input
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="bg-zinc-950 border-zinc-700 mt-1 text-gray-900 dark:text-white"
                        placeholder="Nhập tên người dùng"
                        required
                    />
                </div>
                <div>
                    <Label className="text-gray-400">Email</Label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-zinc-950 border-zinc-700 mt-1 text-gray-900 dark:text-white"
                        placeholder="Nhập email"
                        required={!user}
                        disabled={!!user}
                        title={user ? "Email không thể thay đổi" : ""}
                    />
                </div>
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
                <div>
                    <Label className="text-gray-400">
                        Mật khẩu {user && <span className="text-gray-500 text-xs">(để trống nếu không đổi)</span>}
                    </Label>
                    <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-zinc-950 border-zinc-700 mt-1 text-gray-900 dark:text-white"
                        placeholder={user ? "Nhập mật khẩu mới (nếu muốn đổi)" : "Nhập mật khẩu"}
                        required={!user}
                    />
                </div>
                <DialogFooter>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        {user ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </DialogFooter>
            </form>
        );
    };

    // Render function for form
    const renderForm = (user: User | null, onSubmit: (data: any) => void) => (
        <UserFormContent user={user} onSubmit={onSubmit} />
    );

    return (
        <div className="space-y-6">
            <DataTable<User>
                key={reloadTrigger}
                title="Quản lý User"
                icon={<Users className="h-8 w-8 text-green-400" />}
                description="Xem, thêm, sửa và quản lý người dùng hệ thống"
                columns={columns}
                filters={filters}
                onLoadData={loadData}
                onFilterChange={handleFilterChange}
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

            {/* Repository Dialog */}
            <Dialog open={showRepoDialog} onOpenChange={setShowRepoDialog}>
                <DialogContent className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-800 max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            Repository của {selectedUserForRepo?.username}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedUserForRepo?.github_installation_id ? (
                        <RepoTable
                            repos={userRepos}
                            loading={loadingRepos}
                            onRefresh={() => selectedUserForRepo && loadUserRepos(selectedUserForRepo)}
                        />
                    ) : (
                        <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                            <p>User chưa liên kết GitHub</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
