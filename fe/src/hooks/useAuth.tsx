import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AuthAPI from '@/api/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: any;
  token: string | null;
  refreshToken: string | null;
  loading: boolean; // <- loading toàn cục (đang verify)
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(localStorage.getItem("refreshToken"));
  const [loading, setLoading] = useState(true); // <- true ngay từ đầu
  const { toast } = useToast();

  useEffect(() => {
    const verify = async () => {
      if (token) {
        try {
          const res = await AuthAPI.verifyToken(token);
          if (res?.id) {
            setUser(res);
          } else {
            clearAuth();
          }
        } catch (err) {
          clearAuth();
        }
      }
      setLoading(false); // kết thúc verify (dù thành công hay thất bại)
    };

    const clearAuth = () => {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    };

    verify();
  }, [token]);


  // Đăng nhập
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await AuthAPI.login({ email, password });
      if (res?.access_token && res?.refresh_token && res?.user) {
        setToken(res.access_token);
        setRefreshToken(res.refresh_token);
        localStorage.setItem("token", res.access_token);
        localStorage.setItem("refreshToken", res.refresh_token);
        setUser(res.user);
        toast({ title: "Đăng nhập thành công", description: "Chào mừng bạn quay trở lại!" });
        return { error: null };
      }
      return { error: res?.error || "Đăng nhập thất bại" };
    } catch (err: any) {
      return { error: err?.message || "Đăng nhập thất bại" };
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký
  const signUp = async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const res = await AuthAPI.register({ email, password, username });
      if (res?.success) {
        toast({ title: "Đăng ký thành công", description: "Vui lòng kiểm tra email để xác nhận tài khoản." });
        return { error: null };
      }
      return { error: res?.error || "Đăng ký thất bại" };
    } catch (err: any) {
      return { error: err?.message || "Đăng ký thất bại" };
    } finally {
      setLoading(false);
    }
  };

  // Quên mật khẩu
  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      const res = await AuthAPI.forgotPassword(email);
      if (res?.success) {
        toast({ title: "Yêu cầu thành công", description: "Vui lòng kiểm tra email để đặt lại mật khẩu." });
        return { error: null };
      }
      return { error: res?.error || "Yêu cầu thất bại" };
    } catch (err: any) {
      return { error: err?.message || "Yêu cầu thất bại" };
    } finally {
      setLoading(false);
    }
  };

  // Đăng xuất
  const signOut = async () => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("token");
    toast({ title: "Đăng xuất thành công", description: "Hẹn gặp lại bạn!" });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      refreshToken,
      signIn,
      signUp,
      signOut,
      forgotPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};