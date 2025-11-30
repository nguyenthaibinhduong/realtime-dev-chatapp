import { useAuth } from "@/hooks/useAuth";
import MasterLayout from "./MasterLayout";
import MenubarLayout from "./MenubarLayout";
import { useEffect, useState, useMemo } from "react";
import SidebarLayout from "./SidebarLayout";
import { useParams, useNavigate } from "react-router-dom";
import { Search, X, Users, MessageSquare, Settings } from "lucide-react";
import UserManagement from "./blocks/admin/UserManagement";
import ChannelManagement from "./blocks/admin/ChannelManagement";
import SystemSettings from "./blocks/admin/SystemSettings";

interface MenuItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface MenuSection {
    title?: string;
    items: MenuItem[];
}

const AdminSidebar = ({ selected, onSelect }: { selected: string; onSelect: (item: MenuItem) => void }) => {
    const [query, setQuery] = useState("");

    const sections: MenuSection[] = useMemo(() => [
        {
            title: "Quản lý người dùng",
            items: [
                { id: "users", label: "Quản lý User", icon: <Users className="h-4 w-4 mr-2" /> },
            ]
        },
        {
            title: "Quản lý nội dung",
            items: [
                { id: "channels", label: "Quản lý Kênh Chat", icon: <MessageSquare className="h-4 w-4 mr-2" /> },
            ]
        },
        {
            title: "Cấu hình",
            items: [
                { id: "settings", label: "Cài đặt Hệ thống", icon: <Settings className="h-4 w-4 mr-2" /> },
            ]
        }
    ], []);

    const allItems = useMemo(() =>
        sections.flatMap(sec => sec.items),
        [sections]
    );

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return allItems.filter(item =>
            item.label.toLowerCase().includes(lowerQuery)
        );
    }, [query, allItems]);

    const clearQuery = () => setQuery("");

    return (
        <div className="flex flex-col h-full">
            <div className="px-3 py-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-sidebar-foreground/60" />
                    </div>
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        aria-label="Tìm kiếm"
                        placeholder="Tìm kiếm chức năng..."
                        className="w-full bg-[#111] text-sm text-sidebar-foreground/90 placeholder:opacity-60 rounded-md py-2 pl-10 pr-9 outline-none border border-sidebar-border"
                    />
                    {query && (
                        <button
                            aria-label="Clear search"
                            onClick={clearQuery}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[rgba(255,255,255,0.03)]"
                        >
                            <X className="h-4 w-4 text-sidebar-foreground/60" />
                        </button>
                    )}
                </div>
            </div>

            <div className="px-3 pb-3 overflow-auto h-[calc(100vh-220px)]">
                {query.trim() ? (
                    <>
                        <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase mb-2 px-1">
                            KẾT QUẢ TÌM KIẾM
                        </div>
                        <div className="flex flex-col space-y-1">
                            {results.length === 0 && (
                                <div className="text-sm text-sidebar-foreground/70 px-2 py-3">
                                    Không tìm thấy
                                </div>
                            )}
                            {results.map((it) => (
                                <button
                                    key={it.id}
                                    onClick={() => { onSelect(it); setQuery(""); }}
                                    className={
                                        "text-left w-full rounded-md px-3 py-2 text-sidebar-foreground hover:bg-[#222] transition flex items-center " +
                                        (selected === it.id
                                            ? "bg-[#2b2b2f] font-medium"
                                            : "font-normal")
                                    }
                                >
                                    {it.icon}
                                    <span className="truncate">{it.label}</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    sections.map((sec, idx) => (
                        <div key={idx} className="mb-4">
                            {sec.title && (
                                <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase mb-2 px-1">
                                    {sec.title}
                                </div>
                            )}
                            <div className="flex flex-col space-y-1">
                                {sec.items.map((it) => (
                                    <button
                                        key={it.id}
                                        onClick={() => onSelect(it)}
                                        className={
                                            "text-left w-full rounded-md px-3 py-2 text-sidebar-foreground hover:bg-[#222] transition flex items-center " +
                                            (selected === it.id
                                                ? "bg-[#2b2b2f] font-medium"
                                                : "font-normal")
                                        }
                                    >
                                        {it.icon}
                                        <span className="truncate">{it.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
function AdminLayout() {
    const { user } = useAuth();
    const { section } = useParams<{ section?: string }>();
    const navigate = useNavigate();
    const selectedMenu = section || "users";

    useEffect(() => {
        if (user && !user.role.includes("admin")) {
            window.location.href = "/error";
        }
    }, [user]);

    useEffect(() => {
        if (!section) {
            navigate("/admin/users", { replace: true });
        }
    }, [section, navigate]);

    const handleMenuSelect = (item: MenuItem) => {
        navigate(`/admin/${item.id}`);
    };

    const renderContent = () => {
        switch (selectedMenu) {
            case "users":
                return <UserManagement />;
            case "channels":
                return <ChannelManagement />;
            case "settings":
                return <SystemSettings />;
            default:
                return <UserManagement />;
        }
    };

    return (
        <MasterLayout
            menu={<MenubarLayout />}
            sidebar={
                <SidebarLayout>
                    <AdminSidebar selected={selectedMenu} onSelect={handleMenuSelect} />
                </SidebarLayout>
            }
        >
            <div
                className="flex-1 overflow-auto bg-zinc-950"
                style={{ height: "100vh", minHeight: "100vh", maxHeight: "100vh" }}
            >
                {renderContent()}
            </div>
        </MasterLayout>
    );
}

export default AdminLayout;