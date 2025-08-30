import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarLayoutProps {
    children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        // Check if user is authenticated, if not redirect to auth page
        if (!isAuthenticated()) {
            navigate("/auth");
        }
    }, [isAuthenticated, navigate]);

    return (

        <div className="h-screen w-full flex bg-[hsl(var(--chat-background))]">
            {/* Sidebar */}
            <div className="w-full bg-sidebar border-r border-sidebar-border flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            <h1 className="font-semibold text-sidebar-foreground">CodeSync</h1>
                        </div>
                    </div>
                </div>

                {/* Scrollable content passed from ChatLayout */}
                {children}

                {/* User Info */}
                <div className="p-3 border-t border-sidebar-border">
                    <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8" onClick={() => navigate("/profile")}>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {user?.email?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {user?.name || user?.email?.split("@")[0] || "User"}
                            </p>
                            <div className="flex items-center">
                                <div className="w-2 h-2 bg-[hsl(var(--online-status))] rounded-full mr-1" />
                                <p className="text-xs text-sidebar-foreground/70">Online</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                {/* Có thể đặt children content ở đây nếu cần */}
            </div>
        </div>
    );
}
