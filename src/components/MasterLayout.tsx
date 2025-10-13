import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/useMobile";
import { useNotificationHandler } from "@/hooks/useNotificationToast";

interface MasterLayoutProps {
    menu: React.ReactNode;
    sidebar?: React.ReactNode;
    children: React.ReactNode;
    children_right?: React.ReactNode;
}

export default function MasterLayout({ menu, sidebar, children, children_right }: MasterLayoutProps) {
    const isMobile = useIsMobile();

    // ✅ Hook tự động xử lý notifications với navigation support
    useNotificationHandler();

    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-full bg-[hsl(var(--chat-background))] group">
            {/* Menu (MenubarLayout) */}
            {menu}

            {/* Sidebar */}
            {
                sidebar && !isMobile &&
                <ResizablePanel
                    defaultSize={isMobile ? 0 : 24}
                    minSize={isMobile ? 0 : 22}
                    maxSize={isMobile ? 0 : 50}
                    className={`flex flex-col transition-all duration-300 ${isMobile ? "w-0 min-w-0 max-w-0" : ""}`}
                    style={isMobile ? { width: 0, minWidth: 0, maxWidth: 0, padding: 0, overflow: "hidden" } : {}}
                >
                    {sidebar ?? <div className="flex-1">No Sidebar</div>}
                </ResizablePanel>
            }

            {/* Handle */}
            <ResizableHandle withHandle className="opacity-0" />

            {/* Main Content */}
            <ResizablePanel
                minSize={children_right ? 30 : 40}
                defaultSize={children_right ? 70 : 100}
                className="flex flex-col"
            >
                {children}
            </ResizablePanel>

            {/* Handle between main and right panel */}
            {children_right && <ResizableHandle withHandle />}

            {/* Right Panel for Tools */}
            {children_right && (
                <ResizablePanel
                    minSize={15}
                    defaultSize={30}
                    maxSize={50}
                    className="flex flex-col border-l border-border"
                >
                    {children_right}
                </ResizablePanel>
            )}
        </ResizablePanelGroup>
    );
}