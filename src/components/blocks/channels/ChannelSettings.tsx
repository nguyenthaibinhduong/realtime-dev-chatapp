import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  X,
  Users,
  CheckCircle2,
  ChevronsUpDown,
  Crown,
  FileText,
  Bug,
  Code,
  Eye,
  Shield,
  Trash2,
} from "lucide-react";
import AvatarUser from "@/components/common/AvartarUser";
import { useSearchUsers } from "@/hooks/useSearch";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ChatAPI } from "@/api/api";
import { chatSocketService } from "@/services/chatSocketService";
import { useToast } from "@/hooks/useToast";

interface ChannelUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string | number;
  channelName?: string;
  channelData?: any; // Full channel object with owner, json_data, etc.
  onSuccess?: () => void;
}

const ROLES = [
  { id: 1, name: "PM", icon: Crown, color: "text-purple-400", bgColor: "bg-purple-500/20", borderColor: "border-purple-500" },
  { id: 2, name: "BA", icon: FileText, color: "text-blue-400", bgColor: "bg-blue-500/20", borderColor: "border-blue-500" },
  { id: 3, name: "Tester", icon: Bug, color: "text-orange-400", bgColor: "bg-orange-500/20", borderColor: "border-orange-500" },
  { id: 4, name: "Dev", icon: Code, color: "text-green-400", bgColor: "bg-green-500/20", borderColor: "border-green-500" },
  { id: 0, name: "Viewer", icon: Eye, color: "text-black dark:text-white", bgColor: "bg-white/20", borderColor: "border-white" },
];

