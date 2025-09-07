import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/useMobile";

interface MasterLayoutProps {
    menu: React.ReactNode;
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export default function MasterLayout({ menu, sidebar, children }: MasterLayoutProps) {
    const isMobile = useIsMobile();

    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-full bg-[hsl(var(--chat-background))] group">
            {/* Menu (MenubarLayout) */}
            {menu}

            {/* Sidebar */}
            <ResizablePanel
                defaultSize={isMobile ? 0 : 22}
                minSize={isMobile ? 0 : 14}
                maxSize={isMobile ? 0 : 40}
                className={`flex flex-col transition-all duration-300 ${isMobile ? "w-0 min-w-0 max-w-0" : ""}`}
                style={isMobile ? { width: 0, minWidth: 0, maxWidth: 0, padding: 0, overflow: "hidden" } : {}}
            >
                {sidebar}
            </ResizablePanel>

            {/* Handle */}
            <ResizableHandle withHandle className="opacity-0" />

            {/* Main Content */}
            <ResizablePanel minSize={60} className="flex-1 flex flex-col">
                {children}
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}