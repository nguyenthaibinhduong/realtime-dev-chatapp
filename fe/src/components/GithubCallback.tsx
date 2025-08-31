import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { authService } from "@/services/authService";

export const GitHubCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      console.log("GitHub callback - Code:", code, "Error:", error);

      if (error) {
        toast({
          title: "Đăng nhập GitHub thất bại",
          description: `Lỗi: ${error}`,
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      if (!code) {
        toast({
          title: "Lỗi đăng nhập",
          description: "Không nhận được mã xác thực từ GitHub",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      try {
        const response = await authService.handleGitHubCallback(code);

        if (response.status && response.data) {
          toast({
            title: "Đăng nhập GitHub thành công",
            description: `Chào mừng ${response.data.user.name || response.data.user.email
              }!`,
          });

          // Reload page để AuthProvider cập nhật user state
          window.location.href = "/";
        } else {
          throw new Error(response.msg || "Đăng nhập thất bại");
        }
      } catch (error: any) {
        console.error("GitHub callback processing error:", error);

        let errorMessage = "Có lỗi xảy ra khi xử lý đăng nhập GitHub";

        if (error.response?.status === 404) {
          errorMessage =
            "API endpoint không tìm thấy. Vui lòng kiểm tra backend.";
        } else if (error.response?.data?.msg) {
          errorMessage = error.response.data.msg;
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: "Đăng nhập GitHub thất bại",
          description: errorMessage,
          variant: "destructive",
        });
        navigate("/auth");
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[hsl(var(--chat-background))]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300 mb-2">
          Đang xử lý đăng nhập GitHub...
        </p>
        <p className="text-sm text-gray-500">Vui lòng đợi trong giây lát</p>
      </div>
    </div>
  );
};