export const ChannelUpdate: React.FC<ChannelUpdateProps> = ({
  open,
  onOpenChange,
  channelId,
  channelName,
  channelData,
  onSuccess,
}) => {
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<(number | string)[]>([]);
  const [selectedUserRoles, setSelectedUserRoles] = useState<Record<string | number, number[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [editingMemberRoles, setEditingMemberRoles] = useState<Record<string | number, number[]>>({});
  const [manageMembersDialogOpen, setManageMembersDialogOpen] = useState(false);
  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState<string | number | null>(null);
  const [confirmSaveChanges, setConfirmSaveChanges] = useState(false);
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState(false);
  const { toast } = useToast();
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(searchQuery, 10);

  // Check if current user is PM or owner - Memoized
  const isPrivateChannel = useMemo(() =>
    channelData?.type === "group-private",
    [channelData?.type]
  );

  // In the data structure, owner is the member who created the channel
  // They may or may not be in userRoles array
  const isOwner = useMemo(() => {
    if (!isPrivateChannel || !currentUser?.id || !channelData?.members) return false;

    // Check if there's an explicit owner field
    if (channelData.owner?.id) {
      return channelData.owner.id === currentUser.id;
    }

    // Otherwise, assume the first member or the one not in userRoles is the owner
    // This is a fallback - adjust based on your actual backend logic
    const userRoleIds = channelData.json_data?.userRoles?.map((ur: any) => ur.userId) || [];
    const isMember = channelData.members.some((m: any) => m.id === currentUser.id);

    // If user is member but not in userRoles, they might be the owner
    return isMember && !userRoleIds.includes(currentUser.id);
  }, [isPrivateChannel, channelData, currentUser?.id]);

  const currentUserRoles = useMemo(() => {
    if (!isPrivateChannel || !currentUser?.id) return [];

    const userRole = channelData?.json_data?.userRoles?.find((ur: any) => ur.userId === currentUser.id);
    return userRole?.roles || [];
  }, [isPrivateChannel, channelData?.json_data?.userRoles, currentUser?.id]);

  const isPM = useMemo(() =>
    currentUserRoles.includes(1),
    [currentUserRoles]
  );

  const isAdmin = useMemo(() =>
    currentUser.role.includes("admin"),
    [currentUser.role]
  );

  const canManageMembers = useMemo(() =>
    isOwner || isPM || isAdmin,
    [isOwner, isPM, isAdmin]
  );

  // console.log('Channel Data:', channelData);
  // console.log('Current User ID:', currentUser?.id);
  // console.log('Current User Roles:', currentUserRoles);
  // console.log('Is PM:', isPM);
  // console.log('Is Owner:', isOwner);
  console.log('Is Admin:', isAdmin);
  console.log('Can Manage Members:', canManageMembers);

  // Listen to channel updates via socket


  // Filter out users who are already members of the channel
  const filteredUsers = useMemo(
    () =>
      (searchResults || []).filter(
        (u: any) => !channelData?.members?.some((m: any) => m.id === u.id)
      ),
    [searchResults, channelData?.members]
  );

  const handleToggleUser = (userId: string | number) => {
    setSelectedUserIds((prev) => {
      const newIds = prev.includes(userId)
        ? prev.filter((id) => String(id) !== String(userId))
        : [...prev, userId];

      // If adding user and it's a private channel, initialize with Viewer role
      if (!prev.includes(userId) && isPrivateChannel) {
        setSelectedUserRoles(prevRoles => ({
          ...prevRoles,
          [userId]: [0] // Default to Viewer
        }));
      } else if (prev.includes(userId)) {
        // If removing user, remove their roles
        setSelectedUserRoles(prevRoles => {
          const { [userId]: removed, ...rest } = prevRoles;
          return rest;
        });
      }

      return newIds;
    });
  };

  const handleToggleRole = (userId: string | number, roleId: number) => {
    setSelectedUserRoles(prev => {
      const currentRoles = prev[userId] || [0];
      let newRoles: number[];

      if (currentRoles.includes(roleId)) {
        // Remove role
        newRoles = currentRoles.filter(r => r !== roleId);
        // If no roles left, default to Viewer
        if (newRoles.length === 0) {
          newRoles = [0];
        }
      } else {
        // Add role and remove Viewer if adding other roles
        newRoles = [...currentRoles.filter(r => r !== 0), roleId];
      }

      return {
        ...prev,
        [userId]: newRoles
      };
    });
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((user) => user.id));
    }
  };

  // Helper function to update channel with members
  const updateChannelMembers = useCallback(async (
    updatedMembers: any[],
    addUserIds: (number | string)[] = [],
    removeUserIds: (number | string)[] = [],
    updatedUserRoles?: any[],
    notificationText?: string,
    isActive?: boolean
  ) => {
    const updatedMemberIds = updatedMembers.map((m: any) => m.id);

    const updateData: any = isActive !== undefined ? { channel_id: channelId, isActive } : {
      channel_id: channelId,
      members: updatedMembers,
      memberIds: updatedMemberIds,
      addUserIds,
      removeUserIds,
      ...channelData
    };

    // Add role data for private channels
    if (isPrivateChannel && updatedUserRoles) {
      updateData.json_data = {
        ...channelData.json_data,
        userRoles: updatedUserRoles
      };
    }

    const result = await ChatAPI.updateChannel(updateData);
    console.log('✅ Update channel response:', result);
    if (result && result.data) {

      // Only emit socket event after successful API call
      chatSocketService.updateChannelSent({
        channelId,
        removeUserIds,
        addUserIds,
        currenetUserIds: updatedMemberIds,
      });

      if (notificationText) {
        chatSocketService.sendMessage({
          channelId: channelId,
          text: notificationText,
          type: 'notification',
        });
      }



      toast({
        title: "Cập nhật kênh thành công",
        description: `Cập nhật kênh thành công`,
      });

      onSuccess?.();
    } else {
      toast({
        title: "Cập nhật kênh thất bại",
        description: `${result?.message || 'Đã xảy ra lỗi khi cập nhật kênh'}`,
      });
    }
  }, [channelId, channelData, isPrivateChannel, onSuccess]);

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return;

    setIsSubmitting(true);
    try {
      // Get new member objects
      const newMembers = selectedUserIds
        .map(userId => filteredUsers.find((u: any) => u.id === userId))
        .filter(Boolean);

      const currentMembers = channelData.members || [];
      const updatedMembers = [...currentMembers, ...newMembers];

      // Prepare role data for private channels
      let updatedUserRoles;
      if (isPrivateChannel) {
        const membersWithRoles = selectedUserIds.map(userId => {
          const user = filteredUsers.find((u: any) => u.id === userId);
          const roles = selectedUserRoles[userId] || [0];
          return {
            userId,
            username: user?.username,
            roles,
            roleNames: roles.map(roleId => ROLES.find(r => r.id === roleId)?.name).filter(Boolean)
          };
        });

        const existingUserRoles = channelData?.json_data?.userRoles || [];
        updatedUserRoles = [...existingUserRoles, ...membersWithRoles];
      }

      // Create notification text with member names and roles
      const memberNames = newMembers.map((m: any) => {
        if (isPrivateChannel) {
          const roles = selectedUserRoles[m.id] || [0];
          const roleNames = roles.map(roleId => ROLES.find(r => r.id === roleId)?.name).filter(Boolean).join(', ');
          return `${m.username} (${roleNames})`;
        }
        return m.username;
      }).join(', ');

      const adderRole = isAdmin ? 'Admin' : isOwner ? 'Owner' : 'PM';
      const notificationText = isPrivateChannel
        ? `${adderRole} đã thêm thành viên mới: ${memberNames}`
        : `Đã thêm thành viên mới: ${memberNames}`;

      await updateChannelMembers(updatedMembers, selectedUserIds, [], updatedUserRoles, notificationText);

      // Reset state
      setSelectedUserIds([]);
      setSelectedUserRoles({});
      setSearchQuery("");
      setAddMemberDialogOpen(false);
      onOpenChange(false);
    } catch (error: any) {
      console.error('❌ Error adding members:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMemberRole = (userId: string | number, roleId: number) => {
    setEditingMemberRoles(prev => {
      const currentRoles = prev[userId] || [];
      let newRoles: number[];

      if (currentRoles.includes(roleId)) {
        newRoles = currentRoles.filter(r => r !== roleId);
        if (newRoles.length === 0) {
          newRoles = [0];
        }
      } else {
        newRoles = [...currentRoles.filter(r => r !== 0), roleId];
      }

      return {
        ...prev,
        [userId]: newRoles
      };
    });
  };

  const handleRemoveMember = async (userId: string | number) => {
    // Check if channel has minimum 3 members
    const currentMemberCount = channelData.members?.length || 0;
    if (currentMemberCount <= 3) {
      alert('Không thể xóa thành viên vì nhóm cần tối thiểu 3 thành viên');
      setConfirmRemoveUserId(null);
      return;
    }

    setIsSubmitting(true);
    try {
      // Get remaining members
      const remainingMembers = channelData.members?.filter((m: any) => String(m.id) !== String(userId)) || [];

      // Prepare updated user roles for private channels
      let updatedUserRoles;
      if (isPrivateChannel) {
        updatedUserRoles = Object.entries(editingMemberRoles)
          .filter(([userIdStr]: any) => String(userIdStr) !== String(userId))
          .map(([userIdStr, roles]) => {
            const uid = userIdStr; // ✅ Giữ nguyên (có thể là encrypted ID hoặc number)
            const member = channelData.members?.find((m: any) => String(m.id) === String(uid));
            return {
              userId: uid,
              username: member?.username,
              roles,
              roleNames: roles.map(roleId => ROLES.find(r => r.id === roleId)?.name).filter(Boolean)
            };
          })
          .filter(ur => ur.userId); // ✅ Chỉ loại bỏ null/undefined
      }

      // Create notification text with removed member name
      const removedMember = channelData.members?.find((m: any) => String(m.id) === String(userId));
      const removerRole = isAdmin ? 'Admin' : isOwner ? 'Owner' : 'PM';
      const notificationText = removedMember
        ? (isPrivateChannel ? `${removerRole} đã xóa thành viên: ${removedMember.username}` : `Đã xóa thành viên: ${removedMember.username}`)
        : (isPrivateChannel ? `${removerRole} đã xóa một thành viên` : 'Đã xóa một thành viên');

      await updateChannelMembers(remainingMembers, [], [userId], updatedUserRoles, notificationText);

      // Update local state
      setEditingMemberRoles(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

      setConfirmRemoveUserId(null);
    } catch (error: any) {
      console.error('❌ Error removing member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveMemberRoles = async () => {
    setIsSubmitting(true);
    try {
      // Prepare updated user roles
      const updatedUserRoles = Object.entries(editingMemberRoles)
        .map(([userIdStr, roles]) => {
          const userId = userIdStr; // ✅ Giữ nguyên (encrypted ID hoặc number)
          const member = channelData.members?.find((m: any) => String(m.id) === String(userId));
          return {
            userId,
            username: member?.username,
            roles,
            roleNames: roles.map(roleId => ROLES.find(r => r.id === roleId)?.name).filter(Boolean)
          };
        })
        .filter(ur => ur.userId); // ✅ Chỉ loại bỏ null/undefined

      console.log('🔍 handleSaveMemberRoles - User Roles:', updatedUserRoles);

      const currentMembers = channelData.members || [];

      // Create notification text with updated member names and roles (only for private channels)
      let notificationText: string | undefined;
      if (isPrivateChannel) {
        const updaterRole = isAdmin ? 'Admin' : isOwner ? 'Owner' : 'PM';
        const updatedMemberDetails = updatedUserRoles.map(ur => {
          const roleNames = ur.roleNames.join(', ');
          return `${ur.username} (${roleNames})`;
        }).join(', ');
        notificationText = `${updaterRole} đã cập nhật quyền cho: ${updatedMemberDetails}`;
      }

      await updateChannelMembers(currentMembers, [], [], updatedUserRoles, notificationText);

      // Reset state
      setManageMembersDialogOpen(false);
      setEditingMemberRoles({});
      setConfirmSaveChanges(false);
    } catch (error: any) {
      console.error('❌ Error updating member roles:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openManageMembersDialog = () => {
    // Initialize editing state with current member roles
    const initialRoles: Record<string | number, number[]> = {};
    channelData?.json_data?.userRoles?.forEach((ur: any) => {
      initialRoles[ur.userId] = ur.roles || [0];
    });
    setEditingMemberRoles(initialRoles);
    setManageMembersDialogOpen(true);
  };

  const handleDeleteChannel = async () => {
    setIsSubmitting(true);
    try {
      // Get all current member IDs
      const allMemberIds = channelData.members?.map((m: any) => m.id) || [];

      await updateChannelMembers([], [], allMemberIds, undefined, 'Kênh chat đã ngừng hoạt động', false);

      toast({
        title: "Xóa kênh thành công",
        description: `Kênh ${channelName} đã ngừng hoạt động`,
      });

      setConfirmDeleteChannel(false);
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Error deleting channel:', error);
      toast({
        title: "Xóa kênh thất bại",
        description: error?.message || 'Đã xảy ra lỗi khi xóa kênh',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Permission Info for Private Channels */}
      {isPrivateChannel && (
        <div className={`p-3 rounded-lg border ${canManageMembers ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <div className="flex items-center gap-2">
            <Shield className={`h-4 w-4 ${canManageMembers ? 'text-green-400' : 'text-yellow-400'}`} />
            <div className="flex-1">
              <p className={`text-sm ${canManageMembers ? 'text-green-400' : 'text-yellow-400'}`}>
                {canManageMembers
                  ? `Bạn có quyền quản lý (${isAdmin ? 'Admin' : isOwner ? 'Owner' : 'PM'})`
                  : 'Chỉ Admin, PM hoặc Owner mới có thể thêm thành viên và phân quyền'
                }
              </p>
              {channelData?.owner && (
                <p className="text-xs text-zinc-400 mt-1">
                  Owner: {channelData.owner.username}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Buttons to open dialogs */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300">
          Quản lý thành viên kênh
        </Label>

        {/* Manage Current Members (Private Channel Only) */}
        {isPrivateChannel && (
          <Button
            variant="outline"
            onClick={openManageMembersDialog}
            disabled={!canManageMembers}
            className="w-full justify-between bg-zinc-50 dark:bg-zinc-900 border-zinc-800 text-black dark:text-white hover:bg-zinc-100  hover:text-black disabled:opacity-50 disabled:cursor-not-allowed mb-2"
          >
            <span className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-400" />
              Quản lý quyền thành viên
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}

        {/* Add New Members */}
        <Button
          variant="outline"
          onClick={() => setAddMemberDialogOpen(true)}
          disabled={isPrivateChannel && !canManageMembers}
          className="w-full justify-between bg-zinc-50 dark:bg-zinc-900 border-zinc-800 text-black dark:text-white hover:bg-zinc-100  hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            Thêm thành viên mới
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {/* Delete Channel - Only for Admin or Owner */}
        {(isAdmin || isOwner) && (
          <Button
            variant="outline"
            onClick={() => setConfirmDeleteChannel(true)}
            className="w-full justify-between bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300 mt-4"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Giải tán kênh
            </span>
          </Button>
        )}
      </div>

      {/* Manage Current Members Dialog (Private Channel Only) */}
      {isPrivateChannel && (
        <Dialog open={manageMembersDialogOpen} onOpenChange={setManageMembersDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] bg-zinc-50 dark:bg-zinc-900 border-zinc-800 text-black dark:text-white flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Quản lý quyền thành viên
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Xem và chỉnh sửa quyền của các thành viên hiện tại trong kênh {channelName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto">
              {channelData?.members && (
                <>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm text-blue-400 font-medium">Nhóm trưởng của kênh</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {channelData.members.find((m: any) =>
                            !channelData.json_data?.userRoles?.some((ur: any) => ur.userId === m.id)
                          )?.username || 'Không xác định'} là nhóm trưởng và có toàn quyền quản lý kênh


                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Show Admin Badge if current user is admin */}
                  {isAdmin && (
                    <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-400" />
                        <div>
                          <p className="text-sm text-purple-400 font-medium">Bạn là Admin hệ thống</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Có toàn quyền quản lý thành viên và phân quyền trong mọi kênh
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
              <div className="p-2 space-y-3">
                {channelData?.json_data?.userRoles?.map((userRole: any) => {
                  const member = channelData.members?.find((m: any) => m.id === userRole.userId);
                  if (!member) return null;

                  const memberRoles = editingMemberRoles[userRole.userId] || userRole.roles || [0];

                  return (
                    <div key={userRole.userId} className="space-y-2">
                      <div className="flex items-center gap-3 p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <AvatarUser user={member} size={10} />
                        <div className="flex-1">
                          <p className="font-medium text-black dark:text-white">{member.username}</p>
                          <p className="text-xs text-zinc-400">{member.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-red-600/20 text-red-400"
                          onClick={() => setConfirmRemoveUserId(userRole.userId)}
                          title="Xóa thành viên khỏi kênh"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="ml-3 p-3 bg-zinc-100 dark:bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                        <Label className="text-xs text-zinc-400 mb-2 block">
                          Quyền hiện tại
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {ROLES.map((role) => {
                            const RoleIcon = role.icon;
                            const hasRole = memberRoles.includes(role.id);

                            return (
                              <Badge
                                key={role.id}
                                variant="outline"
                                className={cn(
                                  "cursor-pointer transition-all",
                                  hasRole
                                    ? `${role.bgColor} ${role.borderColor} ${role.color}`
                                    : "bg-zinc-100  border-zinc-700 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-700"
                                )}
                                onClick={() => handleToggleMemberRole(userRole.userId, role.id)}
                              >
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {role.name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show Owner/Admin Info */}

              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setManageMembersDialogOpen(false)}
                disabled={isSubmitting}
                className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800 hover:text-black dark:text-white"
              >
                Hủy
              </Button>
              <Button
                onClick={() => setConfirmSaveChanges(true)}
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirm Remove Member Dialog */}
      <AlertDialog open={confirmRemoveUserId !== null} onOpenChange={(open) => !open && setConfirmRemoveUserId(null)}>
        <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-900 border-zinc-800 text-black dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <X className="h-5 w-5" />
              Xóa thành viên khỏi kênh
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Bạn có chắc chắn muốn xóa thành viên này khỏi kênh không?
              Hành động này sẽ được thực hiện ngay lập tức và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmRemoveUserId(null)}
              className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800 hover:text-black dark:text-white"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemoveUserId && handleRemoveMember(confirmRemoveUserId)}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-black dark:text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa thành viên'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Save Changes Dialog */}
      <AlertDialog open={confirmSaveChanges} onOpenChange={setConfirmSaveChanges}>
        <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-900 border-zinc-800 text-black dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-purple-400">
              <Shield className="h-5 w-5" />
              Xác nhận cập nhật quyền
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Bạn có chắc chắn muốn lưu các thay đổi quyền cho thành viên không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmSaveChanges(false)}
              className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800 hover:text-black dark:text-white"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveMemberRoles}
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-black dark:text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Xác nhận'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Channel Dialog */}
      <AlertDialog open={confirmDeleteChannel} onOpenChange={setConfirmDeleteChannel}>
        <AlertDialogContent className="bg-zinc-50 dark:bg-zinc-900 border-zinc-800 text-black dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Giải tán kênh {channelName}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              <p className="mb-2">Bạn có chắc chắn muốn giải tán kênh này không?</p>
              <p className="font-semibold text-red-400">
                ⚠️ Hành động này sẽ ngừng hoạt động kênh và thông báo cho tất cả thành viên.
                Kênh sẽ không thể sử dụng được nữa.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmDeleteChannel(false)}
              disabled={isSubmitting}
              className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800 hover:text-black dark:text-white"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChannel}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Giải tán kênh
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add member Dialog */}
      <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] bg-zinc-50 dark:bg-zinc-900 border-zinc-800 text-black dark:text-white flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              Chọn người dùng để thêm vào kênh
              {isPrivateChannel && (
                <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-400">
                  <Shield className="h-3 w-3 mr-1" />
                  Kênh dự án
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {isPrivateChannel
                ? `Tìm kiếm và chọn người dùng để thêm vào kênh ${channelName}. Phân quyền cho từng thành viên.`
                : `Tìm kiếm và chọn người dùng để thêm vào kênh ${channelName}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Search Input - Fixed */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-100 dark:bg-zinc-800 border-zinc-700 text-black dark:text-white placeholder:text-zinc-500 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
              <span className="text-sm text-zinc-400">
                {filteredUsers.length} người dùng
              </span>
              {filteredUsers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs text-zinc-400 hover:text-black dark:text-white hover:bg-zinc-100 dark:bg-zinc-800"
                >
                  {selectedUserIds.length === filteredUsers.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
              )}
            </div>

            {/* Users List */}
            <div className="h-[300px] overflow-y-auto">
              {isSearching ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-sm text-zinc-400">Đang tìm kiếm...</p>
                </div>
              ) : !searchQuery.trim() ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                    <Search className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-300 mb-1">
                    Tìm kiếm người dùng
                  </p>
                  <p className="text-xs text-zinc-500">
                    Nhập tên hoặc email để tìm kiếm
                  </p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-zinc-400" />
                  </div>
                  <p className="text-sm font-medium text-zinc-300 mb-1">
                    Không tìm thấy người dùng
                  </p>
                  <p className="text-xs text-zinc-500">
                    {searchQuery
                      ? "Thử tìm kiếm với từ khóa khác"
                      : "Tất cả người dùng đã là thành viên"}
                  </p>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    const userRoles = selectedUserRoles[user.id] || [0];

                    return (
                      <div key={user.id} className="space-y-2">
                        <div
                          onClick={() => handleToggleUser(user.id)}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200",
                            isSelected
                              ? "bg-blue-900/30 border border-blue-800/50"
                              : "hover:bg-zinc-100 dark:bg-zinc-800 border border-transparent"
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleUser(user.id)}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <AvatarUser user={user} size={8} />
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                "font-medium truncate text-sm",
                                isSelected ? "text-blue-300" : "text-black dark:text-white"
                              )}
                            >
                              {user.username}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          )}
                        </div>

                        {/* Role Selection for Private Channels */}
                        {isSelected && isPrivateChannel && (
                          <div className="ml-11 p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <Label className="text-xs text-zinc-400 mb-2 block">
                              Phân quyền cho {user.username}
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {ROLES.map((role) => {
                                const RoleIcon = role.icon;
                                const hasRole = userRoles.includes(role.id);

                                return (
                                  <Badge
                                    key={role.id}
                                    variant="outline"
                                    className={cn(
                                      "cursor-pointer transition-all",
                                      hasRole
                                        ? `${role.bgColor} ${role.borderColor} ${role.color}`
                                        : "bg-zinc-100 border-zinc-700 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-700"
                                    )}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleRole(user.id, role.id);
                                    }}
                                  >
                                    <RoleIcon className="h-3 w-3 mr-1" />
                                    {role.name}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddMemberDialogOpen(false)}
              disabled={isSubmitting}
              className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800 hover:text-black dark:text-white"
            >
              Hủy
            </Button>
            <Button
              onClick={handleAddMembers}
              disabled={selectedUserIds.length === 0 || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang thêm...
                </>
              ) : (
                `Thêm ${selectedUserIds.length} người`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelUpdate;
