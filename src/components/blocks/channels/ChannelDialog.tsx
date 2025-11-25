import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Globe,
  Lock,
  Search,
  X,
  User,
  Users,
  Crown,
  FileText,
  Bug,
  Code,
  Eye,
  Plus,
} from "lucide-react";
import { useSearchUsers } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useState, useEffect, useMemo, useCallback } from "react";
import { chatSocketService } from "@/services/chatSocketService";

interface User {
  id: number;
  username: string;
  email: string;
}

interface UserWithRoles extends User {
  roles: number[];
}

interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: "public" | "private";
  onSuccess?: () => void;
}

const ROLES = [
  { id: 1, name: "PM", icon: Crown, color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-500" },
  { id: 2, name: "BA", icon: FileText, color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500" },
  { id: 3, name: "Tester", icon: Bug, color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500" },
  { id: 4, name: "Dev", icon: Code, color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-500" },
  { id: 0, name: "Viewer", icon: Eye, color: "text-gray-400", bgColor: "bg-gray-500/20", borderColor: "border-gray-500" },
];

function UserBadge({ user, roles, onRemove, onRoleClick, isPrivate }: {
  user: UserWithRoles;
  roles?: number[];
  onRemove: () => void;
  onRoleClick?: (userId: number) => void;
  isPrivate?: boolean;
}) {
  const userRoles = roles || user.roles || [0];
  const getRoleInfo = (roleId: number) => ROLES.find(r => r.id === roleId);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-2 flex items-center justify-between gap-2 hover:border-blue-500 transition-colors">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-black dark:text-white text-xs font-semibold flex-shrink-0">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-black dark:text-white truncate">{user.username}</p>
          {isPrivate && (
            <div className="flex flex-wrap gap-1 mt-1">
              {userRoles.map(roleId => {
                const role = getRoleInfo(roleId);
                if (!role) return null;
                const RoleIcon = role.icon;
                return (
                  <Badge
                    key={roleId}
                    variant="outline"
                    className={`${role.bgColor} ${role.borderColor} ${role.color} text-[10px] px-1.5 py-0 h-5 flex items-center gap-1`}
                  >
                    <RoleIcon className="h-2.5 w-2.5" />
                    {role.name}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {isPrivate && onRoleClick && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300 hover:bg-gray-700"
            onClick={() => onRoleClick(user.id)}
          >
            Roles
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 hover:bg-red-600/20 text-red-400"
          onClick={onRemove}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function UserListItem({ user, onAdd }: { user: User; onAdd: () => void }) {
  return (
    <div
      className="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer"
      onClick={onAdd}
    >
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-black dark:text-white text-xs">
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-black dark:text-white">{user.username}</p>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
      >
        Thêm
      </Button>
    </div>
  );
}

interface ChannelForm {
  id: string;
  name: string;
  users: UserWithRoles[];
}

export function ChannelDialog({ open, onOpenChange, type, onSuccess }: ChannelDialogProps) {
  const [channelName, setChannelName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<UserWithRoles[]>([]);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [isMultiChannel, setIsMultiChannel] = useState(false);
  const [channelForms, setChannelForms] = useState<ChannelForm[]>([
    { id: crypto.randomUUID(), name: "", users: [] }
  ]);
  const [activeChannelFormId, setActiveChannelFormId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchTerm, 10);

  // Reset form khi dialog đóng
  useEffect(() => {
    if (!open) {
      setChannelName("");
      setProjectName("");
      setSearchTerm("");
      setSelectedUsers([]);
      setEditingUserId(null);
      setIsMultiChannel(false);
      setChannelForms([{ id: crypto.randomUUID(), name: "", users: [] }]);
      setActiveChannelFormId(null);
    }
  }, [open]);

  const filteredSearchResults = useMemo(
    () =>
      (searchResults || []).filter(
        (u: User) => !selectedUsers.some((s) => s.id === u.id)
      ),
    [searchResults, selectedUsers]
  );

  const handleAddUser = useCallback((user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      const userWithRoles: UserWithRoles = {
        ...user,
        roles: type === "private" ? [0] : [], // Mặc định role Viewer cho private channel
      };
      setSelectedUsers((prev) => [...prev, userWithRoles]);
      setSearchTerm("");
    }
  }, [selectedUsers, type]);

  const handleRemoveUser = useCallback((userId: number) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
    if (editingUserId === userId) {
      setEditingUserId(null);
    }
  }, [editingUserId]);

  const handleToggleRole = useCallback((userId: number, roleId: number) => {
    setSelectedUsers((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const currentRoles = user.roles || [0];
          let newRoles: number[];

          if (currentRoles.includes(roleId)) {
            // Bỏ role
            newRoles = currentRoles.filter((r) => r !== roleId);
            // Nếu không còn role nào, set về Viewer
            if (newRoles.length === 0) {
              newRoles = [0];
            }
          } else {
            // Thêm role
            newRoles = [...currentRoles.filter(r => r !== 0), roleId];
          }

          return { ...user, roles: newRoles };
        }
        return user;
      })
    );
  }, []);

  const addChannelForm = () => {
    const newForm = { id: crypto.randomUUID(), name: "", users: [] };
    setChannelForms(prev => [...prev, newForm]);
    setActiveChannelFormId(newForm.id);
  };

  const removeChannelForm = (id: string) => {
    if (channelForms.length > 1) {
      setChannelForms(prev => prev.filter(form => form.id !== id));
      if (activeChannelFormId === id) {
        setActiveChannelFormId(null);
      }
    }
  };

  const updateChannelFormName = (id: string, name: string) => {
    setChannelForms(prev => prev.map(form =>
      form.id === id ? { ...form, name } : form
    ));
  };

  const updateChannelFormUsers = (id: string, users: UserWithRoles[]) => {
    setChannelForms(prev => prev.map(form =>
      form.id === id ? { ...form, users } : form
    ));
  };

  const getActiveChannelForm = () => {
    if (!activeChannelFormId) return null;
    return channelForms.find(f => f.id === activeChannelFormId) || null;
  };

  const handleAddUserToChannel = (user: User) => {
    if (!activeChannelFormId) return;

    const activeForm = getActiveChannelForm();
    if (!activeForm) return;

    if (!activeForm.users.find((u) => u.id === user.id)) {
      const userWithRoles: UserWithRoles = {
        ...user,
        roles: [0], // Mặc định role Viewer
      };
      updateChannelFormUsers(activeChannelFormId, [...activeForm.users, userWithRoles]);
      setSearchTerm("");
    }
  };

  const handleRemoveUserFromChannel = (userId: number) => {
    if (!activeChannelFormId) return;

    const activeForm = getActiveChannelForm();
    if (!activeForm) return;

    updateChannelFormUsers(
      activeChannelFormId,
      activeForm.users.filter(u => u.id !== userId)
    );
    if (editingUserId === userId) {
      setEditingUserId(null);
    }
  };

  const handleToggleRoleForChannel = (userId: number, roleId: number) => {
    if (!activeChannelFormId) return;

    const activeForm = getActiveChannelForm();
    if (!activeForm) return;

    const updatedUsers = activeForm.users.map((user) => {
      if (user.id === userId) {
        const currentRoles = user.roles || [0];
        let newRoles: number[];

        if (currentRoles.includes(roleId)) {
          newRoles = currentRoles.filter((r) => r !== roleId);
          if (newRoles.length === 0) {
            newRoles = [0];
          }
        } else {
          newRoles = [...currentRoles.filter(r => r !== 0), roleId];
        }

        return { ...user, roles: newRoles };
      }
      return user;
    });

    updateChannelFormUsers(activeChannelFormId, updatedUsers);
  };

  const getFilteredSearchResults = () => {
    if (!activeChannelFormId) return [];
    const activeForm = getActiveChannelForm();
    if (!activeForm) return [];

    return (searchResults || []).filter(
      (u: User) => !activeForm.users.some((s) => s.id === u.id)
    );
  };

  const showDemoData = () => {
    const demoData = {
      projectName,
      channelName,
      type: type === "public" ? "group" : "group-private",
      users: selectedUsers.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        roles: u.roles || [0],
        roleNames: (u.roles || [0]).map(roleId => ROLES.find(r => r.id === roleId)?.name).filter(Boolean)
      }))
    };
    console.log("=== DEMO DATA ===");
    console.log(JSON.stringify(demoData, null, 2));
    toast({
      title: "Demo Data",
      description: "Dữ liệu đã được log ra console (F12)",
    });
  };

  const handleCreate = async () => {
    // Validate based on mode
    if (type === "private" && isMultiChannel) {
      // Multi-channel mode validation
      if (!projectName.trim()) {
        return toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên dự án",
          variant: "destructive",
        });
      }

      const emptyChannels = channelForms.filter(form => !form.name.trim());
      if (emptyChannels.length > 0) {
        return toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên cho tất cả các kênh",
          variant: "destructive",
        });
      }

      const channelsWithoutUsers = channelForms.filter(form => form.users.length === 0);
      if (channelsWithoutUsers.length > 0) {
        return toast({
          title: "Lỗi",
          description: "Vui lòng chọn thành viên cho tất cả các kênh",
          variant: "destructive",
        });
      }

      const channelsWithInsufficientUsers = channelForms.filter(form => form.users.length < 2);
      if (channelsWithInsufficientUsers.length > 0) {
        return toast({
          title: "Lỗi",
          description: "Mỗi kênh phải có ít nhất 2 thành viên",
          variant: "destructive",
        });
      }
    } else {
      // Single channel mode validation
      if (!channelName.trim()) {
        return toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên kênh",
          variant: "destructive",
        });
      }

      if (type === "private" && !projectName.trim()) {
        return toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên dự án cho kênh dự án",
          variant: "destructive",
        });
      }

      if (type === "private" && selectedUsers.length === 0) {
        return toast({
          title: "Lỗi",
          description: "Vui lòng chọn ít nhất 2 thành viên cho kênh dự án",
          variant: "destructive",
        });
      }

      if (type === "private" && selectedUsers.length < 2) {
        return toast({
          title: "Lỗi",
          description: "Kênh dự án phải có ít nhất 2 thành viên",
          variant: "destructive",
        });
      }
    }

    try {
      // Generate unique project key for multi-channel mode
      const projectKey = type === "private" && isMultiChannel
        ? `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        : undefined;

      if (type === "private" && isMultiChannel) {
        // Multi-channel mode: create multiple channels with different permissions per channel
        const channelsData = channelForms.map(form => ({
          userIds: form.users.map((u) => u.id),
          type: "group-private",
          name: form.name.trim(),
          key: projectKey,
          json_data: {
            projectName: projectName.trim(),
            userRoles: form.users.map(u => ({
              userId: u.id,
              username: u.username,
              roles: u.roles || [0],
              roleNames: (u.roles || [0]).map(roleId => ROLES.find(r => r.id === roleId)?.name).filter(Boolean)
            }))
          }
        }));

        console.log('=== CREATING MULTIPLE CHANNELS ===');
        console.log(`Total channels: ${channelsData.length}`);
        console.log('Channels data:', channelsData);

        // Create all channels using Promise.all
        try {
          const createChannelPromises = channelsData.map(data =>
            chatSocketService.createChannel(data)
          );

          await Promise.all(createChannelPromises);

          toast({
            title: "Thành công",
            description: `Tạo ${channelsData.length} kênh dự án thành công`,
          });
        } catch (error) {
          console.error('Error creating channels:', error);
          toast({
            title: "Lỗi",
            description: "Có lỗi xảy ra khi tạo một số kênh",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Single channel mode
        const data = {
          userIds: selectedUsers.map((u) => u.id),
          type: type === "public" ? "group" : "group-private",
          name: channelName.trim(),
          key: projectKey,
          json_data: {
            ...(type === "private" && {
              projectName: projectName.trim(),
              userRoles: selectedUsers.map(u => ({
                userId: u.id,
                roles: u.roles || [0]
              }))
            })
          }
        };

        // console.log("=== CREATING SINGLE CHANNEL ===");
        // console.log(JSON.stringify(data, null, 2));

        chatSocketService.createChannel(data);

        toast({
          title: "Thành công",
          description: `Tạo kênh ${type === "public" ? "công khai" : "dự án"} thành công`,
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Có lỗi xảy ra khi tạo kênh",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`bg-gray-900 text-black dark:text-white border border-gray-700 w-full h-[600px] max-h-[90vh] flex flex-col ${isMultiChannel && type === "private" ? 'max-w-6xl' : 'max-w-lg'
        }`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            {type === "public" ? (
              <>
                <Globe className="h-5 w-5 text-blue-500" />
                Tạo kênh công khai
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-red-500" />
                Tạo kênh dự án
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4 flex gap-4">
          {/* LEFT COLUMN - Channel List */}
          <div className={`flex flex-col space-y-4 overflow-y-auto ${isMultiChannel && type === "private" ? 'w-1/2' : 'w-full'
            }`}>
            {/* Project Name - Only for Private */}
            {type === "private" && (
              <div className="space-y-2 mx-1">
                <Label htmlFor="projectName" className="text-sm text-gray-200 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  Tên dự án <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="VD: E-Commerce Platform, CRM System..."
                  className="bg-gray-800 text-black dark:text-white border-gray-600 placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
            )}

            {/* Multi-Channel Toggle - Only for Private */}
            {type === "private" && (
              <div className="mx-1 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="multiChannel"
                      checked={isMultiChannel}
                      onChange={(e) => setIsMultiChannel(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <Label htmlFor="multiChannel" className="text-sm text-gray-200 cursor-pointer">
                      Tạo nhiều kênh cùng dự án
                    </Label>
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400">
                    Dùng chung key
                  </Badge>
                </div>
                {isMultiChannel && (
                  <>
                    <p className="text-xs text-gray-400 mt-2">
                      Tất cả kênh sẽ có cùng key dự án. Mỗi kênh có thành viên và phân quyền riêng.
                    </p>
                    <div className="flex items-center gap-1 mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/30">
                      <span className="text-blue-400 text-lg">💡</span>
                      <p className="text-xs text-blue-400">
                        <strong>Lưu ý:</strong> Mỗi kênh phải có ít nhất 2 thành viên
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Channel Name - Single or Multiple */}
            {isMultiChannel && type === "private" ? (
              <div className="space-y-2 mx-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-200">
                    Danh sách kênh <span className="text-red-400">*</span>
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addChannelForm}
                    className="h-7 px-2 text-xs text-green-400 hover:text-green-300 hover:bg-gray-700"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Thêm kênh
                  </Button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto p-3 bg-gray-800/30 rounded-lg border border-gray-600">
                  {channelForms.map((form, index) => (
                    <div
                      key={form.id}
                      className={`p-3 rounded-lg border-2 transition-all ${activeChannelFormId === form.id
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                        }`}
                    >
                      {/* Channel Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant="outline"
                          className={`text-xs font-semibold ${activeChannelFormId === form.id
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-gray-700 border-gray-600 text-gray-400'
                            }`}
                        >
                          #{index + 1}
                        </Badge>
                        <Input
                          value={form.name}
                          onChange={(e) => updateChannelFormName(form.id, e.target.value)}
                          placeholder={`Tên kênh ${index + 1}`}
                          className="flex-1 bg-gray-800 text-black dark:text-white border-gray-600 placeholder:text-gray-400 focus:border-blue-500 h-8 text-sm"
                        />
                        {channelForms.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeChannelForm(form.id)}
                            className="h-8 w-8 p-0 hover:bg-red-600/20 text-red-400 flex-shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {/* Channel Members Info */}
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${form.users.length < 2 ? 'text-red-400' : 'text-gray-400'}`}>
                          👥 {form.users.length} thành viên {form.users.length < 2 && '(Tối thiểu 2)'}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveChannelFormId(form.id)}
                          className={`h-6 px-2 text-xs ${activeChannelFormId === form.id
                            ? 'text-blue-400 bg-blue-500/10'
                            : 'text-gray-400 hover:text-blue-400'
                            }`}
                        >
                          {activeChannelFormId === form.id ? '✓ Đang chỉnh sửa' : 'Chỉnh sửa thành viên'}
                        </Button>
                      </div>

                      {/* Quick Member Preview */}
                      {form.users.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {form.users.slice(0, 3).map(u => {
                            const userRoles = u.roles || [0];
                            const primaryRole = ROLES.find(r => r.id === userRoles[0]);
                            return (
                              <Badge
                                key={u.id}
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${primaryRole?.bgColor} ${primaryRole?.borderColor} ${primaryRole?.color}`}
                              >
                                {u.username}
                              </Badge>
                            );
                          })}
                          {form.users.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-gray-700 border-gray-600 text-gray-400">
                              +{form.users.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">
                    Tạo {channelForms.length} kênh với key: <code className="text-blue-400 bg-blue-500/10 px-1 py-0.5 rounded">project_{'{timestamp}'}</code>
                  </span>
                  {activeChannelFormId && (
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                      Đang chỉnh sửa: {channelForms.find(f => f.id === activeChannelFormId)?.name || `Kênh ${channelForms.findIndex(f => f.id === activeChannelFormId) + 1}`}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2 mx-1">
                <Label htmlFor="channelName" className="text-sm text-gray-200">
                  Tên kênh <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="channelName"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder={`Nhập tên kênh ${type === "public" ? "công khai" : "dự án"}`}
                  className="bg-gray-800 text-black dark:text-white border-gray-600 placeholder:text-gray-400 focus:border-blue-500"
                />
              </div>
            )}
            <div className="space-y-2 mx-1">

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm người dùng..."
                  className="pl-9 bg-gray-800 text-black dark:text-white border-gray-600 placeholder:text-gray-400 focus:border-blue-500"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* Search Results */}
              {searchTerm.trim() && (isMultiChannel && type === "private" ? activeChannelFormId : true) && (
                <div className="h-32">
                  {isSearching ? (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-800 rounded-md border border-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang tìm kiếm...
                    </div>
                  ) : (isMultiChannel && type === "private" ? getFilteredSearchResults() : filteredSearchResults).length > 0 ? (
                    <ScrollArea className="h-full border border-gray-600 rounded-md bg-gray-800">
                      <div className="p-2 space-y-1">
                        {(isMultiChannel && type === "private" ? getFilteredSearchResults() : filteredSearchResults).map((user) => (
                          <UserListItem
                            key={user.id}
                            user={user}
                            onAdd={() => isMultiChannel && type === "private" ? handleAddUserToChannel(user) : handleAddUser(user)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-800 rounded-md border border-gray-600">
                      Không tìm thấy người dùng nào
                    </div>
                  )}
                </div>
              )}

              {/* Warning when no active channel in multi-channel mode */}
              {isMultiChannel && type === "private" && !activeChannelFormId && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-xs text-yellow-400 flex items-center gap-2">
                    <span className="text-base">⚠️</span>
                    Vui lòng chọn một kênh để thêm thành viên bằng cách click "Chỉnh sửa thành viên"
                  </p>
                </div>
              )}
            </div>
            {/* User Selection */}
            {!(isMultiChannel && type === "private") && (
              <div className="space-y-2 mx-1">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-200">
                    {type === "private" ? "Thành viên (bắt buộc)" : "Thành viên (tùy chọn)"}
                  </Label>
                  {type === "private" && (
                    <span className={`text-xs ${selectedUsers.length < 2 ? 'text-red-400' : 'text-gray-400'}`}>
                      {selectedUsers.length}/2 tối thiểu
                    </span>
                  )}
                </div>

                {type === "private" && selectedUsers.length < 2 && (
                  <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded border border-orange-500/30">
                    <span className="text-orange-400 text-base">⚠️</span>
                    <p className="text-xs text-orange-400">
                      Cần thêm {2 - selectedUsers.length} thành viên nữa
                    </p>
                  </div>
                )}

                {selectedUsers.length > 0 && (
                  <div className="space-y-2 p-3 bg-gray-800 rounded-md border border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase">
                        Đã chọn {selectedUsers.length} thành viên
                      </span>
                      {type === "private" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={showDemoData}
                          className="h-6 px-2 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-gray-700"
                        >
                          Show Demo Data
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {selectedUsers.map((user) => (
                        <div key={user.id}>
                          <UserBadge
                            user={user}
                            roles={user.roles}
                            onRemove={() => handleRemoveUser(user.id)}
                            onRoleClick={type === "private" ? setEditingUserId : undefined}
                            isPrivate={type === "private"}
                          />

                          {/* Role Selection Panel */}
                          {type === "private" && editingUserId === user.id && (
                            <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-blue-500/50 space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-blue-400 uppercase">
                                  Chọn vai trò cho {user.username}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingUserId(null)}
                                  className="h-5 w-5 p-0 text-gray-400 hover:text-black dark:text-white"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {ROLES.map((role) => {
                                  const RoleIcon = role.icon;
                                  const isSelected = (user.roles || [0]).includes(role.id);
                                  return (
                                    <button
                                      key={role.id}
                                      onClick={() => handleToggleRole(user.id, role.id)}
                                      className={`p-2 rounded-lg border-2 transition-all ${isSelected
                                        ? `${role.bgColor} ${role.borderColor} ${role.color}`
                                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                                        }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                          ? `${role.borderColor} ${role.bgColor}`
                                          : 'border-gray-600'
                                          }`}>
                                          {isSelected && (
                                            <svg className={`w-3 h-3 ${role.color}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                              <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                          )}
                                        </div>
                                        <RoleIcon className="h-4 w-4" />
                                        <span className="text-sm font-medium">{role.name}</span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                * Có thể chọn nhiều vai trò. Nếu không chọn, mặc định là Viewer.
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search */}

              </div>
            )}

            {/* Info */}
            {!(isMultiChannel && type === "private") && (
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-600 mx-2">
                <div className="flex items-start gap-2">
                  {type === "public" ? (
                    <Globe className="h-4 w-4 text-blue-500 mt-0.5" />
                  ) : (
                    <Lock className="h-4 w-4 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {type === "public" ? "Kênh công khai" : "Kênh dự án"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {type === "public"
                        ? "Mọi thành viên đều có thể tham gia và xem nội dung"
                        : "Chỉ những thành viên được mời mới có thể tham gia"}
                    </p>
                    {selectedUsers.length > 0 && (
                      <p className="text-xs text-blue-400 mt-1">
                        Đã chọn {selectedUsers.length} thành viên
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN - User Selection (Multi-Channel Mode Only) */}
          {isMultiChannel && type === "private" && (
            <div className="w-1/2 flex flex-col space-y-4 border-l border-gray-700 pl-4 overflow-y-auto">
              <div className="space-y-2">
                <Label className="text-sm text-gray-200 flex items-center justify-between">
                  <span className="font-semibold text-base">👥 Quản lý thành viên</span>
                  {activeChannelFormId && (
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                      {getActiveChannelForm()?.name || 'Chưa đặt tên'}
                    </Badge>
                  )}
                </Label>

                {!activeChannelFormId ? (
                  <div className="p-6 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-lg text-center">
                    <div className="text-4xl mb-3">👈</div>
                    <p className="text-sm text-yellow-400 font-medium mb-2">
                      Vui lòng chọn kênh để chỉnh sửa
                    </p>
                    <p className="text-xs text-gray-400">
                      Click "Chỉnh sửa thành viên" ở kênh bên trái
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Search Users */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm người dùng..."
                        className="pl-9 bg-gray-800 text-black dark:text-white border-gray-600 placeholder:text-gray-400 focus:border-blue-500"
                      />
                      {isSearching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>

                    {/* Search Results */}
                    {searchTerm.trim() && (
                      <div className="h-32">
                        {isSearching ? (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-800 rounded-md border border-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Đang tìm kiếm...
                          </div>
                        ) : getFilteredSearchResults().length > 0 ? (
                          <ScrollArea className="h-full border border-gray-600 rounded-md bg-gray-800">
                            <div className="p-2 space-y-1">
                              {getFilteredSearchResults().map((user) => (
                                <UserListItem
                                  key={user.id}
                                  user={user}
                                  onAdd={() => handleAddUserToChannel(user)}
                                />
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-800 rounded-md border border-gray-600">
                            Không tìm thấy người dùng nào
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Users */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-200">
                        Thành viên đã chọn
                      </Label>

                      {getActiveChannelForm() && getActiveChannelForm()!.users.length > 0 ? (
                        <div className="space-y-2 p-3 bg-gray-800 rounded-md border border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase">
                              Đã chọn {getActiveChannelForm()!.users.length} thành viên
                            </span>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {getActiveChannelForm()!.users.map((user) => (
                              <div key={user.id}>
                                <UserBadge
                                  user={user}
                                  roles={user.roles}
                                  onRemove={() => handleRemoveUserFromChannel(user.id)}
                                  onRoleClick={setEditingUserId}
                                  isPrivate={true}
                                />

                                {/* Role Selection Panel */}
                                {editingUserId === user.id && (
                                  <div className="mt-2 p-3 bg-gray-900 rounded-lg border border-blue-500/50 space-y-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-blue-400 uppercase">
                                        Chọn vai trò cho {user.username}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingUserId(null)}
                                        className="h-5 w-5 p-0 text-gray-400 hover:text-black dark:text-white"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      {ROLES.map((role) => {
                                        const RoleIcon = role.icon;
                                        const isSelected = (user.roles || [0]).includes(role.id);
                                        return (
                                          <button
                                            key={role.id}
                                            onClick={() => handleToggleRoleForChannel(user.id, role.id)}
                                            className={`p-2 rounded-lg border-2 transition-all ${isSelected
                                              ? `${role.bgColor} ${role.borderColor} ${role.color}`
                                              : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-500'
                                              }`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected
                                                ? `${role.borderColor} ${role.bgColor}`
                                                : 'border-gray-600'
                                                }`}>
                                                {isSelected && (
                                                  <svg className={`w-3 h-3 ${role.color}`} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M5 13l4 4L19 7"></path>
                                                  </svg>
                                                )}
                                              </div>
                                              <RoleIcon className="h-4 w-4" />
                                              <span className="text-sm font-medium">{role.name}</span>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                      * Có thể chọn nhiều vai trò. Nếu không chọn, mặc định là Viewer.
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 bg-gray-800/30 border border-gray-600 rounded-lg text-center">
                          <div className="text-3xl mb-2">📝</div>
                          <p className="text-sm text-gray-400">
                            Chưa có thành viên nào
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Tìm kiếm và thêm thành viên bên trên
                          </p>
                          <div className="mt-3 p-2 bg-blue-500/10 rounded border border-blue-500/30">
                            <p className="text-xs text-blue-400">
                              💡 Cần ít nhất 2 thành viên
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-gray-300 hover:text-black dark:text-white hover:bg-gray-700"
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isMultiChannel && type === "private"
                ? (!projectName.trim() || channelForms.some(f => !f.name.trim() || f.users.length < 2))
                : (!channelName.trim() || (type === "private" && (!projectName.trim() || selectedUsers.length < 2)))
            }
            className="bg-blue-600 hover:bg-blue-700 text-black dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSearching
              ? "Đang tạo..."
              : isMultiChannel && type === "private"
                ? `Tạo ${channelForms.length} kênh`
                : "Tạo kênh"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
