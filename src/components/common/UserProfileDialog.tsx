import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Mail,
    Calendar,
    Github,
    CheckCircle2,
    XCircle,
    User as UserIcon,
    Shield,
    Crown,
} from "lucide-react";
import { User } from "@/types/auth";
import attachmentService from "@/services/attachmentService";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface UserProfileDialogProps {
    user: User | any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    isCurrentUser?: boolean;
}

export const UserProfileDialog = ({
    user,
    open,
    onOpenChange,
    isCurrentUser = false,
}: UserProfileDialogProps) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user?.avatar) {
            attachmentService.getObjectUrl(user.avatar).then(setAvatarUrl);
        }
    }, [user?.avatar]);

    if (!user) return null;

    const displayAvatar = avatarUrl || user.github_avatar || `https://i.pravatar.cc/150?u=${user.id}`;
    const displayName = user.username || user.name || user.email?.split("@")[0] || "User";
    const displayEmail = user.email || user.github_email || "Không có email";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white border border-zinc-800 shadow-2xl z-[9999]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-blue-400" />
                        Thông tin người dùng
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Avatar and Basic Info */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-zinc-800 shadow-xl">
                                <AvatarImage src={displayAvatar} alt={displayName} />
                                <AvatarFallback className="bg-blue-600 text-black dark:text-white text-2xl">
                                    {displayName[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {isCurrentUser && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1.5">
                                    <Crown className="h-4 w-4 text-black dark:text-white" />
                                </div>
                            )}
                        </div>

                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-black dark:text-white">{displayName}</h3>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                {user.role && (
                                    <Badge
                                        variant="outline"
                                        className="bg-purple-500/10 border-purple-500/50 text-purple-400"
                                    >
                                        <Shield className="h-3 w-3 mr-1" />
                                        {user.role}
                                    </Badge>
                                )}
                                {isCurrentUser && (
                                    <Badge
                                        variant="outline"
                                        className="bg-blue-500/10 border-blue-500/50 text-blue-400"
                                    >
                                        Bạn
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-zinc-100 dark:bg-zinc-800" />

                    {/* Contact Information */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-zinc-50
 dark:bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                                <Mail className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-zinc-400">Email</p>
                                <p className="text-sm font-medium text-black dark:text-white truncate">
                                    {displayEmail}
                                </p>
                            </div>
                            {user.email_verified ? (
                                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                            )}
                        </div>

                        {/* GitHub Integration */}
                        {user.github_verified && (
                            <div className="flex items-center gap-3 p-3 bg-zinc-50
 dark:bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                                    <Github className="h-5 w-5 text-purple-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-zinc-400">GitHub</p>
                                    <p className="text-sm font-medium text-black dark:text-white truncate">
                                        {user.github_email || "Đã kết nối"}
                                    </p>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                            </div>
                        )}

                        {/* Account Created Date */}
                        {user.created_at && (
                            <div className="flex items-center gap-3 p-3 bg-zinc-50
 dark:bg-zinc-900 rounded-lg border border-zinc-800">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                                    <Calendar className="h-5 w-5 text-orange-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-zinc-400">Tham gia</p>
                                    <p className="text-sm font-medium text-black dark:text-white">
                                        {format(new Date(user.created_at), "dd MMMM yyyy", {
                                            locale: vi,
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Verification Status */}
                    <div className="bg-zinc-50
dark:bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
                        <h4 className="text-sm font-semibold text-zinc-300 mb-3">
                            Trạng thái xác minh
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Email</span>
                                {user.email_verified ? (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Đã xác minh
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/50">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Chưa xác minh
                                    </Badge>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">GitHub</span>
                                {user.github_verified ? (
                                    <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Đã kết nối
                                    </Badge>
                                ) : (
                                    <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/50">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Chưa kết nối
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
