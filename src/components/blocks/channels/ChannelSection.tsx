import { Button } from "../../ui/button";
import { Plus, Filter } from "lucide-react";
import { ChannelList } from "./ChannelList";
import { ChannelDialog } from "./ChannelDialog";
import { useEffect, useRef, useState } from "react";
import { Channel } from "@/types/channel";
import { Badge } from "../../ui/badge";


interface ChannelSectionProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  onSelectChannel: (channel: Channel) => void;
  onShowChannelTypeMenu: () => void;
  showChannelTypeMenu: boolean;
  onChannelCreated: () => void;
  unreadMap?: Record<string, number>; // thêm prop
}

export const ChannelSection = ({
  channels,
  selectedChannel,
  onSelectChannel,
  onShowChannelTypeMenu,
  showChannelTypeMenu,
  onChannelCreated, // Nhận callback chung
  unreadMap = {},
}: ChannelSectionProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // State cho dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"public" | "private">("public");

  // State cho filter
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [channelFilter, setChannelFilter] = useState<string[]>(() => {
    const saved = localStorage.getItem('channelFilter');
    return saved ? JSON.parse(saved) : ['group', 'group-private', 'personal'];
  });

  // Close menu when clicking outside
  useEffect(() => {
    if (!showChannelTypeMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onShowChannelTypeMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showChannelTypeMenu, onShowChannelTypeMenu]);

  // Close filter menu when clicking outside
  useEffect(() => {
    if (!showFilterMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showFilterMenu]);

  // Save filter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('channelFilter', JSON.stringify(channelFilter));
  }, [channelFilter]);

  // Handle menu clicks
  const handleCreatePublic = () => {
    setDialogType("public");
    setIsDialogOpen(true);
    onShowChannelTypeMenu(); // Đóng menu
  };

  const handleCreatePrivate = () => {
    setDialogType("private");
    setIsDialogOpen(true);
    onShowChannelTypeMenu(); // Đóng menu
  };

  // Handle dialog success - sử dụng callback chung
  const handleDialogSuccess = () => {
    onChannelCreated(); // Gọi callback chung cho cả public và private
  };

  // Handle filter toggle
  const toggleFilter = (type: string) => {
    setChannelFilter(prev => {
      if (prev.includes(type)) {
        // Nếu chỉ còn 1 filter, không cho phép bỏ chọn
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  // Filter channels based on selected types
  const filteredChannels = channels.filter(channel =>
    channelFilter.includes(channel.type)
  );

  const filterCount = channelFilter.length;
  const totalTypes = 3; // group, group-private, personal

  return (
    <div className="space-y-1 w-full">
      <div className="grid grid-cols-1 items-center justify-between py-2">
        <h3 className="text-sm font-medium text-black dark:text-sidebar-foreground/70 uppercase tracking-wide">
          Kênh chat
        </h3>
        <div className="flex items-center gap-1 justify-end">
          {/* Filter Button */}
          <div className="relative" ref={filterMenuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`h-6 px-2 gap-1 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:text-black ${filterCount < totalTypes ? 'text-blue-500' : ''
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {filterCount < totalTypes && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px] bg-blue-500 text-black dark:text-white">
                  {filterCount}
                </Badge>
              )}
            </Button>
            {showFilterMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-900 text-black dark:text-white rounded-lg shadow-xl z-50 border border-gray-700 py-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-700">
                  Lọc theo loại kênh
                </div>
                <button
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${channelFilter.includes('group') ? 'bg-gray-800/50' : ''
                    }`}
                  onClick={() => toggleFilter('group')}
                >
                  <span className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${channelFilter.includes('group')
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-600'
                      }`}>
                      {channelFilter.includes('group') && (
                        <svg className="w-3 h-3 text-black dark:text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    Kênh công khai
                  </span>
                  <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
                    {channels.filter(c => c.type === 'group').length}
                  </Badge>
                </button>
                <button
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${channelFilter.includes('group-private') ? 'bg-gray-800/50' : ''
                    }`}
                  onClick={() => toggleFilter('group-private')}
                >
                  <span className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${channelFilter.includes('group-private')
                      ? 'bg-orange-500 border-orange-500'
                      : 'border-gray-600'
                      }`}>
                      {channelFilter.includes('group-private') && (
                        <svg className="w-3 h-3 text-black dark:text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    Kênh dự án
                  </span>
                  <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-400">
                    {channels.filter(c => c.type === 'group-private').length}
                  </Badge>
                </button>
                <button
                  className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between hover:bg-gray-800 transition-colors ${channelFilter.includes('personal') ? 'bg-gray-800/50' : ''
                    }`}
                  onClick={() => toggleFilter('personal')}
                >
                  <span className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${channelFilter.includes('personal')
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-600'
                      }`}>
                      {channelFilter.includes('personal') && (
                        <svg className="w-3 h-3 text-black dark:text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                    Chat cá nhân
                  </span>
                  <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400">
                    {channels.filter(c => c.type === 'personal').length}
                  </Badge>
                </button>
                {filterCount < totalTypes && (
                  <>
                    <div className="border-t border-gray-700 my-2" />
                    <button
                      className="w-full px-4 py-2 text-left text-sm text-blue-400 hover:bg-gray-800 transition-colors font-medium"
                      onClick={() => setChannelFilter(['group', 'group-private', 'personal'])}
                    >
                      Chọn tất cả
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Create Channel Button */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowChannelTypeMenu}
              className="h-6 w-6 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:text-black"
            >
              <Plus className="h-4 w-4" />
            </Button>
            {showChannelTypeMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-black dark:text-white rounded shadow z-50 border border-gray-700">
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-800"
                  onClick={handleCreatePublic}
                >
                  Tạo kênh công khai
                </button>
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-800"
                  onClick={handleCreatePrivate}
                >
                  Tạo kênh dự án
                </button>
              </div>
            )}
          </div>
        </div>

        <ChannelList
          channels={filteredChannels}
          selectedChannel={selectedChannel}
          onSelectChannel={onSelectChannel}
          unreadMap={unreadMap} // truyền vào
        />

        {/* Channel Dialog với callback */}
        <ChannelDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          type={dialogType}
          onSuccess={handleDialogSuccess}
        />
      </div>
    </div>
  );
};
