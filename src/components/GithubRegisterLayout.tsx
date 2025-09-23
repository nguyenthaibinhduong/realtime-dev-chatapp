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
import RepoTable from "./blocks/github/RepoTable";

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
        if (!installed || !user || !user.github_verified || !user.github_installation_id) return;
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
    }, [installed, user]);

    useEffect(() => {
        if (user && installed && user.github_verified && user.github_installation_id) {
            //loadRepo();
        }
    }, [user.github_installation_id]);

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
                            <Button className="flex-1" variant="outline" onClick={handleDisableNotify}>Bỏ qua</Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        );
    }

    // Đã cài installation → Bảng repo với Table component
    return (
        <Card className="bg-sidebar border-sidebar-border">
            <RepoTable repos={repos} loading={loading} onRefresh={loadRepo} />
        </Card>
    );
}
