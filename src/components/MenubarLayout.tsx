import {
  Home,
  Users,
  Settings,
  Bell,
  MessageSquare,
  LogOut,
  GitBranch,
  GitFork,
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
}: {
  onSelect?: (key: string) => void;
  selected?: string;
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
      key: "settings",
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      link: "/settings",
    },
  ];

  return (
    <TooltipProvider>
      <nav className="flex flex-col items-center gap-2 py-4 bg-sidebar-accent border-r border-sidebar-border min-h-screen w-14">
        {items.map((item) => (
          <Tooltip key={item.key}>
            <TooltipTrigger asChild>
              <Button
                variant={
                  location.pathname === item.link ? "secondary" : "ghost"
                }
                size="icon"
                className={`rounded-lg ${location.pathname === item.link
                  ? "bg-blue-600 text-white"
                  : "text-sidebar-foreground hover:bg-blue-100"
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
              className="bg-black text-white border-none"
            >
              {item.label}
            </TooltipContent>
          </Tooltip>
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-lg text-sidebar-foreground hover:bg-red-100 mt-4"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="bg-black text-white border-none"
          >
            Đăng xuất
          </TooltipContent>
        </Tooltip>
      </nav>
    </TooltipProvider>
  );
}
