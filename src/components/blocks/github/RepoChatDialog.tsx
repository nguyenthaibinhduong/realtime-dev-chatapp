import { useCallback, useEffect, useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Github, Check, ChevronDown, Plus } from "lucide-react";
import { GithubAPI } from "@/api/api";
import { toast } from "@/hooks/useToast";
import RepoChatList from "./RepoChatList"; // Đã có sẵn
import { log } from "console";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { chatSocketService } from "@/services/chatSocketService";

export function RepoChatDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
    const [repos, setRepos] = useState<any[]>([]);
    const [repoChannel, setRepoChannel] = useState<any[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [loadingChannelRepos, setLoadingChannelRepos] = useState(false);
    const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
    const [showRepoDropdown, setShowRepoDropdown] = useState(false);
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
            if (!user.github_installation_id) {
                toast({
                    title: "Chưa kết nối GitHub",
                    description: "Vui lòng kết nối GitHub trước khi sử dụng chức năng này",
                });
                navigate("/auth/github/register");
                return;
            } else {
                loadRepo();
                loadRepoChannel();
            }
        }
        // eslint-disable-next-line
    }, [open, user?.github_installation_id, loadRepo, loadRepoChannel]);

    // Thêm repo vào channel
    const handleAddRepos = async () => {
        try {
            const res = await GithubAPI.addReposToChannel({ channel_id: channelId, repository_ids: selectedRepoIds });
            if (res?.status == 201 || res?.status == 200) {
                toast({
                    title: "Đã thêm repository vào kênh!",
                });
                setSelectedRepoIds([]);
                setShowRepoDropdown(false);
                chatSocketService.sendMessage({
                    channelId: channelId,
                    text: `đã thêm ${selectedRepoIds.length} repository mới vào kênh.`,
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
    };

    // Responsive: kiểm tra mobile qua Tailwind (md:hidden, md:flex)
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="w-full max-w-[90vw] h-[90vh] p-0 bg-black text-white border border-zinc-700 flex overflow-hidden"
            >
                {/* Mobile */}
                <div className="flex flex-col h-screen w-full md:hidden">
                    {/* Chọn repo để thêm */}
                    <div className="w-full border-b border-zinc-800 flex-shrink-0">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-lg flex items-center gap-2">
                                <Github className="h-6 w-6" /> Thêm repository vào kênh
                            </DialogTitle>
                            <div className="mt-2 text-xs text-zinc-400 italic">
                                * Khi kết nối, mọi người trong kênh sẽ có thể xem thông tin repository của bạn.
                            </div>
                        </DialogHeader>
                        <div className="p-6 pt-2 flex-1 flex flex-col">
                            <p className="mb-2 text-sm text-zinc-300">
                                Chọn repository Git bạn muốn thêm vào kênh:
                            </p>
                            {loadingRepos ? (
                                <div className="text-center text-sm text-zinc-400 py-6">Đang tải danh sách repo…</div>
                            ) : (
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between border rounded px-3 py-2 text-sm bg-zinc-900 text-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                                        onClick={() => setShowRepoDropdown((v) => !v)}
                                    >
                                        {selectedRepoIds.length === 0
                                            ? <span className="text-zinc-400">-- Chọn repository --</span>
                                            : selectedRepoIds.length === repos.length
                                                ? <span>Tất cả repository ({repos.length})</span>
                                                : selectedRepoIds.length === 1
                                                    ? repos.find(r => r.id === selectedRepoIds[0])?.full_name
                                                    : <span>Đã chọn {selectedRepoIds.length} repository</span>
                                        }
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </button>
                                    {showRepoDropdown && (
                                        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded shadow-lg animate-fade-in">
                                            <div
                                                className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                                onClick={() => {
                                                    if (selectedRepoIds.length === repos.length) {
                                                        setSelectedRepoIds([]);
                                                    } else {
                                                        setSelectedRepoIds(repos.map((repo: any) => repo.id));
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRepoIds.length === repos.length}
                                                    readOnly
                                                    className="accent-blue-500"
                                                />
                                                <span className="text-sm">
                                                    {selectedRepoIds.length === repos.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                                </span>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {repos.map((repo: any) => (
                                                    <div
                                                        key={repo.id}
                                                        className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                                        onClick={() => {
                                                            if (selectedRepoIds.includes(repo.id)) {
                                                                setSelectedRepoIds(selectedRepoIds.filter(id => id !== repo.id));
                                                            } else {
                                                                setSelectedRepoIds([...selectedRepoIds, repo.id]);
                                                            }
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRepoIds.includes(repo.id)}
                                                            readOnly
                                                            className="accent-blue-500"
                                                        />
                                                        <span className="text-sm truncate">{repo.full_name}</span>
                                                        {selectedRepoIds.includes(repo.id) && (
                                                            <Check className="h-4 w-4 text-blue-500 ml-auto" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Đóng dropdown khi click ngoài */}
                                    {showRepoDropdown && (
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowRepoDropdown(false)}
                                            tabIndex={-1}
                                        />
                                    )}
                                </div>
                            )}
                            <Button
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white border-0 flex items-center justify-center gap-2"
                                onClick={handleAddRepos}
                                disabled={selectedRepoIds.length === 0}
                            >
                                <Plus className="h-4 w-4" /> Thêm vào kênh
                            </Button>
                        </div>
                    </div>
                    {/* Danh sách repo đã gắn với channel */}
                    <div className="flex-1 min-h-0 overflow-y-auto bg-zinc-950 p-4">
                        <div className="pb-2 flex items-center justify-between border-b border-zinc-800">
                            <div className="text-lg font-semibold flex items-center text-white">
                                <Github className="h-6 w-6 mr-2" />Repository đã thêm vào kênh
                            </div>
                        </div>
                        <RepoChatList
                            repos={repoChannel}
                            loading={loadingChannelRepos}
                            onRefresh={loadRepoChannel}
                            channel_id={localStorage.getItem("selectedChannelId") || ''}
                        />
                    </div>
                </div>
                {/* Desktop */}
                <div className="hidden md:flex w-full h-full">
                    <div className="w-full max-w-sm border-r border-zinc-800 flex flex-col">
                        <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-lg flex items-center gap-2">
                                <Github className="h-6 w-6" /> Thêm repository vào kênh
                            </DialogTitle>
                            <div className="mt-2 text-xs text-zinc-400 italic">
                                * Khi kết nối, mọi người trong kênh sẽ có thể xem thông tin repository của bạn.
                            </div>
                        </DialogHeader>
                        <div className="p-6 pt-2 flex-1 flex flex-col">
                            <p className="mb-2 text-sm text-zinc-300">
                                Chọn repository Git bạn muốn thêm vào kênh:
                            </p>
                            {loadingRepos ? (
                                <div className="text-center text-sm text-zinc-400 py-6">Đang tải danh sách repo…</div>
                            ) : (
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-between border rounded px-3 py-2 text-sm bg-zinc-900 text-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                                        onClick={() => setShowRepoDropdown((v) => !v)}
                                    >
                                        {selectedRepoIds.length === 0
                                            ? <span className="text-zinc-400">-- Chọn repository --</span>
                                            : selectedRepoIds.length === repos.length
                                                ? <span>Tất cả repository ({repos.length})</span>
                                                : selectedRepoIds.length === 1
                                                    ? repos.find(r => r.id === selectedRepoIds[0])?.full_name
                                                    : <span>Đã chọn {selectedRepoIds.length} repository</span>
                                        }
                                        <ChevronDown className="h-4 w-4 ml-2" />
                                    </button>
                                    {showRepoDropdown && (
                                        <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700 rounded shadow-lg animate-fade-in">
                                            <div
                                                className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                                onClick={() => {
                                                    if (selectedRepoIds.length === repos.length) {
                                                        setSelectedRepoIds([]);
                                                    } else {
                                                        setSelectedRepoIds(repos.map((repo: any) => repo.id));
                                                    }
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRepoIds.length === repos.length}
                                                    readOnly
                                                    className="accent-blue-500"
                                                />
                                                <span className="text-sm">
                                                    {selectedRepoIds.length === repos.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                                </span>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {repos.map((repo: any) => (
                                                    <div
                                                        key={repo.id}
                                                        className="px-3 py-2 hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                                                        onClick={() => {
                                                            if (selectedRepoIds.includes(repo.id)) {
                                                                setSelectedRepoIds(selectedRepoIds.filter(id => id !== repo.id));
                                                            } else {
                                                                setSelectedRepoIds([...selectedRepoIds, repo.id]);
                                                            }
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedRepoIds.includes(repo.id)}
                                                            readOnly
                                                            className="accent-blue-500"
                                                        />
                                                        <span className="text-sm truncate">{repo.full_name}</span>
                                                        {selectedRepoIds.includes(repo.id) && (
                                                            <Check className="h-4 w-4 text-blue-500 ml-auto" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Đóng dropdown khi click ngoài */}
                                    {showRepoDropdown && (
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowRepoDropdown(false)}
                                            tabIndex={-1}
                                        />
                                    )}
                                </div>
                            )}
                            <Button
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white border-0 flex items-center justify-center gap-2"
                                onClick={handleAddRepos}
                                disabled={selectedRepoIds.length === 0}
                            >
                                <Plus className="h-4 w-4" /> Thêm vào kênh
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
                        <div className="p-6 pb-2 flex items-center justify-between border-b border-zinc-800">
                            <div className="text-lg font-semibold flex items-center text-white"><Github className="h-6 w-6 mr-2" />Repository đã thêm vào kênh</div>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto p-6">
                            <RepoChatList
                                repos={repoChannel}
                                loading={loadingChannelRepos}
                                onRefresh={loadRepoChannel}

                            />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}