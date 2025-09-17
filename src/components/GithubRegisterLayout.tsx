import { AuthAPI, GithubAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/useToast";
import authService from "@/services/authService";
import { Github, ExternalLink, Shield, Lock, RefreshCw, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";

type GHOwner = { login: string; avatar_url: string; html_url: string };
type GHRepo = {
    id: number; name: string; full_name: string; private: boolean;
    html_url: string; description: string | null; language: string | null;
    updated_at?: string; owner?: GHOwner;
};

export default function GithubRegisterLayout() {
    const { user } = useAuth();
    const installed = Boolean(user?.github_installation_id);

    const [repos, setRepos] = useState<GHRepo[]>([]);
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false);
    const [query, setQuery] = useState("");
    const [summary, setSummary] = useState<{ total_count?: number; selection?: string }>({});

    const handleRedirect = async () => {
        try {
            setRedirecting(true);
            const { url }: any = await authService.installGitHubApp();
            window.location.href = url;
        } catch (error: any) {
            setRedirecting(false);
            toast({
                title: "Liên kết GitHub thất bại",
                description: error?.message || "Có lỗi xảy ra",
                variant: "destructive",
            });
        }
    };

    const handleSkip = () => {
        localStorage.setItem("needs_github_link", "false");
        window.location.href = "/";
    };

    const handleDisableNotify = async () => {
        try {
            await AuthAPI.updateProfile({ github_verified: true });
            handleSkip();
        } catch (e: any) {
            toast({
                title: "Không thể cập nhật",
                description: e?.message || "Vui lòng thử lại.",
                variant: "destructive",
            });
        }
    };

    const parseRepoPayload = (res: any) => {
        const payload = res?.data;
        const dataNode = Array.isArray(payload)
            ? payload
            : payload?.repositories ?? payload?.data ?? [];
        const total_count =
            (typeof payload?.total_count === "number" && payload.total_count) ||
            (Array.isArray(dataNode) ? dataNode.length : undefined);
        const selection = payload?.repository_selection;
        return { repos: Array.isArray(dataNode) ? (dataNode as GHRepo[]) : [], total_count, selection };
    };

    const loadRepo = useCallback(async () => {
        if (!installed) return;
        setLoading(true);
        try {
            const res = await GithubAPI.getInstallationRepos();
            const { repos, total_count, selection } = parseRepoPayload(res);
            setRepos(repos);
            setSummary({ total_count, selection });
        } catch (e: any) {
            toast({
                title: "Không tải được danh sách repo",
                description: e?.message || "Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [installed]);

    useEffect(() => {
        loadRepo();
    }, [loadRepo]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return repos;
        return repos.filter((r) =>
            `${r.name} ${r.full_name} ${r.description || ""} ${r.language || ""}`
                .toLowerCase()
                .includes(q)
        );
    }, [repos, query]);

    // Chưa cài installation → card hướng dẫn (giữ màu hiện có)
    if (!installed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--chat-background))] p-4">
                <Card className="w-full max-w-md bg-sidebar border-sidebar-border">
                    <CardHeader className="text-center">
                        <Github className="h-10 w-10 mx-auto text-primary mb-2" />
                        <CardTitle className="text-xl font-bold text-sidebar-foreground">Liên kết tài khoản Github</CardTitle>
                        <CardDescription className="text-sidebar-foreground/80 mt-2">
                            Để sử dụng đầy đủ tính năng, hãy liên kết tài khoản Github của bạn với CodeSync Chat.
                            <br />
                            <span className="text-xs text-muted-foreground">(Bạn có thể bỏ qua bước này và liên kết sau trong phần cài đặt)</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside text-sm text-sidebar-foreground mb-4 space-y-2">
                            <li>Bấm nút <span className="font-semibold text-primary">Liên kết Github</span> bên dưới.</li>
                            <li>Đăng nhập và cấp quyền cho ứng dụng CodeSync Chat trên Github.</li>
                            <li>Quay lại ứng dụng để sử dụng các tính năng đồng bộ code và repo.</li>
                        </ol>
                        <div className="flex gap-2 mt-4">
                            <Button className="flex-1 flex items-center justify-center gap-2" onClick={handleRedirect} disabled={redirecting} aria-busy={redirecting}>
                                {redirecting ? (<><Loader2 className="h-5 w-5 animate-spin" />Đang mở GitHub…</>) : (<><Github className="h-5 w-5" />Liên kết Github</>)}
                            </Button>
                            <Button className="flex-1" variant="outline" onClick={handleSkip}>Bỏ qua</Button>
                        </div>
                        <Button variant="ghost" className="w-full mt-2 text-xs text-muted-foreground" onClick={handleDisableNotify}>
                            Không nhận thông báo này nữa
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Đã cài installation → Bảng repo với Table component
    return (
        <div className="min-h-screen bg-[hsl(var(--chat-background))] p-4">
            <div className="mx-auto w-full max-w-5xl">
                <Card className="bg-sidebar border-sidebar-border">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-sidebar-foreground flex items-center gap-2">
                                <Github className="h-5 w-5 text-primary" />
                                Repository đã cấp quyền
                            </CardTitle>
                            <CardDescription className="text-sidebar-foreground/80 pt-5">
                                {summary.total_count != null ? (
                                    <>
                                        Tổng: <span className="font-medium">{summary.total_count}</span>{" "}
                                        {summary.selection ? (
                                            <span className="text-xs text-muted-foreground">(selection: {summary.selection})</span>
                                        ) : null}
                                    </>
                                ) : "Danh sách các repository trong installation này."}
                            </CardDescription>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Tìm theo tên, mô tả, ngôn ngữ…"
                                className="w-full md:w-64 rounded-md border border-sidebar-border bg-sidebar px-3 py-2 text-sm text-sidebar-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                                aria-label="Lọc repository"
                            />
                            <Button variant="outline" onClick={loadRepo} disabled={loading} aria-busy={loading} className="shrink-0" title="Làm mới">
                                {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /><span className="ml-2">Đang tải…</span></>) : (<><RefreshCw className="h-4 w-4" /><span className="ml-2 hidden sm:inline">Làm mới</span></>)}
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table className="min-w-[720px]">
                            <TableCaption className="text-muted-foreground">
                                {filtered.length > 0 ? "Danh sách repository từ GitHub App installation." : "—"}
                            </TableCaption>

                            <TableHeader>
                                <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
                                    <TableHead className="w-[45%]">Repository</TableHead>
                                    <TableHead className="w-[15%]">Visibility</TableHead>
                                    <TableHead className="w-[15%]">Language</TableHead>
                                    <TableHead className="w-[15%]">Updated</TableHead>
                                    <TableHead className="w-[10%] text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {loading &&
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={`sk-${i}`} className="border-sidebar-border/60">
                                            <TableCell>
                                                <div className="h-4 w-40 rounded bg-sidebar-border/60 animate-pulse" />
                                                <div className="mt-1 h-3 w-64 rounded bg-sidebar-border/40 animate-pulse" />
                                            </TableCell>
                                            <TableCell><div className="h-4 w-16 rounded bg-sidebar-border/60 animate-pulse" /></TableCell>
                                            <TableCell><div className="h-4 w-20 rounded bg-sidebar-border/60 animate-pulse" /></TableCell>
                                            <TableCell><div className="h-4 w-24 rounded bg-sidebar-border/60 animate-pulse" /></TableCell>
                                            <TableCell><div className="ml-auto h-8 w-28 rounded bg-sidebar-border/60 animate-pulse" /></TableCell>
                                        </TableRow>
                                    ))}

                                {!loading && filtered.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                                            <TableRow key={r.id} className="border-sidebar-border/60">
                                                <TableCell>
                                                    <div className="flex items-start gap-3 text-gray-200">
                                                        {r.owner?.avatar_url ? (
                                                            <img
                                                                src={r.owner.avatar_url}
                                                                alt={r.owner?.login || "owner"}
                                                                className="h-8 w-8 rounded-md"
                                                                loading="lazy"
                                                            />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-md bg-sidebar-border" />
                                                        )}
                                                        <div>
                                                            <div className="font-medium truncate max-w-[360px]">
                                                                {r.full_name || r.name}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground line-clamp-1 max-w-[480px]">
                                                                {r.description || "—"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell>
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-200">
                                                        {r.private ? (<><Lock className="h-3.5 w-3.5" />Private</>) : (<><Shield className="h-3.5 w-3.5" />Public</>)}
                                                    </span>
                                                </TableCell>

                                                <TableCell><span className="text-xs text-gray-200">{r.language || "—"}</span></TableCell>

                                                <TableCell><span className="text-xs text-gray-200">{updated || "—"}</span></TableCell>

                                                <TableCell>
                                                    <div className="flex justify-end">
                                                        <Button asChild variant="outline" size="sm" className="gap-1">
                                                            <a href={r.html_url} target="_blank" rel="noopener noreferrer" aria-label={`Mở ${r.full_name || r.name} trên GitHub`}>
                                                                <ExternalLink className="h-4 w-4" />
                                                                Mở GitHub
                                                            </a>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
