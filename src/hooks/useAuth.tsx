import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
  useRef,
} from "react";
import authService from "@/services/authService";
import { useToast } from "@/hooks/useToast";
import { User } from "@/types/auth";
import { chatSocketService } from "@/services/chatSocketService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    captchaToken: string
  ) => Promise<{ error: string | null }>;
  signInWithGitHub: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: () => boolean;
  refreshToken: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated (with improved check that considers refresh tokens)
        const userFromToken: any = await authService.getProfile();
        if (userFromToken) {
          setUser(
            localStorage.getItem("app_user")
              ? JSON.parse(localStorage.getItem("app_user") as string)
              : userFromToken
          );
        } else console.error("Failed to get profile");
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
        chatSocketService.connect();
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (
    email: string,
    password: string,
    captchaToken: string
  ) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password, captchaToken });

      if (response.status && response.data) {
        setUser(response.data.user);

        toast({
          title: "Đăng nhập thành công",
          description: "Chào mừng bạn quay trở lại!",
        });

        return { error: null };
      } else {
        return { error: response.msg || "Đăng nhập thất bại" };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.msg ||
        error.message ||
        "Có lỗi xảy ra khi đăng nhập";
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGitHub = async () => {
    try {
      // Chỉ redirect đến GitHub OAuth
      const { url }: any = await authService.loginWithGitHub();
      window.location.href = url;
    } catch (error: any) {
      console.error("Lỗi đăng nhập GitHub:", error);
      toast({
        title: "Đăng nhập GitHub thất bại",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      setLoading(true);
      const response = await authService.register({
        email,
        password,
        username,
      });

      if (response.status && response.data) {
        // setUser(response.data.user);

        toast({
          title: "Đăng ký thành công",
          description: "Vui lòng xác nhận email của bạn để tiếp tục.",
        });

        return { error: null };
      } else {
        return { error: response.msg || "Đăng ký thất bại" };
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.msg ||
        error.message ||
        "Có lỗi xảy ra khi đăng ký";
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const signOut = async () => {
    // Clear refresh timer when logging out
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    setUser(null);
    authService.logout();
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại bạn!",
    });
  };

  // Check if user is authenticated
  const isAuthenticated = () => !!user;

  // Dummy refreshToken implementation (replace with actual logic if needed)
  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      // Optionally update user info here
    } catch (error) {
      console.error("Refresh token failed:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGitHub,
        signUp,
        signOut,
        isAuthenticated,
        refreshToken,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
