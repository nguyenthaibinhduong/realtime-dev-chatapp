import React from "react";
import {
    ResizablePanelGroup,
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { useIsMobile } from "@/hooks/useMobile";
import { useNotificationHandler } from "@/hooks/useNotificationToast";
import { is } from "date-fns/locale";
// local lightweight icon fallback to avoid external dependency in layout
const SimpleIcon = ({ name, className }: { name: string; className?: string }) => {
    // simple glyph fallback; consumers should prefer the project's Icon component if available
    const style: React.CSSProperties = { fontSize: 14, lineHeight: '14px' };
    if (name === 'close') return <span style={style} className={className}>×</span>;
    if (name === 'chevrons-left') return <span style={style} className={className}>‹</span>;
    return <span style={style} className={className}>•</span>;
};

interface MasterLayoutProps {
    menu: React.ReactNode;
    sidebar?: React.ReactNode;
    children: React.ReactNode;
    children_right?: React.ReactNode;
    isNotificationsEnabled?: boolean;
    showSidebar?: boolean;
}

export default function MasterLayout({ menu, sidebar, children, children_right, isNotificationsEnabled, showSidebar = true }: MasterLayoutProps) {
    const isMobile = useIsMobile();

    // local toggle to show/hide right tools panel
    const [showRight, setShowRight] = React.useState(!!children_right);
    React.useEffect(() => {
        // sync when prop changes
        setShowRight(!!children_right);
    }, [children_right]);

    // ✅ Hook tự động xử lý notifications với navigation support
    useNotificationHandler();

    return (
        <ResizablePanelGroup direction="horizontal" className="h-screen w-full bg-zinc-50 dark:bg-zinc-950 group">
            {/* Menu (MenubarLayout) */}
            {menu}

            {/* Sidebar */}
            {
                sidebar && showSidebar &&
                <ResizablePanel
                    defaultSize={isNotificationsEnabled ? 45 : 24}
                    minSize={isNotificationsEnabled ? 30 : 22}
                    maxSize={50}
                    className="flex flex-col"
                >
                    {sidebar ?? <div className="flex-1">No Sidebar</div>}
                </ResizablePanel>
            }

            {/* Handle */}
            {sidebar && showSidebar && <ResizableHandle withHandle className="opacity-0" />}

            {/* Main Content */}
            <ResizablePanel
                minSize={children_right ? 30 : 40}
                defaultSize={children_right ? 70 : 100}
                className="flex flex-col"
            >
                {children}
            </ResizablePanel>

            {/* Handle between main and right panel */}
            {children_right && showRight && <ResizableHandle withHandle className="opacity-0" />}

            {/* Right Panel for Tools */}
            {children_right && showRight && (
                <ResizablePanel
                    minSize={30}
                    defaultSize={55}
                    maxSize={60}
                    className="flex flex-col border-l border-border relative pt-5 px-2 max-h-screen"
                >
                    {/* Absolute top-right close icon */}
                    {/* <div className="absolute top-2 right-3 z-50">
                        <button
                            aria-label="Close tools"
                            onClick={() => setShowRight(false)}
                            className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"
                        >
                            <SimpleIcon name="close" className="text-zinc-200" />
                        </button>
                    </div> */}

                    {children_right}
                </ResizablePanel>
            )}

            {/* Small reopen handle when right panel is hidden */}
            {/* {children_right && !showRight && (
                <div className="absolute right-0 top-12 z-40">
                    <button
                        aria-label="Open tools"
                        onClick={() => setShowRight(true)}
                        className="-mr-3 w-10 h-10 rounded-l-md bg-zinc-50 dark:bg-zinc-900 border-l border-border flex items-center justify-center"
                    >
                        <SimpleIcon name="chevrons-left" className="text-zinc-300 rotate-180" />
                    </button>
                </div>
            )} */}
        </ResizablePanelGroup>
    );
}