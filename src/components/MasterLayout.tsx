import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/useMobile";
import { chatSocketService } from "@/services/chatSocketService";
import { useToast } from "@/hooks/useToast";
import { useEffect } from "react";

interface MasterLayoutProps {
    menu: React.ReactNode;
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export default function MasterLayout({ menu, sidebar, children }: MasterLayoutProps) {
    const isMobile = useIsMobile();
    const { toast } = useToast();

    useEffect(() => {
        const handler = (notify: any) => {
            console.log("Received notification:", notify);

            // Xử lý notification dựa trên type
            switch (notify.type) {
                case "group":
                    // Tin nhắn trong group/channel
                    const channelName = notify.data?.channel?.name || "kênh";
                    const senderName = notify.data?.sender?.username || "Ai đó";
                    const messageText = notify.data?.text || "tin nhắn";

                    // Truncate message nếu quá dài
                    const truncatedText = messageText.length > 80
                        ? `${messageText.substring(0, 80)}...`
                        : messageText;

                    toast({
                        title: `#${channelName}`,
                        description: `${senderName}: ${truncatedText}`,
                        duration: 2000,
                    });
                    break;

                case "git":
                    // Git notification
                    const repository = notify.data?.repository || "Repository";
                    const branch = notify.data?.branch || "";
                    const gitMessage = notify.data?.message || notify.data?.description || "Git activity";

                    const gitDescription = branch
                        ? `Branch: ${branch}\n${gitMessage}`
                        : gitMessage;

                    toast({
                        title: `🔧 ${repository}`,
                        description: gitDescription,
                        duration: 2000,

                    });
                    break;

                case "system":
                    // System notification
                    const systemTitle = notify.data?.title || "Thông báo hệ thống";
                    const systemMessage = notify.data?.message || notify.data?.description || "Thông báo từ hệ thống";

                    toast({
                        title: `⚙️ ${systemTitle}`,
                        description: systemMessage,
                        duration: 5000,
                        className: "border-l-4 border-l-orange-500 bg-orange-50/80 border-orange-200",
                    });
                    break;

                default:
                    // Default notification format
                    const title = notify.title || notify.data?.title || "Thông báo mới";
                    const description = notify.body || notify.data?.text || notify.data?.message || "Bạn có thông báo mới";

                    toast({
                        title,
                        description,
                        duration: 5000,
                        className: "border-l-4 border-l-gray-500 bg-gray-50/80 border-gray-200",
                    });
                    break;
            }
        };

        chatSocketService.onNotification(handler);
        return () => chatSocketService.offNotification(handler);
    }, [toast]);

    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-full bg-[hsl(var(--chat-background))] group">
            {/* Menu (MenubarLayout) */}
            {menu}

            {/* Sidebar */}
            <ResizablePanel
                defaultSize={isMobile ? 0 : 22}
                minSize={isMobile ? 0 : 28}
                maxSize={isMobile ? 0 : 50}
                className={`flex flex-col transition-all duration-300 ${isMobile ? "w-0 min-w-0 max-w-0" : ""}`}
                style={isMobile ? { width: 0, minWidth: 0, maxWidth: 0, padding: 0, overflow: "hidden" } : {}}
            >
                {sidebar}
            </ResizablePanel>

            {/* Handle */}
            <ResizableHandle withHandle className="opacity-0" />

            {/* Main Content */}
            <ResizablePanel minSize={30} className="flex-1 flex flex-col">
                {children}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}