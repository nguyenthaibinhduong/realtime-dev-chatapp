import {
  Settings,
  Bell,
  MessageSquare,
  LogOut,
  GitFork,
  Newspaper,
  Menu,
  X,
  Database,
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
import { useEffect, useMemo, useState } from "react";
import { NotificationAPI } from "@/api/api";
import { chatSocketService } from "@/services/chatSocketService";
import { ThemeToggle } from "./ThemeToggle";

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
  const { signOut, user } = useAuth();
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

  const dataItems = [

    {
      key: "chat",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Trò chuyện",
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
      label: "Thông báo",
      link: "/notifications",
    },

    {

      key: "blogs",
      icon: <Newspaper className="h-5 w-5" />,
      label: "Tin tức",
      link: "/blogs",
    },
    {
      key: "settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Cài đặt",
      link: "/settings",
    },

  ];


  const items: any = useMemo(() =>
    user?.role === "admin"
      ? [
        ...dataItems,
        {
          key: "admin",
          icon: <Database className="h-5 w-5" />,
          label: "Quản trị",
          link: "/admin",
        },
      ]
      : dataItems,
    [dataItems, user]
  );

  return (
    <TooltipProvider>
      <nav className="main-menubar flex min-h-screen w-14 flex-col items-center gap-2 border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground shadow-lg">
        {/* Toggle Sidebar Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mb-2 rounded-xl border border-transparent text-sidebar-foreground/75 transition-all duration-200 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={onToggleSidebar}
              title={showSidebar ? "Ẩn sidebar" : "Hiện sidebar"}
            >
              {showSidebar ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="border border-border bg-popover text-popover-foreground"
          >
            {showSidebar ? "Ẩn sidebar" : "Hiện sidebar"}
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="mb-1 h-px w-6 bg-sidebar-border" />

        {items.map((item: any) => (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>
              <Button
                variant={
                  location.pathname === item.link ? "default" : "ghost"
                }
                size="icon"
                className={`rounded-xl transition-all duration-200 ${location.pathname === item.link
                  ? "border border-primary/40 bg-primary/15 text-primary shadow-lg shadow-primary/20"
                  : "border border-transparent text-sidebar-foreground/75 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
              className="border border-border bg-popover text-popover-foreground"
            >
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
        {/* Separator */}
        <div className="flex-1" />
        <div className="mb-2 h-px w-6 bg-sidebar-border" />

        <ThemeToggle />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl border border-transparent text-sidebar-foreground/70 transition-all duration-200 hover:border-red-400/30 hover:bg-red-500/20 hover:text-red-500"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="border border-border bg-popover text-popover-foreground"
          >
            Đăng xuất
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
