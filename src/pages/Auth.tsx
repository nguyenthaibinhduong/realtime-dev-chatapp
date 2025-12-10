import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { Eye, EyeOff, MessageSquare, Github, AlertCircle, CheckCircle, Code2, Users, Zap, Shield, Mail, ArrowLeft, Clock, KeyRound } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthAPI } from "@/api/api";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const forgotPasswordCaptchaRef = useRef<ReCAPTCHA>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGitHub } = useAuth();

  // Signup controlled fields for validation
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const [signupErrors, setSignupErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // Forgot Password Flow States
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1); // 1: Email, 2: OTP, 3: Success
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Countdown Timer Effect
  useEffect(() => {
    if (expiresAt && forgotPasswordStep === 2) {
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setCountdown(remaining);

        if (remaining === 0) {
          clearInterval(timer);
          setOtpError("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại");
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresAt, forgotPasswordStep]);

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Ít nhất 8 ký tự");
    if (!/[A-Z]/.test(password)) errors.push("Ít nhất 1 chữ hoa");
    if (!/[a-z]/.test(password)) errors.push("Ít nhất 1 chữ thường");
    if (!/[0-9]/.test(password)) errors.push("Ít nhất 1 chữ số");
    return errors;
  };

  const passwordStrength = (
    password: string
  ): { label: string; color: string; width: string } => {
    if (!password) return { label: "", color: "", width: "0%" };
    const errs = validatePassword(password);
    if (errs.length === 0) return { label: "Mạnh", color: "bg-green-500", width: "100%" };
    if (errs.length <= 2) return { label: "Trung bình", color: "bg-yellow-500", width: "66%" };
    return { label: "Yếu", color: "bg-red-500", width: "33%" };
  };

  // STEP 1: Gửi OTP
  const handleSendOTP = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateEmail(forgotPasswordEmail)) {
      setEmailError("Email không hợp lệ");
      setIsLoading(false);
      return;
    }

    if (!captchaToken) {
      toast({
        title: "Xác thực reCAPTCHA",
        description: "Vui lòng xác nhận bạn không phải là robot",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response: any = await AuthAPI.resetPassword({
        email: forgotPasswordEmail,
        captchaToken: captchaToken,
      });

      // ✅ Set loading false NGAY sau khi có response
      setIsLoading(false);

      if (response?.status === 200 && response?.data?.step === 1) {
        // Thành công - Chuyển sang bước nhập OTP
        setForgotPasswordStep(2);
        setExpiresAt(response.data.expiresAt);
        setRemainingAttempts(response.data.remainingAttempts);
        setMaxAttempts(response.data.maxAttempts);
        setOtpCode("");
        setOtpError("");

        toast({
          title: "Thành công",
          description: response.msg || "Mã OTP đã được gửi đến email của bạn",
        });
      } else {
        // Lỗi - Hiển thị toast và giữ nguyên form
        const errorMessage = response?.msg || "Đã có lỗi xảy ra. Vui lòng thử lại";

        // Hiển thị lỗi trong input email
        setEmailError(errorMessage);

        toast({
          title: "Không thể gửi OTP",
          description: errorMessage,
          variant: "destructive",
        });

        // Reset CAPTCHA để người dùng thử lại
        forgotPasswordCaptchaRef.current?.reset();
        setCaptchaToken(null);
      }
    } catch (error: any) {
      setIsLoading(false);

      const errorMessage = error?.response?.data?.msg || error?.message || "Đã có lỗi xảy ra. Vui lòng thử lại";

      setEmailError(errorMessage);

      toast({
        title: "Lỗi kết nối",
        description: errorMessage,
        variant: "destructive",
      });

      // Reset CAPTCHA để người dùng thử lại
      forgotPasswordCaptchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  // STEP 2: Xác thực OTP
  const handleVerifyOTP = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setOtpError("");

    if (!/^\d{6}$/.test(otpCode)) {
      setOtpError("Mã OTP phải là 6 chữ số");
      setIsLoading(false);
      return;
    }

    if (countdown === 0) {
      setOtpError("Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại");
      setIsLoading(false);
      return;
    }

    try {
      const response = await AuthAPI.resetPassword({
        email: forgotPasswordEmail,
        otp: otpCode,
      });

      setIsLoading(false);

      if (response?.status === 200 && response?.data?.step === 2) {
        // Thành công - Chuyển sang bước 3
        setForgotPasswordStep(3);
        toast({
          title: "Thành công! 🎉",
          description: response.msg,
        });
      } else if (response?.status === 400) {
        // OTP sai
        if (response?.data?.remainingAttempts !== undefined) {
          setRemainingAttempts(response.data.remainingAttempts);
          setOtpError(response.msg);
          setOtpCode(""); // Reset input OTP

          toast({
            title: "Mã OTP không chính xác",
            description: `Bạn còn ${response.data.remainingAttempts} lần thử`,
            variant: "destructive",
          });
        } else {
          setOtpError(response.msg);
          toast({
            title: "Lỗi",
            description: response.msg,
            variant: "destructive",
          });
        }
      } else if (response?.status === 429) {
        // Vượt quá số lần thử
        setOtpError(response.msg);
        toast({
          title: "Vượt quá số lần thử",
          description: response.msg,
          variant: "destructive",
        });
      } else {
        setOtpError(response?.msg || "Đã có lỗi xảy ra");
        toast({
          title: "Lỗi",
          description: response?.msg || "Đã có lỗi xảy ra",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setIsLoading(false);

      const errorMessage = error?.response?.data?.msg || error?.message || "Đã có lỗi xảy ra. Vui lòng thử lại";

      setOtpError(errorMessage);

      toast({
        title: "Thất bại",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Reset toàn bộ forgot password flow
  const handleResetForgotPassword = () => {
    setForgotPasswordStep(1);
    setForgotPasswordEmail("");
    setEmailError("");
    setOtpCode("");
    setOtpError("");
    setExpiresAt(null);
    setCountdown(0);
    setRemainingAttempts(3);
    setMaxAttempts(3);
    forgotPasswordCaptchaRef.current?.reset();
    setCaptchaToken(null);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!captchaToken) {
      toast({
        title: "Xác thực reCAPTCHA",
        description: "Vui lòng xác nhận bạn không phải là robot",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password, captchaToken);

    recaptchaRef.current?.reset();
    setCaptchaToken(null);

    if (error) {
      toast({
        title: "Lỗi đăng nhập",
        description: error,
        variant: "destructive",
      });
    } else {
      navigate("/");
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const pwdErrors = validatePassword(signupPassword);
    const newErrors = { password: "", confirmPassword: "" };
    if (pwdErrors.length > 0) {
      newErrors.password = pwdErrors.join(", ");
    }
    if (!signupConfirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (signupConfirmPassword !== signupPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setSignupErrors(newErrors);
    if (newErrors.password || newErrors.confirmPassword) {
      toast({
        title: "Mật khẩu không hợp lệ",
        description: newErrors.password || newErrors.confirmPassword,
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(signupEmail, signupPassword, signupUsername);

    if (error) {
      toast({
        title: "Lỗi đăng ký",
        description: error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Đăng ký thành công",
        description: "Vui lòng đăng nhập bằng tài khoản vừa tạo.",
      });
      navigate("/");
      setSignupUsername("");
      setSignupEmail("");
      setSignupPassword("");
      setSignupConfirmPassword("");
      setSignupErrors({ password: "", confirmPassword: "" });
    }

    setIsLoading(false);
  };

  const handleSignInGitHub = async () => {
    try {
      await signInWithGitHub();
    } catch (error) {
      console.error("GitHub login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4 bg-gray-50 dark:bg-gray-950">
      {/* Background - giữ nguyên */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-indigo-950 dark:via-slate-900 dark:to-violet-950">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6TTAgMTZjMC00LjQxOCAzLjU4Mi04IDgtOHM4IDMuNTgyIDggOC0zLjU4MiA4LTggOC04LTMuNTgyLTgtOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />
        <div className="absolute top-20 left-10 w-20 h-20 border-2 border-blue-400/20 rounded-lg rotate-45 animate-float" />
        <div className="absolute top-40 right-20 w-16 h-16 border-2 border-purple-400/20 rounded-full animate-float animation-delay-2000" />
        <div className="absolute bottom-32 left-1/4 w-12 h-12 border-2 border-cyan-400/20 rotate-12 animate-float animation-delay-4000" />
        <div className="absolute bottom-20 right-1/3 w-24 h-24 border-2 border-pink-400/20 rounded-full animate-pulse" />
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
        {/* Left Side - Features (giữ nguyên) */}
        <div className="flex-1 text-gray-900 dark:text-white space-y-5 max-w-lg">
          <div className="p-6 bg-white/80 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl hover:bg-white/90 dark:hover:bg-white/10 transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/50">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 dark:from-blue-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                CodeSync Chat
              </h1>
            </div>
            <p className="text-sm lg:text-base text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
              Nền tảng giao tiếp thời gian thực cho đội ngũ phát triển
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Kết hợp chat realtime, chia sẻ code và tích hợp GitHub. Tăng hiệu suất làm việc nhóm.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="group p-3 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-blue-600/5 backdrop-blur-md rounded-xl border border-blue-300 dark:border-blue-400/20 hover:border-blue-400 dark:hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
              <div className="p-2 bg-blue-200 dark:bg-blue-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                <Code2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-xs mb-1 text-blue-700 dark:text-blue-300">Code Sharing</h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">Syntax highlighting</p>
            </div>
            <div className="group p-3 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-500/10 dark:to-purple-600/5 backdrop-blur-md rounded-xl border border-purple-300 dark:border-purple-400/20 hover:border-purple-400 dark:hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
              <div className="p-2 bg-purple-200 dark:bg-purple-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-xs mb-1 text-purple-700 dark:text-purple-300">Team Work</h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">Channels & threads</p>
            </div>
            <div className="group p-3 bg-gradient-to-br from-yellow-100 to-amber-50 dark:from-yellow-500/10 dark:to-amber-600/5 backdrop-blur-md rounded-xl border border-yellow-300 dark:border-yellow-400/20 hover:border-yellow-400 dark:hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300">
              <div className="p-2 bg-yellow-200 dark:bg-yellow-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold text-xs mb-1 text-yellow-700 dark:text-yellow-300">Real-time</h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">WebSocket sync</p>
            </div>
            <div className="group p-3 bg-gradient-to-br from-green-100 to-emerald-50 dark:from-green-500/10 dark:to-emerald-600/5 backdrop-blur-md rounded-xl border border-green-300 dark:border-green-400/20 hover:border-green-400 dark:hover:border-green-400/40 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
              <div className="p-2 bg-green-200 dark:bg-green-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-xs mb-1 text-green-700 dark:text-green-300">Secure</h3>
              <p className="text-[10px] text-gray-600 dark:text-gray-400 leading-tight">Authentication</p>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="w-full max-w-sm bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:to-gray-900 backdrop-blur-2xl border border-gray-200 dark:border-gray-800 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 hover:shadow-blue-500/20 transition-all duration-300">
          {!showForgotPassword ? (
            <>
              {/* LOGIN/SIGNUP TABS - Giữ nguyên code cũ */}
              <CardHeader className="text-center pb-3 space-y-1">
                <div className="inline-block mx-auto mb-2 p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/50">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">Chào mừng trở lại</CardTitle>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  Đăng nhập để tiếp tục
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <Tabs defaultValue="signin" className="w-full">
                  {/* ... Giữ nguyên phần Tabs Login/Signup ... */}
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800/50 backdrop-blur-md border border-gray-300 dark:border-gray-700 p-1">
                    <TabsTrigger value="signin" className="text-xs text-gray-600 dark:text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all rounded-md">
                      Đăng nhập
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="text-xs text-gray-600 dark:text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all rounded-md">
                      Đăng ký
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-3 mt-4">
                    <form onSubmit={handleSignIn} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-xs text-gray-900 dark:text-white font-medium">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="your@email.com" required className="bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 h-9 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-xs text-gray-900 dark:text-white font-medium">Mật khẩu</Label>
                          <Button type="button" variant="link" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-0 h-auto" onClick={() => setShowForgotPassword(true)}>
                            Quên mật khẩu?
                          </Button>
                        </div>
                        <div className="relative">
                          <Input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="••••••••" required className="bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 pr-10 h-9 transition-all" />
                          <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOff className="h-3.5 w-3.5 text-gray-400" /> : <Eye className="h-3.5 w-3.5 text-gray-400" />}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-center py-2">
                        <ReCAPTCHA ref={recaptchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={handleCaptchaChange} theme="dark" />
                      </div>
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm h-9 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all" disabled={isLoading || !captchaToken}>
                        {isLoading ? <span className="flex items-center gap-2"><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="text-xs">Đang đăng nhập...</span></span> : "Đăng nhập"}
                      </Button>
                    </form>
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300 dark:border-gray-700" /></div>
                      <div className="relative flex justify-center text-xs"><span className="bg-white dark:bg-gray-900 px-2 text-gray-600 dark:text-gray-400">hoặc</span></div>
                    </div>
                    <Button onClick={handleSignInGitHub} className="w-full bg-gray-200 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm h-9 hover:bg-gray-300 dark:hover:bg-gray-700 transition-all" disabled={isLoading}>
                      <Github className="h-4 w-4 mr-2" />
                      {isLoading ? "Đang đăng nhập..." : "Đăng nhập với GitHub"}
                    </Button>
                  </TabsContent>

                  {/* SIGNUP TAB - Giữ nguyên code cũ */}
                  <TabsContent value="signup" className="space-y-3 mt-4">
                    <form onSubmit={handleSignUp} className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="username" className="text-xs text-gray-900 dark:text-white font-medium">Tên người dùng</Label>
                        <Input id="username" name="username" type="text" placeholder="username" required value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} className="bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 h-9 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-xs text-gray-900 dark:text-white font-medium">Email</Label>
                        <Input id="signup-email" name="email" type="email" placeholder="your@email.com" required value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 h-9 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="text-xs text-gray-900 dark:text-white font-medium">Mật khẩu</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            value={signupPassword}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSignupPassword(val);
                              const errs = validatePassword(val);
                              setSignupErrors((prev) => ({
                                ...prev,
                                password: errs.length ? errs.join(", ") : "",
                                confirmPassword:
                                  signupConfirmPassword && signupConfirmPassword !== val
                                    ? "Mật khẩu xác nhận không khớp"
                                    : "",
                              }));
                            }}
                            className={`bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 pr-10 h-9 transition-all ${signupErrors.password ? "border-red-500/50" : ""
                              }`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        {signupPassword && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-600 dark:text-gray-400">Độ mạnh mật khẩu</span>
                              {(() => {
                                const s = passwordStrength(signupPassword);
                                return (
                                  <span
                                    className={`font-medium ${s.label === "Mạnh"
                                      ? "text-green-600 dark:text-green-400"
                                      : s.label === "Trung bình"
                                        ? "text-yellow-600 dark:text-yellow-400"
                                        : "text-red-600 dark:text-red-400"
                                      }`}
                                  >
                                    {s.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="h-1 bg-gray-300 dark:bg-gray-800 rounded-full overflow-hidden">
                              {(() => {
                                const s = passwordStrength(signupPassword);
                                return (
                                  <div className={`h-full ${s.color} transition-all duration-300`} style={{ width: s.width }} />
                                );
                              })()}
                            </div>
                          </div>
                        )}
                        {signupErrors.password && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {signupErrors.password}
                          </div>
                        )}
                        <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2 mt-1">
                          {[
                            { check: signupPassword.length >= 8, text: "Ít nhất 8 ký tự" },
                            { check: /[A-Z]/.test(signupPassword), text: "Ít nhất 1 chữ hoa" },
                            { check: /[a-z]/.test(signupPassword), text: "Ít nhất 1 chữ thường" },
                            { check: /[0-9]/.test(signupPassword), text: "Ít nhất 1 chữ số" },
                          ].map((req, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-[10px]">
                              {req.check ? (
                                <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-gray-400 dark:text-gray-500" />
                              )}
                              <span className={req.check ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"}>{req.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-confirm-password" className="text-xs text-gray-900 dark:text-white font-medium">Nhập lại mật khẩu</Label>
                        <div className="relative">
                          <Input
                            id="signup-confirm-password"
                            name="confirmPassword"
                            type={showSignupConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            required
                            value={signupConfirmPassword}
                            onChange={(e) => {
                              const v = e.target.value;
                              setSignupConfirmPassword(v);
                              setSignupErrors((prev) => ({
                                ...prev,
                                confirmPassword:
                                  v && v !== signupPassword ? "Mật khẩu xác nhận không khớp" : "",
                              }));
                            }}
                            className={`bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 pr-10 h-9 transition-all ${signupErrors.confirmPassword ? "border-red-500/50" : ""
                              }`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowSignupConfirmPassword((s) => !s)}
                          >
                            {showSignupConfirmPassword ? (
                              <EyeOff className="h-3.5 w-3.5 text-gray-400" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </Button>
                        </div>
                        {signupErrors.confirmPassword && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400">
                            <AlertCircle className="h-3 w-3" />
                            {signupErrors.confirmPassword}
                          </div>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm h-9 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs">Đang đăng ký...</span>
                          </span>
                        ) : "Đăng ký"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <>
              {/* FORGOT PASSWORD FLOW - 3 STEPS */}
              <CardHeader className="text-center pb-3 space-y-1">
                <div className="inline-block mx-auto mb-2 p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full shadow-lg shadow-blue-500/50">
                  {forgotPasswordStep === 1 && <Mail className="h-5 w-5 text-white" />}
                  {forgotPasswordStep === 2 && <KeyRound className="h-5 w-5 text-white" />}
                  {forgotPasswordStep === 3 && <CheckCircle className="h-5 w-5 text-white" />}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {forgotPasswordStep === 1 && "Quên Mật Khẩu"}
                  {forgotPasswordStep === 2 && "Nhập Mã OTP"}
                  {forgotPasswordStep === 3 && "Thành Công"}
                </CardTitle>
                <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                  {forgotPasswordStep === 1 && "Nhập email để nhận mã OTP"}
                  {forgotPasswordStep === 2 && `Mã OTP đã được gửi đến ${forgotPasswordEmail}`}
                  {forgotPasswordStep === 3 && "Mật khẩu mới đã được gửi đến email"}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {/* STEP 1: Email Form */}
                {forgotPasswordStep === 1 && (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="forgot-email" className="text-xs text-gray-900 dark:text-white font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="forgot-email"
                          type="email"
                          placeholder="your@email.com"
                          required
                          value={forgotPasswordEmail}
                          onChange={(e) => {
                            setForgotPasswordEmail(e.target.value);
                            if (emailError) setEmailError("");
                          }}
                          onBlur={() => {
                            if (forgotPasswordEmail && !validateEmail(forgotPasswordEmail)) {
                              setEmailError("Định dạng email không hợp lệ");
                            }
                          }}
                          className={`bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 pl-10 h-10 transition-all ${emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : ""}`}
                        />
                      </div>
                      {emailError && (
                        <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {emailError}
                        </div>
                      )}
                      {forgotPasswordEmail && !emailError && validateEmail(forgotPasswordEmail) && (
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          Email hợp lệ
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                          Mã OTP sẽ được gửi đến email của bạn và có hiệu lực trong 5 phút.
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center py-2">
                      <ReCAPTCHA ref={forgotPasswordCaptchaRef} sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} onChange={handleCaptchaChange} theme="dark" />
                    </div>

                    <div className="space-y-2">
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm h-10 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all" disabled={isLoading || !captchaToken || !validateEmail(forgotPasswordEmail)}>
                        {isLoading ? <span className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="text-sm">Đang gửi...</span></span> : <span className="flex items-center gap-2"><Mail className="h-4 w-4" />Gửi mã OTP</span>}
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-sm h-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" onClick={() => { setShowForgotPassword(false); handleResetForgotPassword(); }} disabled={isLoading}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại đăng nhập
                      </Button>
                    </div>
                  </form>
                )}

                {/* STEP 2: OTP Form */}
                {forgotPasswordStep === 2 && (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    {/* Countdown Timer */}
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-white" />
                        <span className="text-white text-lg font-bold">{formatCountdown(countdown)}</span>
                      </div>
                      <p className="text-xs text-white/90">Thời gian còn lại</p>
                    </div>

                    {/* OTP Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="otp-code" className="text-xs text-gray-900 dark:text-white font-medium">Mã OTP (6 số)</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="otp-code"
                          type="text"
                          placeholder="000000"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            setOtpCode(value);
                            if (otpError) setOtpError("");
                          }}
                          className={`bg-white dark:bg-gray-900/80 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-lg font-mono text-center placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 pl-10 h-12 transition-all tracking-widest ${otpError ? "border-red-500 focus:border-red-500 focus:ring-red-500/30" : ""}`}
                          disabled={countdown === 0 || remainingAttempts === 0}
                        />
                      </div>
                      {otpError && (
                        <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                          <AlertCircle className="h-3 w-3" />
                          {otpError}
                        </div>
                      )}
                    </div>

                    {/* Attempts Info */}
                    <div className={`rounded-lg p-3 border ${remainingAttempts > 1 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'}`}>
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`h-4 w-4 ${remainingAttempts > 1 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`} />
                        <p className={`text-xs ${remainingAttempts > 1 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                          Bạn còn <strong>{remainingAttempts}/{maxAttempts}</strong> lần thử
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm h-10 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all" disabled={isLoading || otpCode.length !== 6 || countdown === 0 || remainingAttempts === 0}>
                        {isLoading ? <span className="flex items-center gap-2"><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span className="text-sm">Đang xác thực...</span></span> : <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Xác thực OTP</span>}
                      </Button>
                      <Button type="button" variant="outline" className="w-full text-sm h-9 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" onClick={handleResetForgotPassword} disabled={isLoading}>
                        <Mail className="h-4 w-4 mr-2" />
                        Gửi lại mã OTP
                      </Button>
                      <Button type="button" variant="ghost" className="w-full text-sm h-9 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" onClick={() => { setShowForgotPassword(false); handleResetForgotPassword(); }} disabled={isLoading}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại đăng nhập
                      </Button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Success Message */}
                {forgotPasswordStep === 3 && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-5 shadow-lg">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-green-500 rounded-full shadow-lg">
                          <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-green-800 dark:text-green-300 mb-1">
                            Đặt lại mật khẩu thành công! 🎉
                          </h3>
                          <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
                            Mật khẩu mới đã được gửi đến email <strong>{forgotPasswordEmail}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Mail className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                            Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam). Sử dụng mật khẩu mới để đăng nhập và đổi mật khẩu ngay sau đó.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm h-10 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all" onClick={() => { setShowForgotPassword(false); handleResetForgotPassword(); }}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Quay lại đăng nhập
                    </Button>
                  </div>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes gradient {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-gradient {
          animation: gradient 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
