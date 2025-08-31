import {
  Home,
  Users,
  Settings,
  Bell,
  MessageSquare,
  LogOut,
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
import { useNotifications } from "@/hooks/useNotifications";

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

  const handleLogout = async () => {
    await signOut();
  };

  const { unreadCount } = useNotifications();

  const items = [
    {
      key: "home",
      icon: <Home className="h-5 w-5" />,
      label: "Home",
      link: "/",
    },
    {
      key: "channels",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Channels",
      link: "/channels",
    },
    {
      key: "users",
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      link: "/users",
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
                className={`rounded-lg ${
                  location.pathname === item.link
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
