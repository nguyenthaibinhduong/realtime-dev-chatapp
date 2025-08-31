import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import authService from "@/services/authService";
import { useToast } from "@/hooks/useToast";
import { User } from "@/types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
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
  handleGitHubSuccess: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Check if token is expired
          if (authService.isTokenExpired()) {
            try {
              // Try to refresh token
              await authService.refreshToken();
            } catch (error) {
              // If refresh fails, logout
              authService.logout();
              setLoading(false);
              return;
            }
          }

          // Get user info from token or profile
          const userFromToken = authService.getUserFromToken();
          if (userFromToken) {
            setUser(userFromToken);
          } else {
            // Fallback: get profile from API
            try {
              const profileResponse = await authService.getProfile();
              if (profileResponse.status && profileResponse.data) {
                setUser(profileResponse.data);
              }
            } catch (error) {
              console.error("Failed to get profile:", error);
              authService.logout();
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      setLoading(true);
      const response = await authService.login({ email, password });

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
      await authService.loginWithGitHub();
    } catch (error: any) {
      console.error("Lỗi đăng nhập GitHub:", error);
      toast({
        title: "Đăng nhập GitHub thất bại",
        description: error.message || "Có lỗi xảy ra",
        variant: "destructive",
      });
    }
  };

  const handleGitHubSuccess = (user: User) => {
    setUser(user);
    setLoading(false);
  };

  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      setLoading(true);
      const response = await authService.register({
        email,
        password,
        name: username,
      });

      if (response.status && response.data) {
        setUser(response.data.user);

        toast({
          title: "Đăng ký thành công",
          description: "Chào mừng bạn đến với ứng dụng!",
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
    setUser(null);
    authService.logout();
    toast({
      title: "Đăng xuất thành công",
      description: "Hẹn gặp lại bạn!",
    });
  };

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      // Update user info after refresh
      const userFromToken = authService.getUserFromToken();
      if (userFromToken) {
        setUser(userFromToken);
      }
    } catch (error) {
      console.error("Refresh token failed:", error);
      signOut();
    }
  };

  const isAuthenticated = () => {
    return authService.isAuthenticated() && !authService.isTokenExpired();
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
        handleGitHubSuccess, // Export method này nếu cần
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
