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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Function to setup token refresh timer
  const setupRefreshTimer = () => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!authService.isAuthenticated()) return;

    // Get token expiration time
    const expiresAt = authService.getTokenExpirationTime();
    if (!expiresAt) return;

    // Calculate time until expiration minus 10 seconds
    const currentTime = Date.now();
    const timeUntilRefresh = Math.max(0, expiresAt - currentTime); // 10 seconds before expiration

    console.log(
      `Token will be refreshed in ${timeUntilRefresh / 1000} seconds`
    );

    // Set up timer for refresh
    refreshTimerRef.current = setTimeout(async () => {
      console.log("Auto refreshing token before expiration");
      if (authService.isAuthenticated()) {
        try {
          await refreshToken();
        } catch (error) {
          console.error("Auto token refresh failed:", error);
        }
      }
    }, timeUntilRefresh);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated (with improved check that considers refresh tokens)
        if (authService.isAuthenticated()) {
          // Check if access token is expired
          if (authService.isTokenExpired()) {
            try {
              console.log("Access token expired on page load, refreshing...");
              // Try to refresh token
              await authService.refreshToken();
            } catch (error) {
              console.error("Failed to refresh token on init:", error);
              // If refresh fails after max attempts, user will be logged out
              setLoading(false);
              return;
            }
          }

          // Get user info from token or profile
          const userFromToken: any = await authService.getProfile();
          if (userFromToken) {
            setUser(localStorage.getItem("app_user") ? JSON.parse(localStorage.getItem("app_user") as string) : userFromToken);
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
          // Connect socket if authentication is successful
          chatSocketService.connect();

          // Set up refresh timer after successful authentication
          setupRefreshTimer();


        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Clean up timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });

      if (response.status && response.data) {
        setUser(response.data.user);

        // Setup refresh timer after successful login
        setupRefreshTimer();

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

  const refreshToken = async () => {
    try {
      await authService.refreshToken();
      // Update user info after refresh
      const userFromToken: any = await authService.getProfile();
      if (userFromToken) {
        setUser(userFromToken);
      }
      // Reset the refresh timer after successful token refresh
      setupRefreshTimer();
    } catch (error) {
      console.error("Refresh token failed:", error);
      signOut();
    }
  };

  const isAuthenticated = () => {
    return authService.isAuthenticated();
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
        refreshToken, // Export method này nếu cần
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
