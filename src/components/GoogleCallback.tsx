import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";

export const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get("error");
      const code = searchParams.get("code");
      const directAccessToken = searchParams.get("access_token") || searchParams.get("token");
      const directRefreshToken = searchParams.get("refresh_token");

      if (error) {
        toast({
          title: "Dang nhap Google that bai",
          description: error,
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
        return;
      }

      try {
        if (!directAccessToken || !directRefreshToken) {
          const message = code
            ? "Google OAuth phai callback ve backend, sau do backend redirect ve frontend kem token."
            : "Khong nhan duoc token tu backend.";
          throw new Error(message);
        }

        await authService.handleGoogleCallback(directAccessToken, directRefreshToken);

        toast({
          title: "Dang nhap Google thanh cong",
          description: "Chao mung ban quay tro lai.",
        });
        window.location.href = "/";
      } catch (callbackError: any) {
        toast({
          title: "Khong the xu ly Google OAuth",
          description: callbackError?.msg || callbackError?.message || "Vui long thu lai.",
          variant: "destructive",
        });
        navigate("/auth", { replace: true });
      }
    };

    handleCallback();
  }, [navigate, searchParams, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
        <p className="font-medium">Dang xu ly dang nhap Google...</p>
        <p className="text-sm text-slate-400">Vui long doi trong giay lat</p>
      </div>
    </div>
  );
};
