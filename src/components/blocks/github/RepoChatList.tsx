import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    ExternalLink,
    Shield,
    Lock,
    RefreshCw,
    Loader2,
    Search,
    X,
    Trash2,
} from "lucide-react";
import { useState, useMemo } from "react";
import RepoDetailModal from "./RepoDetailModal"; // Modal chi tiết repo
import { useAuth } from "@/hooks/useAuth";
import { GithubAPI } from "@/api/api";
import { toast } from "sonner";
import { useToast } from "@/hooks/useToast";
import { chatSocketService } from "@/services/chatSocketService";

type GHOwner = { login: string; avatar_url: string; html_url: string };
export type GHRepo = {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    html_url: string;
    description: string | null;
    language: string | null;
    updated_at?: string;
    owner?: GHOwner;
};

type RepoTableProps = {
    repos: any[]; // nhận mảng object có repo_info
    loading: boolean;
    onRefresh?: () => Promise<void> | void;
    channel_id?: string;
};

export default function RepoChatList({
    repos,
    loading,
    onRefresh,
    channel_id,
}: RepoTableProps) {
    const [query, setQuery] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
    const [hoveredRepoId, setHoveredRepoId] = useState<number | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    // Map lại dữ liệu: lấy repo_info nếu có
    const repoList = useMemo(() => {
        return repos.map((item) => item.repo_info ? item.repo_info : item);
    }, [repos]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return repoList;
        return repoList.filter((r) =>
            `${r.name} ${r.full_name} ${r.description || ""} ${r.language || ""}`
                .toLowerCase()
                .includes(q)
        );
    }, [repoList, query]);

    // Xóa repo khỏi channel
    const handleRemoveRepo = async (repoId: number) => {
        if (!channel_id || !repoId) return;
        try {
            await GithubAPI.removeReposToChannel({
                channel_id: channel_id,
                repository_id: repoId,
            });
            chatSocketService.sendMessage({
                channelId: channel_id,
                text: 'đã xóa 1 repository ra khỏi kênh.',
                type: 'notification',
                // Include attachments if any
            });
            if (onRefresh) await onRefresh();
        } catch (e) {
            toast({
                title: "Không thể xóa repository",
                description: (e as any)?.response?.data?.msg || "Vui lòng thử lại.",
                variant: "destructive",
            })
        }
    };

    return (
        <div className="space-y-4">
            {/* Header controls */}
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm repository…"
                        className="w-full md:w-72 pl-9 pr-8 py-2 rounded-md border border-gray-700 bg-gray-900 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        aria-label="Lọc repository"
                    />
                    {query && (
                        <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                            onClick={() => setQuery("")}
                            aria-label="Clear"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                {onRefresh && (
                    <Button
                        variant="outline"
                        onClick={onRefresh}
                        disabled={loading}
                        aria-busy={loading}
                        className="shrink-0 text-black"
                        title="Làm mới"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="ml-2">Đang tải…</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                <span className="ml-2 hidden sm:inline">Làm mới</span>
                            </>
                        )}
                    </Button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-700">
                <Table className="min-w-[800px]">
                    <TableCaption className="text-gray-500">
                        {filtered.length > 0
                            ? "Danh sách repository từ GitHub App installation."
                            : "—"}
                    </TableCaption>
                    <TableHeader>
                        <TableRow className="text-xs uppercase tracking-wide text-gray-400 bg-gray-800/50">
                            <TableHead className="w-[45%]">Repository</TableHead>
                            <TableHead className="w-[15%]">Visibility</TableHead>
                            <TableHead className="w-[15%]">Language</TableHead>
                            <TableHead className="w-[15%]">Updated</TableHead>
                            <TableHead className="w-[10%] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading &&
                            Array.from({ length: 6 }).map((_, i) => (
                                <TableRow key={`sk-${i}`} className="border-gray-800">
                                    <TableCell>
                                        <div className="h-4 w-40 rounded bg-gray-800 animate-pulse" />
                                        <div className="mt-1 h-3 w-64 rounded bg-gray-800/60 animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-16 rounded bg-gray-800 animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-20 rounded bg-gray-800 animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-24 rounded bg-gray-800 animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="ml-auto h-8 w-20 rounded bg-gray-800 animate-pulse" />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {!loading && filtered.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-gray-500 py-8"
                                >
                                    Không có repository nào phù hợp bộ lọc.
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            filtered.map((r) => {
                                const updated =
                                    r.updated_at &&
                                    new Intl.DateTimeFormat(undefined, {
                                        year: "numeric",
                                        month: "short",
                                        day: "2-digit",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }).format(new Date(r.updated_at));

                                // Lấy user_id từ item gốc (repo_info hoặc item)
                                const repoItem = repos.find(
                                    (item) =>
                                        (item.repo_info?.id ?? item.id) === r.id
                                );
                                const repoUserId = repoItem?.user_id;

                                return (
                                    <TableRow
                                        key={r.id}
                                        className="border-gray-800 cursor-pointer hover:bg-gray-800/40 group"
                                        onClick={() => setSelectedRepo(r)}
                                        onMouseEnter={() => setHoveredRepoId(r.id)}
                                        onMouseLeave={() => setHoveredRepoId(null)}
                                    >
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                {r.owner?.avatar_url ? (
                                                    <img
                                                        src={r.owner.avatar_url}
                                                        alt={r.owner?.login || "owner"}
                                                        className="h-8 w-8 rounded-md"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-md bg-gray-700" />
                                                )}
                                                <div>
                                                    <div className="font-medium text-gray-100 truncate max-w-[360px]">
                                                        {r.full_name || r.name}
                                                    </div>
                                                    <div className="text-xs text-gray-400 line-clamp-1 max-w-[480px]">
                                                        {r.description || "—"}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 text-xs text-gray-200">
                                                {r.private ? (
                                                    <>
                                                        <Lock className="h-3.5 w-3.5" /> Private
                                                    </>
                                                ) : (
                                                    <>
                                                        <Shield className="h-3.5 w-3.5" /> Public
                                                    </>
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-gray-200">
                                                {r.language || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-gray-200">
                                                {updated || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                            className="relative min-h-[40px] h-10"
                                        >
                                            <div className="flex justify-end items-center gap-2 h-10">
                                                {/* Nút GitHub luôn nằm trước */}
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1 bg-white text-black border-gray-300 hover:bg-gray-100"
                                                >
                                                    <a
                                                        href={r.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`Mở ${r.full_name || r.name} trên GitHub`}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                        GitHub
                                                    </a>
                                                </Button>
                                                {/* Nút xóa luôn render, nằm sau nút GitHub, không absolute để không đè lên */}
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className={`bg-white text-red-600 border-gray-300 rounded-full ml-1 transition-all
                ${user?.id === repoUserId && hoveredRepoId === r.id ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                                                    title="Xóa khỏi kênh"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        await handleRemoveRepo(r.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </div>

            {/* Modal chi tiết repo */}
            {selectedRepo && (
                <RepoDetailModal
                    repo={selectedRepo}
                    onClose={() => setSelectedRepo(null)}
                    installation_id={repos.find((item) => item.repo_info?.id === selectedRepo.id)?.user_id}
                />
            )}
        </div>
    );
}
