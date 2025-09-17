import { AuthAPI, GithubAPI } from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { toast } from "@/hooks/useToast";
import authService from "@/services/authService";
import { Github } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

export default function GithubRegisterLayout() {
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const handleRedirect = async () => {
        try {
            // Chỉ redirect đến GitHub OAuth
            const { url }: any = await authService.installGitHubApp();
            window.location.href = url;
        } catch (error: any) {
            console.error("Lỗi Liên kết GitHub:", error);
            toast({
                title: "Liên kết GitHub thất bại",
                description: error.message || "Có lỗi xảy ra",
                variant: "destructive",
            });
        }
    };

    const handleSkip = () => {
        localStorage.setItem("needs_github_link", "false");
        window.location.href = "/";
    };

    const handleDisableNotify = async () => {
        await AuthAPI.updateProfile({ github_verified: true });
        handleSkip();
    };

    const loadRepo = useCallback(async () => {
        if (!user.github_installation_id) return;
        setLoading(true);
        try {
            const res = await GithubAPI.getInstallationRepos(); // server nên trả { data: [...] }
            const list = res?.data || [];
            setRepos(list);
            console.log("Repos:", list);
        } catch (e: any) {
            console.error("Load repos failed:", e);
            toast({
                title: "Không tải được danh sách repo",
                description: e?.message || "Vui lòng thử lại.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [user?.github_installation_id]);
    useEffect(() => {
        loadRepo();
    }, [loadRepo]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--chat-background))] p-4">
            <Card className="w-full max-w-md bg-sidebar border-sidebar-border">
                <CardHeader className="text-center">
                    <Github className="h-10 w-10 mx-auto text-primary mb-2" />
                    <CardTitle className="text-xl font-bold text-sidebar-foreground">
                        Liên kết tài khoản Github
                    </CardTitle>
                    <CardDescription className="text-sidebar-foreground/80 mt-2">
                        Để sử dụng đầy đủ tính năng, hãy liên kết tài khoản Github của bạn với CodeSync Chat.<br />
                        <span className="text-xs text-muted-foreground">
                            (Bạn có thể bỏ qua bước này và liên kết sau trong phần cài đặt)
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ol className="list-decimal list-inside text-sm text-sidebar-foreground mb-4 space-y-2">
                        <li>Bấm nút <span className="font-semibold text-primary">Liên kết Github</span> bên dưới.</li>
                        <li>Đăng nhập và cấp quyền cho ứng dụng CodeSync Chat trên Github.</li>
                        <li>Quay lại ứng dụng để sử dụng các tính năng đồng bộ code và repo.</li>
                    </ol>
                    <div className="flex gap-2 mt-4">
                        <Button
                            className="flex-1 flex items-center gap-2"
                            onClick={handleRedirect}
                        >
                            <Github className="h-5 w-5" />
                            Liên kết Github
                        </Button>
                        <Button
                            className="flex-1"
                            variant="outline"
                            onClick={handleSkip}
                        >
                            Bỏ qua
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full mt-2 text-xs text-muted-foreground"
                        onClick={handleDisableNotify}
                    >
                        Không nhận thông báo này nữa
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}