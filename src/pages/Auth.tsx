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
import { Eye, EyeOff, MessageSquare, Github } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGitHub } = useAuth();

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

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    const { error } = await signUp(email, password, username);

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
                      minLength={6}
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
