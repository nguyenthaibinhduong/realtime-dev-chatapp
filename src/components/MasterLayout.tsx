import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";

interface MasterLayoutProps {
    menu: React.ReactNode;
    sidebar: React.ReactNode;
    children: React.ReactNode;
}

export default function MasterLayout({ menu, sidebar, children }: MasterLayoutProps) {
    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-full bg-[hsl(var(--chat-background))] group">
            {/* Menu (MenubarLayout) */}
            {menu}

            {/* Sidebar */}
            <ResizablePanel defaultSize={22} minSize={14} maxSize={40} className="flex flex-col">
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