import { useNavigate } from "react-router-dom";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ProfileLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [username, setUsername] = React.useState(user?.name || "nnma06118053");
  const [newUsername, setNewUsername] = React.useState(user?.name || "nnma06118053");
  const email = user?.email || "********@gmail.com";

  React.useEffect(() => {
    if (!isAuthenticated()) navigate("/auth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = () => {
    setNewUsername(username);
    setEditing(true);
  };

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    setUsername(newUsername);
    setEditing(false);
    // TODO: Gọi API cập nhật tên người dùng ở đây nếu cần
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-zinc-900 to-slate-800">
      <div className="w-full max-w-xl mt-12 bg-white/5 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-white text-center">Hồ sơ của tôi</h2>
        <div className="space-y-6">
          {/* Tên người dùng */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Tên người dùng</label>
            {!editing ? (
              <div className="flex items-center gap-3">
                <span className="text-base text-white font-semibold">{username}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                  onClick={handleEdit}
                >
                  Cập nhật
                </Button>
              </div>
            ) : (
              <form onSubmit={handleUpdateUsername} className="flex items-center gap-3">
                <Input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-40"
                  required
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="default"
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  Lưu
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="bg-zinc-700 text-white hover:bg-zinc-800"
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </Button>
              </form>
            )}
          </div>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
            <span className="text-base text-white">{email}</span>
          </div>
          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4">
            <Button
              variant="default"
              size="lg"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Đổi mật khẩu
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="bg-white text-black hover:bg-zinc-100 border"
            >
              Hủy liên kết Github
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
