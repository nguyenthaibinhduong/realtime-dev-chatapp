import { useEffect, useState } from "react";
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

export function RepoChatDialog({ open, onOpenChange, channel_id }: { open: boolean; onOpenChange: (v: boolean) => void, channel_id: string }) {
    const [repos, setRepos] = useState<any[]>([]);
    const [repoChannel, setRepoChannel] = useState<any[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [loadingChannelRepos, setLoadingChannelRepos] = useState(false);
    const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
    const [showRepoDropdown, setShowRepoDropdown] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    // Load tất cả repo user có quyền
    useEffect(() => {
        const loadRepo = async () => {
            setLoadingRepos(true);
            try {

                const res1 = await GithubAPI.getInstallationRepos();
                const payload1 = res1?.data;
                const dataNode = Array.isArray(payload1)
                    ? payload1
                    : payload1?.repositories ?? payload1?.data ?? [];
                setRepos(Array.isArray(dataNode) ? dataNode : []);

            } catch (e: any) {
                toast({
                    title: "Không tải được danh sách repo",
                    description: e?.message || "Vui lòng thử lại.",
                    variant: "destructive",
                });
            } finally {
                setLoadingRepos(false);
            }
        };
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
            }
        }
    }, [open, user.github_installation_id]);

    // Load repo đã gắn với channel
    const loadRepoChannel = async () => {
        setLoadingChannelRepos(true);
        try {
            const res2 = await GithubAPI.getRepoForChannel({ channel_id });
            const payload2 = res2?.data;
            setRepoChannel(Array.isArray(payload2) ? payload2 : []);
            console.log("Repo channel:", payload2);
        } catch (e: any) {
            toast({
                title: "Không tải được danh sách repo đã gắn",
                description: e?.message || "Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setLoadingChannelRepos(false);
        }
    };

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
                loadRepoChannel();
            }
        }
        // eslint-disable-next-line
    }, [open, user.github_installation_id]);

    // Thêm repo vào channel
    const handleAddRepos = async () => {
        try {
            // Gọi API backend để gắn repo vào channel, ví dụ:
            await GithubAPI.addReposToChannel({ channel_id, repository_ids: selectedRepoIds });
            toast({
                title: "Đã thêm repository vào kênh!",
            });
            setSelectedRepoIds([]);
            setShowRepoDropdown(false);
            await loadRepoChannel();
        } catch (e: any) {
            toast({
                title: "Không thể thêm repository",
                description: e?.message || "Vui lòng thử lại.",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-[90vw] h-[90vh] bg-black text-white border border-zinc-700 p-0 flex overflow-hidden">
                {/* Bên trái: chọn repo để thêm */}
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
                {/* Bên phải: danh sách repo đã gắn với channel */}
                <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
                    <div className="p-6 pb-2 flex items-center justify-between border-b border-zinc-800">
                        <div className="text-lg font-semibold flex items-center text-white"><Github className="h-6 w-6 mr-2" />Repository đã thêm vào kênh</div>
                        {/* <Button
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-black"
                            onClick={loadRepoChannel}
                            disabled={loadingChannelRepos}
                        >
                            <Github className="h-4 w-4 mr-2" />
                            Làm mới
                        </Button> */}
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto p-6">
                        <RepoChatList
                            repos={repoChannel}
                            loading={loadingChannelRepos}
                            onRefresh={loadRepoChannel}
                        />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}