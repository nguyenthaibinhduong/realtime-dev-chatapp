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
} from "lucide-react";
import { useState, useMemo } from "react";
import RepoDetailModal from "./RepoDetailModal"; // modal chi tiết repo

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
    repos: GHRepo[];
    loading: boolean;
    onRefresh?: () => Promise<void> | void;
};

export default function RepoTable({
    repos,
    loading,
    onRefresh,
}: RepoTableProps) {
    const [query, setQuery] = useState("");
    const [selectedRepo, setSelectedRepo] = useState<GHRepo | null>(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return repos;
        return repos.filter((r) =>
            `${r.name} ${r.full_name} ${r.description || ""} ${r.language || ""}`
                .toLowerCase()
                .includes(q)
        );
    }, [repos, query]);

    return (
        <div className="space-y-4 p-3">
            {/* Title + icon */}
            <div className="flex items-center justify-between"> <div className="flex items-center gap-2 mb-2">
                <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-6 w-6 text-black dark:text-white"
                >
                    <path d="M12 2C6.477 2 2 6.484 2 12.012c0 4.425 2.867 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.37-1.342-3.37-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.646.35-1.088.636-1.34-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.254-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.025 2.747-1.025.546 1.378.202 2.396.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.135 20.19 22 16.437 22 12.012 22 6.484 17.523 2 12 2z" />
                </svg>
                <span className="text-xl font-bold text-black dark:text-white">
                    Danh sách Repository được cấp quyền
                </span>
            </div>

                {/* Header controls */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm repository…"
                            className="w-full md:w-72 pl-9 pr-8 py-2 rounded-md border border-gray-700 bg-gray-900 text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                            className="shrink-0"
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

                                return (
                                    <TableRow
                                        key={r.id}
                                        className="border-gray-800 cursor-pointer hover:bg-gray-800/40"
                                        onClick={() => setSelectedRepo(r)}
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
                                                    <div className="font-medium text-gray-800 dark:text-gray-100 truncate max-w-[360px]">
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

                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex justify-end">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-1"
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
                />
            )}
        </div>
    );
}
