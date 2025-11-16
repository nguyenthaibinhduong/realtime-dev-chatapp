import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Eye, EyeOff, MessageSquare, Github, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
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

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { error } = await signIn(email, password);

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
    // Validate password rules
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
      // reset signup form
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
      await signInWithGitHub(); // Sẽ redirect đến GitHub
    } catch (error) {
      console.error("GitHub login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--chat-background))] p-4">
      <Card className="w-full max-w-md bg-sidebar border-sidebar-border">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <MessageSquare className="h-8 w-8 text-primary mr-2" />
            <CardTitle className="text-2xl font-bold text-sidebar-foreground">
              CodeSync Chat
            </CardTitle>
          </div>
          <CardDescription className="text-sidebar-foreground/80">
            Ứng dụng nhắn tin chuyên sâu cho lập trình viên
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-sidebar-accent">
              <TabsTrigger value="signin" className="text-sidebar-foreground">
                Đăng nhập
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-sidebar-foreground">
                Đăng ký
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sidebar-foreground">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sidebar-foreground">
                    Mật khẩu
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-sidebar-foreground/50" />
                      ) : (
                        <Eye className="h-4 w-4 text-sidebar-foreground/50" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
              <Button
                onClick={handleSignInGitHub}
                className="w-full bg-white text-black mt-3 hover:bg-slate-200"
                disabled={isLoading}
              >
                <Github />
                {isLoading
                  ? "Đang đăng nhập với github..."
                  : "Đăng nhập với github"}
              </Button>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sidebar-foreground">
                    Tên người dùng
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="username"
                    required
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-email"
                    className="text-sidebar-foreground"
                  >
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-password"
                    className="text-sidebar-foreground"
                  >
                    Mật khẩu
                  </Label>
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
                        // realtime validation
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
                      className={`bg-sidebar-accent border-sidebar-border text-sidebar-foreground pr-10 ${
                        signupErrors.password ? "border-red-500" : ""
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
                        <EyeOff className="h-4 w-4 text-sidebar-foreground/50" />
                      ) : (
                        <Eye className="h-4 w-4 text-sidebar-foreground/50" />
                      )}
                    </Button>
                  </div>
                  {/* Strength indicator */}
                  {signupPassword && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-sidebar-foreground/70">Độ mạnh mật khẩu</span>
                        {(() => {
                          const s = passwordStrength(signupPassword);
                          return (
                            <span
                              className={`font-medium ${
                                s.label === "Mạnh"
                                  ? "text-green-500"
                                  : s.label === "Trung bình"
                                    ? "text-yellow-500"
                                    : "text-red-500"
                              }`}
                            >
                              {s.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden">
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
                    <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {signupErrors.password}
                    </div>
                  )}
                  {/* Requirements */}
                  <div className="bg-sidebar-accent rounded-md p-2 mt-1">
                    {[
                      { check: signupPassword.length >= 8, text: "Ít nhất 8 ký tự" },
                      { check: /[A-Z]/.test(signupPassword), text: "Ít nhất 1 chữ hoa" },
                      { check: /[a-z]/.test(signupPassword), text: "Ít nhất 1 chữ thường" },
                      { check: /[0-9]/.test(signupPassword), text: "Ít nhất 1 chữ số" },
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {req.check ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3 w-3 text-sidebar-foreground/40" />
                        )}
                        <span className={req.check ? "text-green-500" : "text-sidebar-foreground/70"}>{req.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="signup-confirm-password"
                    className="text-sidebar-foreground"
                  >
                    Nhập lại mật khẩu
                  </Label>
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
                      className={`bg-sidebar-accent border-sidebar-border text-sidebar-foreground pr-10 ${
                        signupErrors.confirmPassword ? "border-red-500" : ""
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
                        <EyeOff className="h-4 w-4 text-sidebar-foreground/50" />
                      ) : (
                        <Eye className="h-4 w-4 text-sidebar-foreground/50" />
                      )}
                    </Button>
                  </div>
                  {signupErrors.confirmPassword && (
                    <div className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {signupErrors.confirmPassword}
                    </div>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
