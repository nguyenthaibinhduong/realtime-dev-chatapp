import { FileText, Image, LogOut, MessageSquare, Search, Settings, User, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Navigate, useNavigate } from "react-router-dom";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import SidebarLayout from "./SidebarLayout";
interface Options {
    id: string;
    name: string;
    description: string;
    icon: any;
}
const ProfileLayout = () => {
    const [options, setOptions] = React.useState<Options[]>([]);
    const [selectedOptions, setSelectedOptions] = React.useState<Options | null>(null);
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    React.useEffect(() => {
        checkAuth();
        loadOptions();
    }, []);

    const checkAuth = async () => {
        if (!isAuthenticated()) {
            navigate('/auth');
            return;
        }
    };

    const loadOptions = async () => {
        // For now, create some default Options
        const defaultOptions = [
            {
                id: "members",
                name: "Thành viên",
                description: "Xem danh sách các thành viên trong nhóm",
                icon: User,
            },
            {
                id: "media",
                name: "Thư viện",
                description: "Tất cả ảnh, video đã chia sẻ",
                icon: Image,
            },
            {
                id: "files",
                name: "Tệp tin",
                description: "Danh sách các tệp tin đã gửi",
                icon: FileText,
            },
            {
                id: "settings",
                name: "Cài đặt",
                description: "Tùy chỉnh thông tin kênh chat",
                icon: Settings,
            },
        ];
        setOptions(defaultOptions);
        if (defaultOptions.length > 0) {
            setSelectedOptions(defaultOptions[0]);
        }
    };


    return (<>
        <div className="h-screen flex bg-[hsl(var(--chat-background))]">
            {/* Sidebar */}
            <SidebarLayout>
                <ScrollArea className="flex-1 px-3">
                    <div className="space-y-1">
                        <div className="flex items-center justify-between py-2">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Tùy chọn
                            </h3>
                        </div>

                        {options.map((option) => {
                            const isSelected = selectedOptions?.id === option.id;
                            const Icon = option.icon;

                            return (
                                <Button
                                    key={option.id}
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start h-auto px-3 py-2 gap-y-2 text-left rounded-lg transition-all",
                                        isSelected
                                            ? "bg-[hsl(var(--chat-selected))] text-white shadow"
                                            : "hover:bg-[hsl(var(--chat-selected))] text-white "
                                    )}
                                    onClick={() => setSelectedOptions(option)}
                                >
                                    <div className="flex items-start gap-3 w-full">
                                        <Icon className="h-5 w-5 mt-0.5 text-white  " />
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{option.name}</span>
                                        </div>
                                    </div>
                                </Button>
                            );
                        })}
                    </div>
                </ScrollArea >

            </SidebarLayout>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedOptions ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-14 border-b border-border bg-card px-6 flex items-center">
                            <h2 className="font-semibold text-foreground">{selectedOptions.name}</h2>
                            <div className="ml-auto flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                    <Users className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>


                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-foreground mb-2">
                                Chọn một Options
                            </h3>
                            <p className="text-muted-foreground">
                                Chọn kênh từ sidebar
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </>);
}

export default ProfileLayout;