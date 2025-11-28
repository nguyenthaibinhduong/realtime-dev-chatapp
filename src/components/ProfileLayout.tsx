import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Mail,
  Edit3,
  Check,
  X,
  Github,
  Key,
  Shield,
  LogOut,
  Unlink,
  AlertTriangle,
  Upload,
} from "lucide-react";
import { AuthAPI, GithubAPI } from "@/api/api";
import { useToast } from "@/hooks/useToast";
import authService from "@/services/authService";
import { UpdatePassword } from "./blocks/auth/UpdatePassword";
import AvatarUser from "./common/AvartarUser";
import attachmentService from "@/services/attachmentService";
import { UpdateAvatar } from "./blocks/auth/UpdateAvatar";

const ProfileLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, signOut } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState<string>(
    (user as any)?.username || user?.name || ""
  );
  const [loading, setLoading] = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [showUpdateAvatar, setShowUpdateAvatar] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/auth", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Update username state when user changes
  useEffect(() => {
    setUsername((user as any)?.username || user?.name || "");
  }, [user]);

  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setLoading(true);
    try {
      const response = await AuthAPI.updateProfile({
        username: username.trim(),
      });

      if (response.status == 200) {
        const userFromToken: any = await authService.getProfile();
        if (userFromToken) {
          setUser(
            localStorage.getItem("app_user")
              ? JSON.parse(localStorage.getItem("app_user") as string)
              : userFromToken
          );
        }

        toast({
          title: "Cập nhật thành công",
          description: "Tên người dùng đã được cập nhật.",
        });
      }

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Có lỗi xảy ra khi cập nhật.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkGithub = async () => {
    setLoading(true);
    try {
      const response: any = await GithubAPI.unlinkGithub();

      if (response.status == 200) {
        const userFromToken: any = await authService.getProfile();
        if (userFromToken) {
          setUser(
            localStorage.getItem("app_user")
              ? JSON.parse(localStorage.getItem("app_user") as string)
              : userFromToken
          );
        }

        toast({
          title: "Hủy liên kết thành công",
          description: "Đã hủy liên kết tài khoản GitHub.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Hủy liên kết thất bại",
        description: error.message || "Có lỗi xảy ra khi hủy liên kết.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/auth", { replace: true });
  };

  const handleUpdatePassword = () => {
    setShowUpdatePassword(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    );
  }

  const isGithubLinked = Boolean(user.github_installation_id);
  const userInitial = (user.username || user.name || user.email)
    ?.charAt(0)
    .toUpperCase();

  return (
    <div className="w-full mx-auto pt-8">
      <Card className="shadow-2xl bg-transparent border-black backdrop-blur-sm">
        <CardHeader className="text-center pb-6 border-b border-gray-700/50">
          <div className="flex flex-col items-center gap-4">
            <div
              className="cursor-pointer relative group"
              onClick={() => setShowUpdateAvatar(true)}
            >
              <AvatarUser user={user} isMe={user?.id === user?.id} size={24} />
              <div className="absolute inset-0 rounded-full bg-white dark:bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                <Upload className="w-8 h-8 text-black dark:text-white transition-opacity" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-800 dark:text-gray-100">
                Hồ sơ cá nhân
              </CardTitle>
              <p className="text-gray-400 mt-1">
                Quản lý thông tin và cài đặt tài khoản
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="w-4/5 mx-auto space-y-3 p-6">
          {/* Username Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-cente p-2 gap-2 text-gray-300">
              <User className="w-4 h-4 text-blue-400" />
              Tên người dùng
            </Label>

            {!isEditing ? (
              <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded-lg border border-gray-600/30">
                <span className="font-medium text-gray-200">
                  {(user as any).username || user.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-8 gap-2 text-gray-400 hover:text-gray-200 hover:bg-gray-600/50"
                >
                  <Edit3 className="w-4 h-4" />
                  Sửa
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUsernameUpdate} className="space-y-3">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên người dùng"
                  autoFocus
                  disabled={loading}
                  className="bg-gray-700/50 border-gray-600/50 text-gray-200 placeholder:text-gray-500 focus:border-blue-500/50"
                />

                {/* Buttons: cancel (left) + primary save (right) - responsive */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setUsername(user?.username || user?.name || "");
                    }}
                    disabled={loading}
                    className="gap-2 border-gray-600/50 text-gray-300 hover:bg-gray-700/50 hover:text-gray-200 sm:order-1"
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={loading || !username.trim()}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-black dark:text-white shadow-sm sm:order-2"
                  >
                    <Check className="w-4 h-4" />
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Email Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2 text-gray-300">
              <Mail className="w-4 h-4 text-green-400" />
              Email
            </Label>
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600/30">
              <span className="text-gray-200">{user.email}</span>
              <Badge
                variant={user.email_verified ? "default" : "secondary"}
                className={
                  user.email_verified
                    ? "bg-green-600/20 text-green-400 border-green-500/30"
                    : "bg-gray-600/20 text-gray-400 border-gray-500/30"
                }
              >
                {user?.email_verified ? "Đã xác minh" : "Chưa xác minh"}
              </Badge>
            </div>
          </div>

          <Separator className="bg-gray-700/50" />

          {/* GitHub Integration */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2 text-gray-300">
              <Github className="w-4 h-4 text-purple-400" />
              Tích hợp GitHub
            </Label>
            <div className="flex justify-between items-center">
              <div className="flex items-center justify-between bg-gray-700/50 rounded-lg border border-gray-600/30">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={isGithubLinked ? "default" : "secondary"}
                    className={
                      isGithubLinked
                        ? "bg-purple-600/20 text-purple-400 border-purple-500/30"
                        : "bg-gray-600/20 text-gray-400 border-gray-500/30"
                    }
                  >
                    {isGithubLinked ? "Đã liên kết" : "Chưa liên kết"}
                  </Badge>
                  {isGithubLinked && user.github_email && (
                    <span className="text-sm text-gray-400">
                      {user.github_email}
                    </span>
                  )}
                </div>
              </div>
              {isGithubLinked && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading}
                      className="max-w-44 h-10 px-3 border border-purple-500/50 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 hover:text-purple-300"
                    >
                      <Unlink className="w-4 h-4" />
                      Hủy liên kết
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-900 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-black dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                        Xác nhận hủy liên kết GitHub
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300 leading-relaxed">
                        Bạn có chắc chắn muốn gỡ ứng dụng GitHub khỏi tài khoản
                        này không?
                        <br />
                        <br />
                        <span className="text-yellow-400 font-medium">
                          Lưu ý:
                        </span>{" "}
                        Sau khi hủy liên kết, bạn sẽ không thể nhận thông báo từ
                        GitHub và các tính năng tích hợp sẽ bị tắt.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-gray-600 text-black hover:bg-gray-700/50 hover:text-black dark:text-white">
                        Hủy bỏ
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleUnlinkGithub}
                        disabled={loading}
                        className="bg-red-600/20 text-red-400 border-red-500/50 hover:bg-red-600/30 hover:text-red-300"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400 mr-2" />
                            Đang hủy...
                          </>
                        ) : (
                          "Xác nhận hủy liên kết"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>

          <Separator className="bg-gray-700/50" />

          {/* Action Buttons - compact + instruction above each button */}
          <div className="w-full mx-auto flex flex-col items-center gap-6">
            <div className="w-full flex justify-between gap-x-4">
              <p className="text-sm text text-black dark:text-white mb-2">
                Thay đổi mật khẩu định kỳ để bảo vệ tài khoản. Sử dụng mật khẩu
                mạnh (≥12 ký tự).
              </p>
              <Button
                variant="outline"
                onClick={handleUpdatePassword}
                aria-label="Đổi mật khẩu"
                className="
                  w-44 h-10 px-3 inline-flex items-center justify-center gap-2
                font-medium
                  border border-sky-500/30
                  bg-sky-600/10 hover:bg-sky-600/20
                  text-sky-600 hover:text-sky-400
                  active:scale-[.99]
                  focus-visible:outline-none
                  focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400
                  dark:focus-visible:ring-sky-500
                  transition-all
                "
              >
                <Key className="w-4 h-4" />
                Đổi mật khẩu
              </Button>
            </div>
            <div className="w-full flex justify-between gap-x-4">
              <p className="text-sm text-black dark:text-white mb-2">
                Đăng xuất sẽ kết thúc phiên hiện tại trên thiết bị này. Lưu công
                việc trước khi thoát.
              </p>
              <Button
                variant="destructive"
                className="w-44 h-10 px-3 flex items-center justify-center gap-2 bg-red-600/10 text-red-400 border-red-500/30 hover:bg-red-600/20"
                onClick={handleSignOut}
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <UpdatePassword
        open={showUpdatePassword}
        onOpenChange={setShowUpdatePassword}
      />
      <UpdateAvatar
        open={showUpdateAvatar}
        onOpenChange={setShowUpdateAvatar}
      />
    </div>
  );
};

export default ProfileLayout;
