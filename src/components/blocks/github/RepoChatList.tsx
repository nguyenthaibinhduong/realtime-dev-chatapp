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
import { useToast } from "@/hooks/useToast";
import { chatSocketService } from "@/services/chatSocketService";
import { blockUi } from "@/components/blocks/block-ui";

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
    isAdminView?: boolean; // Admin có thể xóa mọi repo
};

export default function RepoChatList({
    repos,
    loading,
    onRefresh,
    channel_id,
    isAdminView = false,
}: RepoTableProps) {
    const [query, setQuery] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
    const [hoveredRepoId, setHoveredRepoId] = useState<number | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

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
    const handleRemoveRepo = async (repoId: number, repoName: string) => {
        if (!localStorage.getItem("selectedChannelId") || !repoId) return;
        try {
            await GithubAPI.removeReposToChannel({
                channel_id: localStorage.getItem("selectedChannelId"),
                repository_id: repoId,
            });
            chatSocketService.sendMessage({
                channelId: localStorage.getItem("selectedChannelId"),
                text: `đã xóa repository ${repoName} ra khỏi kênh.`,
                type: 'notification',
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
        <div className="space-y-4 text-foreground">
            {/* Header controls */}
            <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Tìm repository…"
                        className={`w-full md:w-72 pl-9 pr-8 py-2 rounded-md border text-sm focus:outline-none focus:ring-2 ${blockUi.input}`}
                        aria-label="Lọc repository"
                    />
                    {query && (
                        <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        className={`shrink-0 ${blockUi.subtleButton}`}
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
            <div className={blockUi.tableWrap}>
                <Table className="min-w-[800px]">
                    <TableCaption className="text-muted-foreground">
                        {filtered.length > 0
                            ? "Danh sách repository từ GitHub App installation."
                            : "—"}
                    </TableCaption>
                    <TableHeader>
                        <TableRow className={blockUi.tableHead}>
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
                                <TableRow key={`sk-${i}`} className="border-border">
                                    <TableCell>
                                        <div className={`h-4 w-40 ${blockUi.skeleton}`} />
                                        <div className={`mt-1 h-3 w-64 ${blockUi.skeleton}`} />
                                    </TableCell>
                                    <TableCell>
                                        <div className={`h-4 w-16 ${blockUi.skeleton}`} />
                                    </TableCell>
                                    <TableCell>
                                        <div className={`h-4 w-20 ${blockUi.skeleton}`} />
                                    </TableCell>
                                    <TableCell>
                                        <div className={`h-4 w-24 ${blockUi.skeleton}`} />
                                    </TableCell>
                                    <TableCell>
                                        <div className={`ml-auto h-8 w-20 ${blockUi.skeleton}`} />
                                    </TableCell>
                                </TableRow>
                            ))}

                        {!loading && filtered.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="text-center text-muted-foreground py-8"
                                >
                                    Chưa có repository
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
                                        className={`cursor-pointer group ${blockUi.tableRow}`}
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
                                                    <div className="h-8 w-8 rounded-md bg-muted" />
                                                )}
                                                <div>
                                                    <div className="font-medium text-foreground truncate max-w-[360px]">
                                                        {r.full_name || r.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground line-clamp-1 max-w-[480px]">
                                                        {r.description || "—"}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
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
                                            <span className="text-xs text-muted-foreground">
                                                {r.language || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {updated || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                            className="relative min-h-[40px] h-10"
                                        >
                                            <div className="flex justify-end items-center gap-2 h-10">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className={`gap-1 ${blockUi.subtleButton}`}
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
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className={`bg-background text-red-600 border-border hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full ml-1 transition-all
                ${(isAdminView || user?.id === repoUserId) && hoveredRepoId === r.id ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                                                    title={isAdminView ? "Xóa khỏi kênh (Admin)" : "Xóa khỏi kênh"}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmDelete({ id: r.id, name: r.full_name || r.name });
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

            {/* Modal xác nhận xóa */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
                    <div className={`rounded-xl p-6 min-w-[320px] max-w-[90vw] ${blockUi.dialog}`}>
                        <div className="text-lg font-semibold text-foreground mb-2">
                            Xác nhận xóa repository
                        </div>
                        <div className="text-muted-foreground mb-4">
                            Bạn có muốn xóa repository <span className="font-bold">{confirmDelete.name}</span> ra khỏi kênh chat không?
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                className={blockUi.subtleButton}
                                onClick={() => setConfirmDelete(null)}
                            >
                                Không
                            </Button>
                            <Button
                                variant="destructive"
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={async () => {
                                    await handleRemoveRepo(confirmDelete.id, confirmDelete.name);
                                    setConfirmDelete(null);
                                }}
                            >
                                Có, xóa
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chi tiết repo */}
            {selectedRepo && (
                <RepoDetailModal
                    repo={selectedRepo}
                    onClose={() => setSelectedRepo(null)}
                    installation_id={repos.find((item) => item.repo_info?.id === selectedRepo.id)?.repo_installation}
                />
            )}
        </div>
    );
}
