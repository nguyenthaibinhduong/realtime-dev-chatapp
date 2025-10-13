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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  UserPlus,
  Search,
  Loader2,
  X,
  Users,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { useChannel } from "@/hooks/useChannel";
import AvatarUser from "@/components/common/AvartarUser";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { se } from "date-fns/locale";

interface ChannelUpdateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string | number;
  channelName?: string;
  onSuccess?: () => void;
}

export const ChannelUpdate: React.FC<ChannelUpdateProps> = ({
  open,
  onOpenChange,
  channelId,
  channelName,
  onSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const {
    users,
    filters,
    loading,
    error,
    hasMore,
    fetchNonMembers,
    loadMore,
    setFilters,
    addMembers,
  } = useChannel(channelId);

  // Fetch non-members when dialog opens
  useEffect(() => {
    if (open && channelId) {
      fetchNonMembers(true);
    }
  }, [open, channelId]);

  // Apply search filter with debounce
  useEffect(() => {
    if (!open) return;
    const timeoutId = setTimeout(() => {
      setFilters({ username: searchQuery });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, open]);

  useEffect(() => {
    if (!open) return;
    fetchNonMembers(true);
  }, [filters, open]);

  // Filter users based on search query (client-side additional filter)
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const handleToggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((user) => user.id));
    }
  };

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const success = await addMembers(channelId, selectedUserIds);
      if (success) {
        setSelectedUserIds([]);
        setSearchQuery("");
        setDialogOpen(false);
        onOpenChange(false);
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedUserIds([]);
      setSearchQuery("");
      setDialogOpen(false);
      onOpenChange(false);
    }
  };

  const selectedUsers = useMemo(() => {
    return users.filter((user) => selectedUserIds.includes(user.id));
  }, [users, selectedUserIds]);

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMore();
    }
  };

  return (
    <div className="space-y-4 py-4">
      {/* Button to open dialog */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-300">
          Chọn người dùng
        </Label>
        <Button
          variant="outline"
          onClick={() => setDialogOpen(true)}
          className="w-full justify-between bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white"
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-400" />
            {selectedUserIds.length > 0
              ? `Đã chọn ${selectedUserIds.length} người`
              : "Chọn người dùng..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </div>

      {/* User Selection Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Chọn người dùng để thêm vào kênh
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Tìm kiếm và chọn người dùng để thêm vào kênh {channelName}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm theo tên hoặc email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
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
            <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50 rounded-lg">
              <span className="text-sm text-zinc-400">
                {filteredUsers.length} người dùng
              </span>
              {filteredUsers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  {selectedUserIds.length === filteredUsers.length
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </Button>
              )}
            </div>

            {/* Users List */}
            <ScrollArea className="h-[400px]">
              {loading && users.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                  <p className="text-sm text-zinc-400">Đang tải...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-3">
                    <X className="h-6 w-6 text-red-400" />
                  </div>
                  <p className="text-sm font-medium text-red-400 mb-1">
                    Không thể tải danh sách
                  </p>
                  <p className="text-xs text-zinc-500">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNonMembers(true)}
                    className="mt-4 border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    Thử lại
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
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
                <div className="p-2 space-y-1">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedUserIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        onClick={() => handleToggleUser(user.id)}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200",
                          isSelected
                            ? "bg-blue-900/30 border border-blue-800/50"
                            : "hover:bg-zinc-800 border border-transparent"
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
                              isSelected ? "text-blue-300" : "text-white"
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
                    );
                  })}

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="flex justify-center pt-3 pb-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang tải thêm...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="mr-2 h-4 w-4" />
                            Xem thêm
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
              className="border-zinc-700 text-white hover:bg-zinc-800"
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

      {/* Selected Users Display */}
      {selectedUserIds.length > 0 && (
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                Đã chọn {selectedUserIds.length} người
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUserIds([])}
              className="h-7 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
            >
              Xóa tất cả
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge
                key={user.id}
                className="bg-blue-900/40 text-blue-300 border-blue-800/50 pl-1 pr-2 py-1 gap-1.5"
              >
                <AvatarUser user={user} size={5} />
                {user.username}
                <button
                  onClick={() => handleToggleUser(user.id)}
                  className="ml-1 hover:text-blue-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelUpdate;
