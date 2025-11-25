import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Filter, User, Users, Lock, Globe } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchChats } from "@/hooks/useSearch";

interface Channel {
  id: number;
  name: string;
  description?: string;
  type: "personal" | "group" | "group-private";
  member_count?: number;
}

interface UserType {
  id: number;
  username: string;
  email: string;
}

interface ChannelSearchProps {
  onJoinChannel?: (id: string, type: string) => void;
  onSelectChannel?: (channel: Channel) => void;
  isShare?: boolean; // Thêm prop này
}

type FilterType = "personal" | "group" | "group-private";

export function ChannelSearch({
  onJoinChannel,
  onSelectChannel,
  isShare = false, // Mặc định là false
}: ChannelSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null); // Chỉ chọn 1 kênh khi share

  const { data: searchData, isLoading } = useSearchChats(
    searchTerm,
    10,
    selectedFilter || ""
  );

  const filteredResults = useMemo(() => {
    if (!searchData) {
      return {
        users: [],
        personalChats: [],
        groupChats: [],
        privateChats: [],
      };
    }

    const users = searchData.users || [];
    const personalChats = searchData.channels?.personal || [];
    const groupChats = searchData.channels?.group || [];
    const privateChats = searchData.channels?.private || [];

    switch (selectedFilter) {
      case "personal":
        return { users, personalChats, groupChats: [], privateChats: [] };
      case "group":
        return { users: [], personalChats: [], groupChats, privateChats: [] };
      case "group-private":
        return { users: [], personalChats: [], groupChats: [], privateChats };
      default:
        return { users, personalChats, groupChats, privateChats };
    }
  }, [searchData, selectedFilter]);

  const hasResults =
    filteredResults.users.length > 0 ||
    filteredResults.personalChats.length > 0 ||
    filteredResults.groupChats.length > 0 ||
    filteredResults.privateChats.length > 0;

  const handleChannelClick = (channel: Channel) => {
    if (isShare) {
      setSelectedChannelId(channel.id);
      onSelectChannel?.(channel);
    } else {
      onSelectChannel?.(channel);
    }
  };

  const handleJoinChannel = async (id: string, type: string) => {
    await onJoinChannel?.(id, type);
  };

  const handleUserClick = (user: UserType) => {
    const personalChannel: Channel = {
      id: user.id,
      name: user.username,
      type: "personal",
    };
    onSelectChannel?.(personalChannel);
  };

  const filterOptions = [
    { value: null as FilterType, label: "Tất cả" },
    { value: "personal" as FilterType, label: "Cá nhân" },
    { value: "group" as FilterType, label: "Nhóm" },
    { value: "group-private" as FilterType, label: "dự án" },
  ];

  return (
    <div className="p-3">
      {/* Search Input */}
      <form
        className="relative mb-3 flex items-center"
        onSubmit={(e) => e.preventDefault()}
        autoComplete="off"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm kênh, người dùng..."
          className="pl-10 pr-10 bg-[#222] border-none text-black dark:text-white placeholder:text-black dark:text-white/60 rounded-lg shadow"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-primary" />
        )}
      </form>

      {/* Filter Options */}
      <div className="mb-3">
        {/* <div className="flex items-center gap-1 mb-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Lọc theo loại:</span>
        </div> */}
        <div className="flex gap-1 flex-wrap">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={selectedFilter === option.value ? "default" : "ghost"}
              className={`h-7 px-3 text-xs rounded-full ${selectedFilter === option.value
                ? "bg-primary text-black dark:text-white"
                : "text-black dark:text-white/80 hover:text-black dark:text-white hover:bg-white/10"
                }`}
              onClick={() => setSelectedFilter(option.value)}
              type="button"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="mt-3 space-y-4 max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <span className="text-sm text-muted-foreground">Đang tìm kiếm...</span>
          </div>
        )}

        {!isLoading && searchTerm.trim() && !hasResults && (
          <div className="flex flex-col items-center justify-center py-8">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">
              Không tìm thấy kết quả phù hợp.
            </span>
          </div>
        )}

        {/* Users */}
        {!isLoading && filteredResults.users.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              Người dùng
            </div>
            <div className="space-y-2">
              {filteredResults.users.map((user: any) => (
                <div
                  key={`user-${user.id}`}
                  className="flex items-center justify-between px-3 py-2 bg-[#23272f] rounded-lg hover:bg-[#2a2e38] cursor-pointer transition"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-400" />
                    <span className="font-medium text-black dark:text-white">{user.username}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {user.email}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-3 text-xs text-black dark:text-white hover:text-black dark:text-white hover:bg-white/10 rounded-full"
                    onClick={() => handleJoinChannel(user?.id, 'personal')}
                  >
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Chats */}
        {!isLoading && filteredResults.personalChats.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              Tin nhắn trực tiếp
            </div>
            <div className="space-y-2">
              {filteredResults.personalChats.map((channel) => (
                <div
                  key={`personal-${channel.id}`}
                  className={`flex items-center px-3 py-2 bg-[#23272f] rounded-lg hover:bg-[#2a2e38] cursor-pointer transition
                    ${isShare && selectedChannelId === channel.id ? "bg-white text-black" : ""}
                  `}
                  onClick={() => handleChannelClick(channel)}
                >
                  <User className={`h-5 w-5 ${isShare && selectedChannelId === channel.id ? "text-black" : "text-green-400"} mr-2`} />
                  <span className={`font-medium ${isShare && selectedChannelId === channel.id ? "text-black" : "text-black dark:text-white"}`}>{channel.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group Chats */}
        {!isLoading && filteredResults.groupChats.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              Nhóm chat
            </div>
            <div className="space-y-2">
              {filteredResults.groupChats.map((channel) => (
                <div
                  key={`group-${channel.id}`}
                  className={`flex items-center justify-between px-3 py-2 bg-[#23272f] rounded-lg hover:bg-[#2a2e38] cursor-pointer transition
                    ${isShare && selectedChannelId === channel.id ? "bg-white text-black" : ""}
                  `}
                  onClick={() => handleChannelClick(channel)}
                >
                  <div className="flex items-center gap-2">
                    <Globe className={`h-5 w-5 ${isShare && selectedChannelId === channel.id ? "text-black" : "text-blue-400"}`} />
                    <span className={`font-medium ${isShare && selectedChannelId === channel.id ? "text-black" : "text-black dark:text-white"}`}>{channel.name}</span>
                    {channel.member_count && (
                      <span className={`text-xs ml-2 ${isShare && selectedChannelId === channel.id ? "text-black/70" : "text-muted-foreground"}`}>
                        {channel.member_count} thành viên
                      </span>
                    )}
                  </div>
                  {!isShare && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-3 text-xs text-black dark:text-white hover:text-black dark:text-white hover:bg-white/10 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChannel(channel?.id, 'group');
                      }}
                    >
                      Tham gia
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Private Chats */}
        {!isLoading && filteredResults.privateChats.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-2">
              Kênh dự án
            </div>
            <div className="space-y-2">
              {filteredResults.privateChats.map((channel) => (
                <div
                  key={`private-${channel.id}`}
                  className={`flex items-center justify-between px-3 py-2 bg-[#23272f] rounded-lg hover:bg-[#2a2e38] cursor-pointer transition
                    ${isShare && selectedChannelId === channel.id ? "bg-white text-black" : ""}
                  `}
                  onClick={() => handleChannelClick(channel)}
                >
                  <div className="flex items-center gap-2">
                    <Lock className={`h-5 w-5 ${isShare && selectedChannelId === channel.id ? "text-black" : "text-purple-400"}`} />
                    <span className={`font-medium ${isShare && selectedChannelId === channel.id ? "text-black" : "text-black dark:text-white"}`}>{channel.name}</span>
                    {channel.member_count && (
                      <span className={`text-xs ml-2 ${isShare && selectedChannelId === channel.id ? "text-black/70" : "text-muted-foreground"}`}>
                        {channel.member_count} thành viên
                      </span>
                    )}
                  </div>
                  {/* Ẩn nút tham gia nếu isShare */}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
