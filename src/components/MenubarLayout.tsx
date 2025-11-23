import {
  Home,
  Users,
  Settings,
  Bell,
  MessageSquare,
  LogOut,
  GitBranch,
  GitFork,
  Newspaper,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import NotificationBadge from "./blocks/notifications/NotificationBadge";
import { useEffect, useState } from "react";
import { NotificationAPI } from "@/api/api";
import { log } from "console";
import { chatSocketService } from "@/services/chatSocketService";

export default function MenubarLayout({
  onSelect,
  selected,
  onToggleSidebar,
  showSidebar,
}: {
  onSelect?: (key: string) => void;
  selected?: string;
  onToggleSidebar?: () => void;
  showSidebar?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const res = await NotificationAPI.getCountUnreadNotifications();
      console.log("Unread Count:", res.data);
      setUnreadCount(res.data);
    };

    fetchUnreadCount();
  }, []);

  useEffect(() => {
    const handler = (notify: any) => {
      setUnreadCount((prev) => prev + 1);
    };
    chatSocketService.onNotification(handler);
    return () => chatSocketService.offNotification(handler);
  }, []);




  const handleLogout = async () => {
    await signOut();
  };
  // Giả sử có 5 thông báo chưa đọc, thay bằng logic thực tế

  const items = [

    {
      key: "chat",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Chat",
      link: "/",
    },
    {
      key: "github",
      icon: <GitFork className="h-5 w-5" />,
      label: "GitHub",
      link: "/github",
    },
    {
      key: "notifications",
      icon: (
        <div className="relative flex items-center justify-center w-10 h-10">
          <Bell className="h-5 w-5" />
          <NotificationBadge
            count={unreadCount}
            className="absolute top-0 right-0"
          />
        </div>
      ),
      label: "Notifications",
      link: "/notifications",
    },

    {

      key: "blogs",
      icon: <Newspaper className="h-5 w-5" />,
      label: "Blogs",
      link: "/blogs",
    },
    {
      key: "settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      link: "/settings",
    },
  ];

  return (
    <TooltipProvider>
      <nav className="main-menubar flex flex-col items-center gap-2 py-4 bg-zinc-950/95 backdrop-blur-md border-r border-zinc-700/50 min-h-screen w-14 shadow-lg">
        {/* Toggle Sidebar Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-zinc-800/60 border border-transparent hover:border-zinc-600/30 transition-all duration-200 mb-2"
              onClick={onToggleSidebar}
              title={showSidebar ? "Ẩn sidebar" : "Hiện sidebar"}
            >
              {showSidebar ? (
                <X className="h-5 w-5 text-zinc-400 hover:text-zinc-200" />
              ) : (
                <Menu className="h-5 w-5 text-zinc-400 hover:text-zinc-200" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-zinc-900 text-zinc-100 border border-zinc-700/50"
          >
            {showSidebar ? "Ẩn sidebar" : "Hiện sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-6 h-px bg-zinc-700/40 mb-1" />

        {items.map((item) => (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>
              <Button
                variant={
                  location.pathname === item.link ? "default" : "ghost"
                }
                size="icon"
                className={`rounded-xl transition-all duration-200 ${location.pathname === item.link
                    ? "bg-blue-500/20 border border-blue-400/40 text-blue-400 shadow-lg shadow-blue-500/20"
                    : "hover:bg-zinc-800/60 border border-transparent hover:border-zinc-600/30 text-zinc-400 hover:text-zinc-200"
                  }`}
                onClick={() => {
                  onSelect?.(item.key);
                  navigate(item.link);
                }}
              >
                {item.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="bg-zinc-900 text-zinc-100 border border-zinc-700/50"
            >
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
        {/* Separator */}
        <div className="flex-1" />
        <div className="w-6 h-px bg-zinc-700/40 mb-2" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-red-500/20 border border-transparent hover:border-red-400/30 text-zinc-400 hover:text-red-400 transition-all duration-200"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-zinc-900 text-zinc-100 border border-zinc-700/50"
          >
            Đăng xuất
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
