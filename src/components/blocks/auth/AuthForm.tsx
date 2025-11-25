import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, MessageSquare, Github, Code2, Users, Zap, Shield } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { chatSocketService } from '@/services/chatSocketService';

export default function AuthForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signIn, signUp, user } = useAuth();

    const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = (formData.get("email") as string)?.trim();
        const password = formData.get("password") as string;
        if (!email || !password) {
            toast({ title: "Thiếu thông tin", description: "Nhập email và mật khẩu", variant: "destructive" });
            setIsLoading(false);
            return;
        }
        const res = await signIn(email, password);
        if (res.error) {
            // Hiển thị lỗi cụ thể từ response
            toast({ title: "Lỗi đăng nhập", description: res.error, variant: "destructive" });
            setIsLoading(false);
            return;
        }
        toast({ title: "Đăng nhập thành công", description: "Chào mừng bạn quay trở lại!" });
        setIsLoading(false);
    };

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const username = formData.get('username') as string;
        const res = await signUp(email, password, username);
        if (res.error) {
            // Hiển thị lỗi cụ thể từ response
            toast({ title: "Lỗi đăng ký", description: res.error, variant: "destructive" });
            setIsLoading(false);
            return;
        }
        toast({ title: "Đăng ký thành công", description: "Vui lòng kiểm tra email để xác nhận tài khoản." });
        setIsLoading(false);
    };

    const handleForgotPassword = async () => {
        // const email = prompt("Nhập email để lấy lại mật khẩu:");
        // if (!email) return;
        // setIsLoading(true);
        // const res = await forgotPassword(email);
        // if (res.error) {
        //     toast({ title: "Lỗi", description: res.error, variant: "destructive" });
        // } else {
        //     toast({ title: "Thành công", description: "Vui lòng kiểm tra email để đặt lại mật khẩu." });
        // }
        // setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950">
                {/* Pattern Overlay */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6TTAgMTZjMC00LjQxOCAzLjU4Mi04IDgtOHM4IDMuNTgyIDggOC0zLjU4MiA4LTggOC04LTMuNTgyLTgtOHptMCA0MGMwLTQuNDE4IDMuNTgyLTggOC04czggMy41ODIgOCA4LTMuNTgyIDgtOCA4LTgtMy41ODItOC04em0zNiAwYzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6TTEyIDI4YzAtNC40MTggMy41ODItOCA4LThzOCAzLjU4MiA4IDgtMy41ODIgOC04IDgtOC0zLjU4Mi04LTh6bTI0IDBjMC00LjQxOCAzLjU4Mi04IDgtOHM4IDMuNTgyIDggOC0zLjU4MiA4LTggOC04LTMuNTgyLTgtOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />

                {/* Animated Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-gradient" />

                {/* Floating Geometric Shapes */}
                <div className="absolute top-20 left-10 w-20 h-20 border-2 border-blue-400/20 rounded-lg rotate-45 animate-float" />
                <div className="absolute top-40 right-20 w-16 h-16 border-2 border-purple-400/20 rounded-full animate-float animation-delay-2000" />
                <div className="absolute bottom-32 left-1/4 w-12 h-12 border-2 border-cyan-400/20 rotate-12 animate-float animation-delay-4000" />
                <div className="absolute bottom-20 right-1/3 w-24 h-24 border-2 border-pink-400/20 rounded-full animate-pulse" />

                {/* Glowing Orbs */}
                <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob" />
                <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
                <div className="absolute -bottom-8 left-20 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
            </div>

            {/* Content Container - Smaller and Compact */}
            <div className="relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
                {/* Left Side - Introduction with Glass Effect */}
                <div className="flex-1 text-black dark:text-white space-y-5 max-w-lg">
                    {/* Hero Section with Glass Card */}
                    <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg shadow-blue-500/50">
                                <MessageSquare className="h-6 w-6 text-black dark:text-white" />
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                                CodeSync Chat
                            </h1>
                        </div>

                        <p className="text-sm lg:text-base text-gray-300 leading-relaxed mb-3">
                            Nền tảng giao tiếp thời gian thực cho đội ngũ phát triển
                        </p>

                        <p className="text-xs text-gray-400 leading-relaxed">
                            Kết hợp chat realtime, chia sẻ code và tích hợp GitHub. Tăng hiệu suất làm việc nhóm.
                        </p>
                    </div>

                    {/* Features Grid - Compact */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="group p-3 bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-md rounded-xl border border-blue-400/20 hover:border-blue-400/40 hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300">
                            <div className="p-2 bg-blue-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                                <Code2 className="h-4 w-4 text-blue-400" />
                            </div>
                            <h3 className="font-semibold text-xs mb-1 text-blue-300">Code Sharing</h3>
                            <p className="text-[10px] text-gray-400 leading-tight">Syntax highlighting</p>
                        </div>
                        <div className="group p-3 bg-gradient-to-br from-purple-500/10 to-purple-600/5 backdrop-blur-md rounded-xl border border-purple-400/20 hover:border-purple-400/40 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300">
                            <div className="p-2 bg-purple-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                                <Users className="h-4 w-4 text-purple-400" />
                            </div>
                            <h3 className="font-semibold text-xs mb-1 text-purple-300">Team Work</h3>
                            <p className="text-[10px] text-gray-400 leading-tight">Channels & threads</p>
                        </div>
                        <div className="group p-3 bg-gradient-to-br from-yellow-500/10 to-amber-600/5 backdrop-blur-md rounded-xl border border-yellow-400/20 hover:border-yellow-400/40 hover:shadow-lg hover:shadow-yellow-500/20 transition-all duration-300">
                            <div className="p-2 bg-yellow-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                                <Zap className="h-4 w-4 text-yellow-400" />
                            </div>
                            <h3 className="font-semibold text-xs mb-1 text-yellow-300">Real-time</h3>
                            <p className="text-[10px] text-gray-400 leading-tight">WebSocket sync</p>
                        </div>
                        <div className="group p-3 bg-gradient-to-br from-green-500/10 to-emerald-600/5 backdrop-blur-md rounded-xl border border-green-400/20 hover:border-green-400/40 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
                            <div className="p-2 bg-green-500/20 rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                                <Shield className="h-4 w-4 text-green-400" />
                            </div>
                            <h3 className="font-semibold text-xs mb-1 text-green-300">Secure</h3>
                            <p className="text-[10px] text-gray-400 leading-tight">Authentication</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Auth Form with Enhanced Glass Effect */}
                <Card className="w-full max-w-sm bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/50 hover:shadow-blue-500/20 transition-all duration-300">
                    <CardHeader className="text-center pb-3 space-y-1">
                        <div className="inline-block mx-auto mb-2 p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/50">
                            <MessageSquare className="h-5 w-5 text-black dark:text-white" />
                        </div>
                        <CardTitle className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Chào mừng trở lại</CardTitle>
                        <CardDescription className="text-xs text-gray-400">
                            Đăng nhập để tiếp tục
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                        <Tabs defaultValue="signin" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-white/5 backdrop-blur-md border border-white/10 p-1">
                                <TabsTrigger
                                    value="signin"
                                    className="text-xs text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-black dark:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all rounded-md"
                                >
                                    Đăng nhập
                                </TabsTrigger>
                                <TabsTrigger
                                    value="signup"
                                    className="text-xs text-gray-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-black dark:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 transition-all rounded-md"
                                >
                                    Đăng ký
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="signin" className="space-y-3 mt-4">
                                <form onSubmit={handleSignIn} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="text" className="text-xs text-gray-300 font-medium">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="text"
                                            placeholder="your@email.com"
                                            className="bg-white/5 backdrop-blur-md border-white/20 text-black dark:text-white text-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 h-9 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-xs text-gray-300 font-medium">Mật khẩu</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                className="bg-white/5 backdrop-blur-md border-white/20 text-black dark:text-white text-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 pr-10 h-9 transition-all"
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
                                    </div>
                                    <Button
                                        type="button"
                                        variant="link"
                                        className="w-full px-0 text-xs text-blue-400 hover:text-blue-300 h-auto py-1"
                                        onClick={handleForgotPassword}
                                    >
                                        Quên mật khẩu?
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-black dark:text-white text-sm h-9 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center gap-2">
                                                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                <span className="text-xs">Đang đăng nhập...</span>
                                            </span>
                                        ) : "Đăng nhập"}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="signup" className="space-y-3 mt-4">
                                <form onSubmit={handleSignUp} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="username" className="text-xs text-gray-300 font-medium">Tên người dùng</Label>
                                        <Input
                                            id="username"
                                            name="username"
                                            type="text"
                                            placeholder="username"
                                            required
                                            className="bg-white/5 backdrop-blur-md border-white/20 text-black dark:text-white text-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 h-9 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-email" className="text-xs text-gray-300 font-medium">Email</Label>
                                        <Input
                                            id="signup-email"
                                            name="email"
                                            type="email"
                                            placeholder="your@email.com"
                                            required
                                            className="bg-white/5 backdrop-blur-md border-white/20 text-black dark:text-white text-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 h-9 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="signup-password" className="text-xs text-gray-300 font-medium">Mật khẩu</Label>
                                        <div className="relative">
                                            <Input
                                                id="signup-password"
                                                name="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                                className="bg-white/5 backdrop-blur-md border-white/20 text-black dark:text-white text-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 pr-10 h-9 transition-all"
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
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        Mật khẩu phải có ít nhất 6 ký tự
                                    </p>
                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-black dark:text-white text-sm h-9 font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all"
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