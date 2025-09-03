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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Globe,
  Lock,
  Search,
  X,
  User,
} from "lucide-react";
import {
  useCreatePublicChannel,
  useCreatePrivateChannel,
} from "@/hooks/useChannel";
import { useSearchUsers } from "@/hooks/useSearch";
import { useToast } from "@/hooks/useToast";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  id: number;
  username: string;
  email: string;
}

interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  type: "public" | "private";
  onSuccess?: () => void; // Thêm callback success
}

export function ChannelDialog({
  open,
  onOpenChange,
  type,
  onSuccess, // Nhận callback
}: ChannelDialogProps) {
  const [channelName, setChannelName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const { toast } = useToast();

  // Hooks for creating channels
  const {
    createGroupChat,
    isPending: isCreatingPublic,
    error: publicError,
  } = useCreatePublicChannel();

  const {
    createPrivateChannel,
    isPending: isCreatingPrivate,
    error: privateError,
  } = useCreatePrivateChannel();

  // Search users hook
  const { data: searchResults, isLoading: isSearching } = useSearchUsers(
    searchTerm,
    10
  );

  const isLoading = isCreatingPublic || isCreatingPrivate;
  const error = publicError || privateError;

  // Reset form khi dialog mở/đóng
  useEffect(() => {
    if (!open) {
      setChannelName("");
      setSearchTerm("");
      setSelectedUsers([]);
    }
  }, [open]);

  const handleAddUser = (user: User) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
      setSearchTerm("");
    }
  };

  const handleRemoveUser = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId));
  };

  const handleCreate = async () => {
    if (!channelName.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập tên kênh",
        variant: "destructive",
      });
      return;
    }

    try {
      const userIds = selectedUsers.map((user) => user.id);

      if (type === "public") {
        await createGroupChat(userIds, channelName.trim());
      } else {
        if (selectedUsers.length === 0) {
          toast({
            title: "Lỗi",
            description:
              "Vui lòng chọn ít nhất một thành viên cho kênh riêng tư",
            variant: "destructive",
          });
          return;
        }

        await createPrivateChannel(userIds, channelName.trim());
      }

      // Thành công
      toast({
        title: "Thành công",
        description: `Tạo kênh ${type === "public" ? "công khai" : "riêng tư"
          } thành công`,
        variant: "default",
      });

      // Đóng dialog
      onOpenChange(false);

      // Gọi callback để refetch channels
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast({
        title: "Lỗi",
        description: err?.message || "Có lỗi xảy ra khi tạo kênh",
        variant: "destructive",
      });
    }
  };

  // Filter out already selected users from search results
  const filteredSearchResults =
    searchResults?.filter(
      (user) => !selectedUsers.find((selected) => selected.id === user.id)
    ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 text-white border border-gray-700 w-full max-w-lg h-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            {type === "public" ? (
              <>
                <Globe className="h-5 w-5 text-blue-500" />
                Tạo kênh công khai
              </>
            ) : (
              <>
                <Lock className="h-5 w-5 text-red-500" />
                Tạo kênh riêng tư
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Channel Name Input */}
          <div className="space-y-2 mx-1">
            <Label
              htmlFor="channelName"
              className="text-sm font-medium text-gray-200"
            >
              Tên kênh
            </Label>
            <Input
              id="channelName"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder={`Nhập tên kênh ${type === "public" ? "công khai" : "riêng tư"
                }`}
              className="bg-gray-800 text-white border-gray-600 placeholder:text-gray-400 focus:border-blue-500"
              disabled={isLoading}
            />
          </div>

          {/* User Search and Selection */}
          <div className="space-y-2 mx-1">
            <Label className="text-sm font-medium text-gray-200">
              {type === "private"
                ? "Thành viên (bắt buộc)"
                : "Thành viên (tùy chọn)"}
            </Label>

            {/* Selected Users - Fixed Height */}
            <div className="min-h-[40px] mx-1">
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-1 p-2 bg-gray-800 rounded-md border border-gray-600">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
                    >
                      <User className="h-3 w-3" />
                      {user.username}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-4 w-4 p-0 hover:bg-blue-800"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* User Search Input */}
            <div className="relative mx-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm người dùng để thêm..."
                className="pl-9 bg-gray-800 text-white border-gray-600 placeholder:text-gray-400 focus:border-blue-500"
                disabled={isLoading}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>

            {/* Search Results - Fixed Height Container */}
            <div className="h-32 mx-1">
              {searchTerm.trim() && (
                <>
                  {filteredSearchResults.length > 0 && (
                    <ScrollArea className="h-full border border-gray-600 rounded-md bg-gray-800">
                      <div className="p-2 space-y-1">
                        {filteredSearchResults.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer"
                            onClick={() => handleAddUser(user)}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {user.username}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {user.email}
                                </p>
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
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {!isSearching && filteredSearchResults.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-800 rounded-md border border-gray-600">
                      Không tìm thấy người dùng nào
                    </div>
                  )}

                  {isSearching && (
                    <div className="h-full flex items-center justify-center text-gray-400 text-sm bg-gray-800 rounded-md border border-gray-600">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang tìm kiếm...
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Channel Type Info */}
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-600 mx-2">
            <div className="flex items-start gap-2">
              {type === "public" ? (
                <Globe className="h-4 w-4 text-blue-500 mt-0.5" />
              ) : (
                <Lock className="h-4 w-4 text-red-500 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-200">
                  {type === "public" ? "Kênh công khai" : "Kênh riêng tư"}
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

          {/* Error Alert */}
          {error && (
            <Alert
              variant="destructive"
              className="bg-red-900/20 border-red-800"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error?.message || "Có lỗi xảy ra khi tạo kênh"}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Fixed Footer */}
        <DialogFooter className="flex-shrink-0 flex gap-2 pt-4 border-t border-gray-700">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              isLoading ||
              !channelName.trim() ||
              (type === "private" && selectedUsers.length === 0)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isLoading ? "Đang tạo..." : "Tạo kênh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
