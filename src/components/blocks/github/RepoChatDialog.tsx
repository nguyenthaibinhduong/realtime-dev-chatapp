import { useCallback, useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Github, Shield, Lock, Eye, ArrowRight, Grip } from "lucide-react";
import { GithubAPI } from "@/api/api";
import { toast } from "@/hooks/useToast";
import RepoChatList from "./RepoChatList"; // Đã có sẵn
import RepoDragList from "./RepoDragList";
import { log } from "console";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { chatSocketService } from "@/services/chatSocketService";

export function RepoChatDialog({ open, onOpenChange, role }: { open: boolean; onOpenChange: (v: boolean) => void, role?: string }) {
    const [repos, setRepos] = useState<any[]>([]);
    const [repoChannel, setRepoChannel] = useState<any[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [loadingChannelRepos, setLoadingChannelRepos] = useState(false);
    const [draggedRepo, setDraggedRepo] = useState<any>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    // Ref để tránh gọi fetch nhiều lần khi socket gửi nhiều event liên tiếp
    const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Lấy channelId từ localStorage (hoặc hook riêng nếu có)
    const channelId = localStorage.getItem("selectedChannelId") || "";

    // Load tất cả repo user có quyền
    const loadRepo = useCallback(async () => {
        setLoadingRepos(true);
        try {
            const res1 = await GithubAPI.getInstallationRepos();
            const payload1 = res1?.data;
            const dataNode = Array.isArray(payload1)
                ? payload1
                : payload1?.repositories ?? payload1?.data ?? [];
            setRepos(Array.isArray(dataNode) ? dataNode : []);
        } catch (e: any) {
            // toast lỗi nếu muốn
        } finally {
            setLoadingRepos(false);
        }
    }, []);

    // Load repo đã gắn với channel
    const loadRepoChannel = useCallback(async () => {
        setLoadingChannelRepos(true);
        try {
            const res2 = await GithubAPI.getRepoForChannel({ channel_id: channelId });
            const payload2 = res2?.data;
            setRepoChannel(Array.isArray(payload2) ? payload2 : []);
        } catch (e) {
            // toast lỗi nếu muốn
        } finally {
            setLoadingChannelRepos(false);
        }
    }, [channelId]);

    // Lắng nghe socket: khi có notification thì fetch lại repo channel (debounce để tránh fetch liên tục)
    useEffect(() => {
        if (!open || !channelId) return;
        chatSocketService.joinRoom(channelId);

        const handleSocketMsg = (msg: any) => {
            if (msg.type === 'notification') {
                if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
                fetchTimeout.current = setTimeout(() => {
                    loadRepoChannel();
                }, 300); // debounce 300ms
            }
        };
        chatSocketService.onMessage(handleSocketMsg);

        return () => {
            // chatSocketService.leaveRoom(channelId);
            chatSocketService.offMessage(handleSocketMsg);
            if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
        };
    }, [open, channelId, loadRepoChannel]);

    // Khi mở dialog hoặc user đổi github_installation_id thì fetch lại
    useEffect(() => {
        if (open && user) {
            const userData = { ...user };
            if (role == "owner") {
                userData.role = "owner";
            }
            if (!user.github_installation_id && role !== "owner") {
                toast({
                    title: "Chưa kết nối GitHub",
                    description: "Vui lòng kết nối GitHub trước khi sử dụng chức năng này",
                });
                navigate("/auth/github/register");
                return;
            } else {
                if (role === "owner") {
                    loadRepoChannel();
                } else {
                    loadRepo();
                    loadRepoChannel();
                }
            }
        }
        // eslint-disable-next-line
    }, [open, user?.github_installation_id, loadRepo, loadRepoChannel, role]);

    // Drag & Drop handlers
    const handleDragStart = (e: React.DragEvent, repo: any) => {
        setDraggedRepo(repo);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify(repo));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (!draggedRepo) return;

        try {
            const res = await GithubAPI.addReposToChannel({
                channel_id: channelId,
                repository_ids: [draggedRepo.id]
            });
            if (res?.status == 201 || res?.status == 200) {
                toast({
                    title: "Đã thêm repository vào kênh!",
                    description: `${draggedRepo.full_name} đã được thêm vào kênh.`,
                });
                chatSocketService.sendMessage({
                    channelId: channelId,
                    text: `đã thêm repository ${draggedRepo.full_name} vào kênh.`,
                    type: 'notification',
                });
                await loadRepoChannel();
            }
        } catch (e: any) {
            toast({
                title: "Không thể thêm repository",
                description: e?.response?.data?.msg || "Vui lòng thử lại.",
                variant: "destructive",
            });
        }

        setDraggedRepo(null);
    };



    // Responsive: kiểm tra mobile qua Tailwind (md:hidden, md:flex)
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full max-w-[90vw] h-[90vh] p-0 bg-white dark:bg-black text-black dark:text-white border border-zinc-700 flex overflow-hidden"
            >
                {/* Mobile */}
                <div className="flex flex-col h-screen w-full md:hidden">
                    {/* Chọn repo để thêm */}
                    <div className="w-full border-b border-zinc-800 flex-shrink-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-lg flex items-center gap-2">
                                <Github className="h-6 w-6" /> Kết nối Repository với Kênh
                            </DialogTitle>

                            {/* Cảnh báo bảo mật */}
                            <div className="mt-3 p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Shield className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <div className="font-semibold text-red-300 mb-1">Cảnh báo bảo mật</div>
                                        <div className="text-red-200/90 leading-relaxed">
                                            Không chia sẻ repository chứa thông tin nhạy cảm như API keys, mật khẩu,
                                            token, hoặc dữ liệu cá nhân. Mọi thành viên trong kênh sẽ có thể xem nội dung repository.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-zinc-400 italic">
                                💡 Kéo thả repository từ danh sách vào khu vực bên dưới để thêm nhanh
                            </div>
                        </DialogHeader>
                        {loadingRepos ? (
                            <div className="text-center text-sm text-zinc-400 py-6">Đang tải danh sách repo…</div>
                        ) : (
                            <RepoDragList
                                repos={repos}
                                addedRepos={repoChannel}
                                isDragOver={isDragOver}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <RepoChatList
                                    repos={repoChannel}
                                    loading={loadingChannelRepos}
                                    onRefresh={loadRepoChannel}
                                    channel_id={localStorage.getItem("selectedChannelId") || ''}
                                />
                            </RepoDragList>
                        )}
                    </div>
                </div>


                {/* Desktop */}
                <div className="hidden md:flex w-full h-full">
                    <div className="w-full max-w-sm border-r border-zinc-800 flex flex-col min-h-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-lg flex items-center gap-2">
                                <Github className="h-6 w-6" /> Kết nối Repository với Kênh
                            </DialogTitle>

                            {/* Cảnh báo bảo mật */}
                            <div className="mt-3 p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
                                <div className="flex items-start gap-2">
                                    <Shield className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm">
                                        <div className="font-semibold text-red-300 mb-1">Cảnh báo bảo mật</div>
                                        <div className="text-red-200/90 leading-relaxed text-xs">
                                            Không chia sẻ repository chứa thông tin nhạy cảm như API keys, mật khẩu,
                                            token, hoặc dữ liệu cá nhân. Mọi thành viên trong kênh sẽ có thể xem nội dung repository.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-2 text-xs text-zinc-400 italic">
                                💡 Kéo thả repository từ danh sách vào khu vực bên phải để thêm nhanh
                            </div>
                        </DialogHeader>

                        {loadingRepos ? (
                            <div className="text-center text-sm text-zinc-400 py-6">Đang tải danh sách repo…</div>
                        ) : (
                            <div className="p-6 pt-2 flex-1 flex flex-col min-h-0">
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-semibold text-zinc-300">Repository có sẵn</h3>
                                        <span className="text-xs text-zinc-500">
                                            {repos.filter(repo => !repoChannel.some(r => r.id === repo.id)).length} / {repos.length} repo
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400">
                                        Kéo repository vào khu vực bên phải để thêm vào kênh
                                    </p>
                                </div>

                                <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                                    {repos
                                        .filter(repo => !repoChannel.some(r => r.id === repo.id))
                                        .map((repo: any) => {
                                            return (
                                                <div
                                                    key={repo.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, repo)}
                                                    className="group flex items-center gap-3 p-3 rounded-lg border transition-all duration-200
                                                    bg-zinc-50 dark:bg-zinc-900 border-zinc-700 hover:border-blue-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-grab active:cursor-grabbing hover:shadow-lg hover:shadow-blue-500/10"
                                                >
                                                    <div className="flex-shrink-0">
                                                        <Grip className="h-4 w-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="flex items-center gap-1">
                                                                {repo.private ? (
                                                                    <Lock className="h-3 w-3 text-orange-400" />
                                                                ) : (
                                                                    <Eye className="h-3 w-3 text-green-400" />
                                                                )}
                                                                <span className="text-sm font-semibold text-black dark:text-white truncate">
                                                                    {repo.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-zinc-400 truncate">
                                                            {repo.full_name}
                                                        </div>
                                                        {repo.description && (
                                                            <div className="text-xs text-zinc-500 truncate mt-1">
                                                                {repo.description}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Kéo để thêm
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drop Zone Desktop */}
                    <div
                        className={`
                            flex-1 flex flex-col min-w-0 transition-all duration-300 
                            ${isDragOver
                                ? 'bg-blue-950/20'
                                : 'bg-zinc-50 dark:bg-zinc-950'
                            }
                        `}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={`p-6 pb-2 flex items-center justify-between border-b transition-colors ${isDragOver ? 'border-blue-600' : 'border-zinc-800'}`}>
                            <div className="text-lg font-semibold flex items-center text-black dark:text-white">
                                <Github className="h-6 w-6 mr-2" />
                                Repository trong kênh
                            </div>
                            {isDragOver && (
                                <div className="flex items-center gap-2 text-blue-400">
                                    <ArrowRight className="h-4 w-4 animate-pulse" />
                                    <span className="text-sm font-medium">Thả để thêm vào kênh</span>
                                </div>
                            )}
                        </div>

                        <div className={`flex-1 min-h-0 overflow-y-auto p-6 transition-all ${isDragOver ? 'border-2 border-dashed border-blue-500 rounded-lg m-2' : ''}`}>
                            {isDragOver ? (
                                <div className="flex flex-col items-center justify-center h-full text-blue-400">
                                    <div className="relative mb-6">
                                        <Github className="h-20 w-20 animate-pulse" />
                                        <div className="absolute -top-2 -right-2 h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <ArrowRight className="h-4 w-4 text-black dark:text-white" />
                                        </div>
                                    </div>
                                    <div className="text-2xl font-bold mb-3">Thả repository vào đây</div>
                                    <div className="text-sm opacity-75 text-center max-w-md">
                                        Repository sẽ được thêm vào kênh và tất cả thành viên có thể xem nội dung
                                    </div>
                                </div>
                            ) : (
                                <RepoChatList
                                    repos={repoChannel}
                                    loading={loadingChannelRepos}
                                    onRefresh={loadRepoChannel}
                                    channel_id={localStorage.getItem("selectedChannelId") || ''}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}