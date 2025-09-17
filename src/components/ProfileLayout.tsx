import { Navigate, useNavigate } from "react-router-dom";
import React from "react";
import { useAuth } from "@/hooks/useAuth";

const ProfileLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [showEmail, setShowEmail] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthenticated()) navigate("/auth");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = "minhanh";
  const username = "nnma06118053";
  const email = "********@gmail.com";
  const phone = null;

  return (
    <div className="h-full p-6">
      <h2 className="text-2xl font-bold mb-4 text-white">Hồ sơ của tôi</h2>
      <div className="flex-col items-center mb-6">
        <div className="flex-1 bg-slate-700 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white">Tên người dùng</h3>
          <p className="text-sm text-white">{username}</p>
          <h3 className="text-lg font-semibold text-white pt-2">Email</h3>
          <p className="text-sm text-white">{email}</p>
        </div>
        <button className="bg-blue-500 text-white px-4 py-2 rounded mt-8">
          Đổi mật khẩu
        </button>
      </div>
    </div>
  );
};

export default ProfileLayout;
