import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Github,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthAPI } from "@/api/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

type FieldErrors = Partial<Record<"email" | "password" | "username" | "confirmPassword" | "forgotEmail", string>>;

const getPasswordRules = (password: string) => [
  { label: "Tối thiểu 8 ký tự", valid: password.length >= 8 },
  { label: "Có chữ hoa", valid: /[A-Z]/.test(password) },
  { label: "Có chữ thường", valid: /[a-z]/.test(password) },
  { label: "Có chữ số", valid: /\d/.test(password) },
];

export default function AuthForm() {
  const [activeTab, setActiveTab] = useState("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [signin, setSignin] = useState({ email: "", password: "" });
  const [signup, setSignup] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");

  const { toast } = useToast();
  const { signIn, signUp, signInWithGitHub, signInWithGoogle } = useAuth();

  const passwordRules = useMemo(() => getPasswordRules(signup.password), [signup.password]);

  const passwordStrength = passwordRules.filter((rule) => rule.valid).length;

  const setFieldError = (name: keyof FieldErrors, message?: string) => {
    setErrors((current) => {
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  const validateSignin = () => {
    const nextErrors: FieldErrors = {};
    if (!emailRegex.test(signin.email.trim())) nextErrors.email = "Email không hợp lệ.";
    if (!signin.password) nextErrors.password = "Vui lòng nhập mật khẩu.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateSignup = () => {
    const nextErrors: FieldErrors = {};
    if (signup.username.trim().length < 2) nextErrors.username = "Tên hiển thị cần ít nhất 2 ký tự.";
    if (!emailRegex.test(signup.email.trim())) nextErrors.email = "Email không hợp lệ.";
    if (passwordStrength < 4) nextErrors.password = "Mật khẩu chưa đủ mạnh.";
    if (signup.confirmPassword !== signup.password) nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateSignin()) return;

    setIsLoading(true);
    const result = await signIn(signin.email.trim(), signin.password);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: "Đăng nhập thất bại",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    window.location.href = "/";
  };

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateSignup()) return;

    setIsLoading(true);
    const result = await signUp(signup.email.trim(), signup.password, signup.username.trim());
    setIsLoading(false);

    if (result.error) {
      toast({
        title: "Đăng ký thất bại",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Đăng ký thành công",
      description: "Vui lòng kiểm tra email để xác nhận tài khoản.",
    });
    setActiveTab("signin");
    setSignup({ username: "", email: "", password: "", confirmPassword: "" });
    setErrors({});
  };

  const handleGoogleLogin = async () => {
    setOauthLoading("google");
    try {
      await signInWithGoogle();
    } finally {
      setOauthLoading(null);
    }
  };

  const handleGitHubLogin = async () => {
    setOauthLoading("github");
    try {
      await signInWithGitHub();
    } finally {
      setOauthLoading(null);
    }
  };

  const handleForgotPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = forgotPasswordEmail.trim();

    if (!emailRegex.test(email)) {
      setFieldError("forgotEmail", "Email không hợp lệ.");
      return;
    }

    setIsLoading(true);
    try {
      const response: any = await AuthAPI.resetPassword({ email });
      toast({
        title: response?.status === 200 ? "Đã gửi yêu cầu" : "Không thể gửi yêu cầu",
        description: response?.msg || "Nếu email tồn tại, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.",
        variant: response?.status === 200 ? "default" : "destructive",
      });

      if (response?.status === 200 || response?.status === true) {
        setShowForgotPassword(false);
        setForgotPasswordEmail("");
        setErrors({});
      }
    } catch (error: any) {
      toast({
        title: "Không thể đặt lại mật khẩu",
        description: error?.msg || error?.message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authDisabled = isLoading || Boolean(oauthLoading);

  return (
    <main className="landing-page relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 p-4 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.16),transparent_24%),linear-gradient(135deg,#eff6ff_0%,#eef2ff_42%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.22),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(168,85,247,0.20),transparent_26%),linear-gradient(135deg,#1e1b4b_0%,#0f172a_48%,#2e1065_100%)]" />
      <div className="absolute inset-0 opacity-[0.22] dark:opacity-30 bg-[linear-gradient(rgba(30,64,175,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(30,64,175,0.22)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="pointer-events-none absolute left-8 top-20 hidden h-20 w-20 rotate-45 rounded-lg border border-blue-400/30 animate-float lg:block" />
      <div className="pointer-events-none absolute bottom-20 right-16 hidden h-24 w-24 rounded-full border border-purple-400/30 animate-float animation-delay-2000 lg:block" />
      <div className="pointer-events-none absolute bottom-1/3 left-1/4 hidden h-12 w-12 rotate-12 rounded-md border border-cyan-400/30 animate-float animation-delay-4000 md:block" />

      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle
          tooltipSide="bottom"
          className="border-white/30 bg-white/75 text-slate-900 shadow-sm backdrop-blur hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
        />
      </div>

      <Button
        asChild
        variant="outline"
        className="fixed left-4 top-4 z-50 hidden border-white/30 bg-white/75 text-slate-800 shadow-sm backdrop-blur hover:bg-white dark:bg-white/10 dark:text-white dark:hover:bg-white/20 sm:inline-flex"
      >
        <Link to="/landing">Giới thiệu sản phẩm</Link>
      </Button>

      <div className="relative z-10 grid w-full max-w-6xl items-center gap-8 py-16 lg:grid-cols-[1fr_430px]">
        <section className="hidden max-w-2xl space-y-7 lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-white/60 px-3 py-1 text-sm font-medium text-blue-800 shadow-sm backdrop-blur dark:border-blue-300/20 dark:bg-white/10 dark:text-blue-100">
            <ShieldCheck className="h-4 w-4" />
            Secure realtime workspace
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h1 className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-5xl font-bold tracking-normal text-transparent dark:from-blue-300 dark:via-purple-300 dark:to-cyan-300">
                CodeSync Chat
              </h1>
            </div>
            <p className="max-w-xl text-base leading-7 text-slate-700 dark:text-slate-200">
              Đăng nhập để tiếp tục trao đổi, chia sẻ code và đồng bộ công việc với team trong cùng một không gian.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Sparkles, label: "Code sharing", text: "Snippet, review và syntax highlight" },
              { icon: Users, label: "Team channels", text: "Phòng chat theo nhóm dự án" },
              { icon: ShieldCheck, label: "OAuth ready", text: "Google và GitHub OAuth" },
            ].map((item) => (
              <div
                key={item.label}
                className="group rounded-lg border border-white/60 bg-white/60 p-4 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/10 dark:shadow-black/20"
              >
                <item.icon className="mb-3 h-5 w-5 text-blue-700 transition group-hover:scale-110 dark:text-cyan-300" />
                <h2 className="text-sm font-semibold text-slate-950 dark:text-white">{item.label}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <Card className="auth-card-in w-full rounded-lg border-white/60 bg-white/85 shadow-2xl shadow-blue-950/10 backdrop-blur-2xl dark:border-white/15 dark:bg-white/[0.08] dark:text-white dark:shadow-black/50">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500" />
          {!showForgotPassword ? (
            <>
              <CardHeader className="space-y-2 pb-4">
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 lg:hidden">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  {/* <span className="rounded-full border border-blue-500/15 bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-200">
                    OAuth enabled
                  </span> */}
                </div>
                <CardTitle className="text-2xl text-slate-950 dark:text-white">{activeTab == 'signin' ? 'Đăng nhập' : 'Đăng ký'}</CardTitle>

                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Sử dụng email, Google hoặc GitHub để vào CodeSync Chat.
                </CardDescription>

              </CardHeader>

              <CardContent className="space-y-5">
                {
                  activeTab == 'signin' &&
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 gap-2 border-[#dadce0] bg-white text-[#3c4043] shadow-sm transition hover:bg-[#f8fafd] hover:text-[#202124] disabled:opacity-70"
                      onClick={handleGoogleLogin}
                      disabled={authDisabled}
                    >
                      {oauthLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      Google
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 gap-2 border-slate-300 bg-slate-950 text-white shadow-sm transition hover:bg-slate-800 hover:text-white dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/20"
                      onClick={handleGitHubLogin}
                      disabled={authDisabled}
                    >
                      {oauthLoading === "github" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Github className="h-4 w-4" />}
                      GitHub
                    </Button>
                  </div>
                }
                {
                  activeTab == 'signin' &&
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-slate-200 dark:border-white/15" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/85 px-3 text-slate-500 dark:bg-transparent dark:text-slate-400">Hoặc</span>
                    </div>
                  </div>
                }

                <Tabs value={activeTab} onValueChange={(value) => {
                  setActiveTab(value);
                  setErrors({});
                }}>
                  <TabsList className="grid h-11 w-full grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/10">
                    <TabsTrigger
                      value="signin"
                      className="rounded-md text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white"
                    >
                      Đăng nhập
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="rounded-md text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white"
                    >
                      Đăng ký
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-5">
                    <form className="space-y-4" onSubmit={handleSignIn} noValidate>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@company.com"
                            value={signin.email}
                            onChange={(event) => {
                              const email = event.target.value;
                              setSignin((current) => ({ ...current, email }));
                              if (!email || emailRegex.test(email.trim())) setFieldError("email");
                            }}
                            onBlur={() => {
                              if (signin.email && !emailRegex.test(signin.email.trim())) setFieldError("email", "Email không hợp lệ.");
                            }}
                            className={cn(
                              "h-11 border-slate-200 bg-white pl-10 text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white",
                              errors.email && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            )}
                            aria-invalid={Boolean(errors.email)}
                          />
                        </div>
                        {errors.email && <FieldError message={errors.email} />}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <Label htmlFor="password" className="text-slate-700 dark:text-slate-200">Mật khẩu</Label>
                          <button
                            type="button"
                            className="text-sm font-medium text-blue-700 transition hover:text-blue-900 dark:text-blue-300 dark:hover:text-cyan-200"
                            onClick={() => {
                              setShowForgotPassword(true);
                              setErrors({});
                            }}
                          >
                            Quên mật khẩu?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            placeholder="Nhập mật khẩu"
                            value={signin.password}
                            onChange={(event) => {
                              const password = event.target.value;
                              setSignin((current) => ({ ...current, password }));
                              if (password) setFieldError("password");
                            }}
                            className={cn(
                              "h-11 border-slate-200 bg-white pl-10 pr-10 text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white",
                              errors.password && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            )}
                            aria-invalid={Boolean(errors.password)}
                          />
                          <PasswordToggle
                            shown={showPassword}
                            onClick={() => setShowPassword((value) => !value)}
                          />
                        </div>
                        {errors.password && <FieldError message={errors.password} />}
                      </div>

                      <Button
                        type="submit"
                        className="group h-11 w-full gap-2 overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/35"
                        disabled={authDisabled}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                        Đăng nhập
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-5">
                    <form className="space-y-4" onSubmit={handleSignUp} noValidate>
                      <div className="space-y-2">
                        <Label htmlFor="signup-username" className="text-slate-700 dark:text-slate-200">Tên hiển thị</Label>
                        <Input
                          id="signup-username"
                          name="username"
                          autoComplete="name"
                          placeholder="Nguyen Van A"
                          value={signup.username}
                          onChange={(event) => {
                            const username = event.target.value;
                            setSignup((current) => ({ ...current, username }));
                            if (username.trim().length >= 2) setFieldError("username");
                          }}
                          className={cn(
                            "h-11 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white",
                            errors.username && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                          )}
                          aria-invalid={Boolean(errors.username)}
                        />
                        {errors.username && <FieldError message={errors.username} />}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-slate-700 dark:text-slate-200">Email</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          value={signup.email}
                          onChange={(event) => {
                            const email = event.target.value;
                            setSignup((current) => ({ ...current, email }));
                            if (!email || emailRegex.test(email.trim())) setFieldError("email");
                          }}
                          onBlur={() => {
                            if (signup.email && !emailRegex.test(signup.email.trim())) setFieldError("email", "Email không hợp lệ.");
                          }}
                          className={cn(
                            "h-11 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white",
                            errors.email && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                          )}
                          aria-invalid={Boolean(errors.email)}
                        />
                        {errors.email && <FieldError message={errors.email} />}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-slate-700 dark:text-slate-200">Mật khẩu</Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="signup-password"
                            name="password"
                            type={showSignupPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Tối thiểu 8 ký tự"
                            value={signup.password}
                            onChange={(event) => {
                              const password = event.target.value;
                              const nextRules = getPasswordRules(password);
                              setSignup((current) => ({ ...current, password }));
                              if (nextRules.every((rule) => rule.valid)) setFieldError("password");
                              if (signup.confirmPassword && signup.confirmPassword !== password) {
                                setFieldError("confirmPassword", "Mật khẩu xác nhận không khớp.");
                              } else {
                                setFieldError("confirmPassword");
                              }
                            }}
                            className={cn(
                              "h-11 border-slate-200 bg-white pl-10 pr-10 text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white",
                              errors.password && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            )}
                            aria-invalid={Boolean(errors.password)}
                          />
                          <PasswordToggle
                            shown={showSignupPassword}
                            onClick={() => setShowSignupPassword((value) => !value)}
                          />
                        </div>
                        <PasswordStrength value={passwordStrength} />
                        <div className="grid grid-cols-2 gap-1.5">
                          {passwordRules.map((rule) => (
                            <div
                              key={rule.label}
                              className={cn(
                                "flex items-center gap-1.5 text-xs",
                                rule.valid ? "text-green-700 dark:text-green-300" : "text-slate-500 dark:text-slate-400"
                              )}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {rule.label}
                            </div>
                          ))}
                        </div>
                        {errors.password && <FieldError message={errors.password} />}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-slate-700 dark:text-slate-200">Xác nhận mật khẩu</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="signup-confirm-password"
                            name="confirmPassword"
                            type={showSignupConfirmPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Nhập lại mật khẩu"
                            value={signup.confirmPassword}
                            onChange={(event) => {
                              const confirmPassword = event.target.value;
                              setSignup((current) => ({ ...current, confirmPassword }));
                              if (!confirmPassword || confirmPassword === signup.password) setFieldError("confirmPassword");
                            }}
                            className={cn(
                              "h-11 border-slate-200 bg-white pl-10 pr-10 text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white",
                              errors.confirmPassword && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                            )}
                            aria-invalid={Boolean(errors.confirmPassword)}
                          />
                          <PasswordToggle
                            shown={showSignupConfirmPassword}
                            onClick={() => setShowSignupConfirmPassword((value) => !value)}
                          />
                        </div>
                        {errors.confirmPassword && <FieldError message={errors.confirmPassword} />}
                      </div>

                      <Button
                        type="submit"
                        className="group h-11 w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/35"
                        disabled={authDisabled}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                        Tạo tài khoản
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl text-slate-950 dark:text-white">Đặt lại mật khẩu</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-300">
                  Nhập email tài khoản. Nếu hợp lệ, hệ thống sẽ gửi hướng dẫn đặt lại mật khẩu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleForgotPassword} noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="text-slate-700 dark:text-slate-200">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(event) => {
                        const email = event.target.value;
                        setForgotPasswordEmail(email);
                        if (!email || emailRegex.test(email.trim())) setFieldError("forgotEmail");
                      }}
                      placeholder="you@company.com"
                      className={cn(
                        "h-11 border-slate-200 bg-white text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/15 dark:bg-white/10 dark:text-white",
                        errors.forgotEmail && "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                      )}
                      aria-invalid={Boolean(errors.forgotEmail)}
                    />
                    {errors.forgotEmail && <FieldError message={errors.forgotEmail} />}
                  </div>
                  <Button
                    type="submit"
                    className="h-11 w-full gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-cyan-700"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Gửi hướng dẫn
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setErrors({});
                    }}
                    disabled={isLoading}
                  >
                    Quay lại đăng nhập
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(8deg); }
        }
        @keyframes auth-card-in {
          from { opacity: 0; transform: translateY(18px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-float {
          animation: float 7s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .auth-card-in {
          animation: auth-card-in 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
      `}</style>
    </main>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-300">
      <AlertCircle className="h-3.5 w-3.5" />
      {message}
    </p>
  );
}

function PasswordToggle({ shown, onClick }: { shown: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="absolute right-1 top-1 h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
      onClick={onClick}
      aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}

function PasswordStrength({ value }: { value: number }) {
  const labels = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];
  const colors = ["bg-transparent", "bg-red-500", "bg-amber-500", "bg-blue-500", "bg-green-500"];

  return (
    <div className="  space-y-1.5">
      <div className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn("h-1.5 rounded-full bg-slate-200 dark:bg-white/15", step <= value && colors[value])}
          />
        ))}
      </div>
      {value > 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Độ mạnh: <span className="font-medium text-slate-700 dark:text-slate-200">{labels[value]}</span>
        </p>
      )}
    </div>
  );
}
