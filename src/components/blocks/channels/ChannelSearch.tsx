import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { useSearchChats } from "@/hooks/useSearch";

interface Channel {
  id: number;
  name: string;
  description?: string;
  type: "personal" | "group" | "group-private";
  member_count?: number;
}

interface User {
  id: number;
  username: string;
  email: string;
}

interface ChannelSearchProps {
  onJoinChannel?: (channel: Channel) => void;
  onSelectChannel?: (channel: Channel) => void;
}

type FilterType = "personal" | "group" | "group-private";

export function ChannelSearch({
  onJoinChannel,
  onSelectChannel,
}: ChannelSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterType | null>(null);

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

    // Filter dựa trên selectedFilter
    switch (selectedFilter) {
      case "personal":
        return {
          users,
          personalChats,
          groupChats: [],
          privateChats: [],
        };
      case "group":
        return {
          users: [],
          personalChats: [],
          groupChats,
          privateChats: [],
        };
      case "group-private":
        return {
          users: [],
          personalChats: [],
          groupChats: [],
          privateChats,
        };
      default: // "all"
        return {
          users,
          personalChats,
          groupChats,
          privateChats,
        };
    }
  }, [searchData, selectedFilter]);

  const hasResults =
    filteredResults.users.length > 0 ||
    filteredResults.personalChats.length > 0 ||
    filteredResults.groupChats.length > 0 ||
    filteredResults.privateChats.length > 0;

  const handleChannelClick = (channel: Channel) => {
    onSelectChannel?.(channel);
  };

  const handleJoinChannel = (channel: Channel) => {
    onJoinChannel?.(channel);
  };

  const handleUserClick = (user: User) => {
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
    { value: "group-private" as FilterType, label: "Riêng tư" },
  ];

  return (
    <div className="p-3">
      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm kiếm kênh, người dùng..."
          className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-sidebar-foreground/50" />
        )}
      </div>

      {/* Filter Options */}
      <div className="mb-3">
        <div className="flex items-center gap-1 mb-2">
          <Filter className="h-3 w-3 text-sidebar-foreground/60" />
          <span className="text-xs text-sidebar-foreground/60">
            Lọc theo loại:
          </span>
        </div>
        <div className="flex gap-1 flex-wrap">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={selectedFilter === option.value ? "default" : "ghost"}
              className={`h-6 px-2 text-xs ${
                selectedFilter === option.value
                  ? "bg-primary text-white"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              onClick={() => setSelectedFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {searchTerm.trim() && (
        <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="text-xs text-sidebar-foreground/60 px-2 py-1">
              Đang tìm kiếm...
            </div>
          )}

          {/* No Results */}
          {!isLoading && !hasResults && (
            <div className="text-xs text-sidebar-foreground/60 px-2 py-1">
              Không tìm thấy kết quả phù hợp.
            </div>
          )}

          {/* Users */}
          {filteredResults.users.length > 0 && (
            <div>
              <div className="text-xs font-medium text-sidebar-foreground/80 px-2 mb-1">
                Người dùng
              </div>
              <div className="space-y-1">
                {filteredResults.users.map((user) => (
                  <div
                    key={`user-${user.id}`}
                    className="flex items-center justify-between px-2 py-1.5 bg-sidebar-accent/50 rounded hover:bg-sidebar-accent cursor-pointer"
                    onClick={() => handleUserClick(user)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sidebar-foreground text-sm">
                        {user.username}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-white hover:text-white hover:bg-white/10"
                    >
                      Chat
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Chats */}
          {filteredResults.personalChats.length > 0 && (
            <div>
              <div className="text-xs font-medium text-sidebar-foreground/80 px-2 mb-1">
                Tin nhắn trực tiếp
              </div>
              <div className="space-y-1">
                {filteredResults.personalChats.map((channel) => (
                  <div
                    key={`personal-${channel.id}`}
                    className="flex items-center px-2 py-1.5 bg-sidebar-accent/50 rounded hover:bg-sidebar-accent cursor-pointer"
                    onClick={() => handleChannelClick(channel)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                        {channel.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sidebar-foreground text-sm">
                        {channel.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Group Chats */}
          {filteredResults.groupChats.length > 0 && (
            <div>
              <div className="text-xs font-medium text-sidebar-foreground/80 px-2 mb-1">
                Nhóm chat
              </div>
              <div className="space-y-1">
                {filteredResults.groupChats.map((channel) => (
                  <div
                    key={`group-${channel.id}`}
                    className="flex items-center justify-between px-2 py-1.5 bg-sidebar-accent/50 rounded hover:bg-sidebar-accent cursor-pointer"
                    onClick={() => handleChannelClick(channel)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
                        {channel.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sidebar-foreground text-sm">
                          {channel.name}
                        </div>
                        {channel.member_count && (
                          <div className="text-xs text-sidebar-foreground/60">
                            {channel.member_count} thành viên
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-white hover:text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChannel(channel);
                      }}
                    >
                      Tham gia
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Private Chats */}
          {filteredResults.privateChats.length > 0 && (
            <div>
              <div className="text-xs font-medium text-sidebar-foreground/80 px-2 mb-1">
                Kênh riêng tư
              </div>
              <div className="space-y-1">
                {filteredResults.privateChats.map((channel) => (
                  <div
                    key={`private-${channel.id}`}
                    className="flex items-center justify-between px-2 py-1.5 bg-sidebar-accent/50 rounded hover:bg-sidebar-accent cursor-pointer"
                    onClick={() => handleChannelClick(channel)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                        🔒
                      </div>
                      <div>
                        <div className="text-sidebar-foreground text-sm">
                          {channel.name}
                        </div>
                        {channel.member_count && (
                          <div className="text-xs text-sidebar-foreground/60">
                            {channel.member_count} thành viên
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinChannel(channel);
                      }}
                    >
                      Tham gia
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
