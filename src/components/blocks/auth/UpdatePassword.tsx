import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { AuthAPI } from "@/api/api";
import { useToast } from "@/hooks/useToast";

interface UpdatePasswordProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdatePassword: React.FC<UpdatePasswordProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("Ít nhất 8 ký tự");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Ít nhất 1 chữ hoa");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Ít nhất 1 chữ thường");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Ít nhất 1 chữ số");
    }
    return errors;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user types
    setErrors((prev) => ({ ...prev, [field]: "" }));

    // Real-time validation for new password
    if (field === "newPassword" && value) {
      const validationErrors = validatePassword(value);
      if (validationErrors.length > 0) {
        setErrors((prev) => ({
          ...prev,
          newPassword: validationErrors.join(", "),
        }));
      }
    }

    // Check if confirm password matches
    if (field === "confirmPassword" && value) {
      if (value !== formData.newPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Mật khẩu xác nhận không khớp",
        }));
      }
    }

    if (field === "newPassword" && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors((prev) => ({
          ...prev,
          confirmPassword: "Mật khẩu xác nhận không khớp",
        }));
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else {
      const validationErrors = validatePassword(formData.newPassword);
      if (validationErrors.length > 0) {
        newErrors.newPassword = validationErrors.join(", ");
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu cũ";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await AuthAPI.updatePassword({
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      });

      if (response.status === 200) {
        toast({
          title: "Thành công",
          description: response.data.msg,
          variant: "default",
        });

        // Reset form
        setFormData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setErrors({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        onOpenChange(false);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.msg;

      toast({
        title: "Cập nhật thất bại",
        description: errorMessage,
        variant: "destructive",
      });

      // If old password is incorrect
      if (errorMessage.includes("Mật khẩu cũ không chính xác")) {
        setErrors((prev) => ({
          ...prev,
          oldPassword: "Mật khẩu cũ không chính xác",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setErrors({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onOpenChange(false);
    }
  };

  const passwordStrength = (
    password: string
  ): { label: string; color: string; width: string } => {
    if (!password) return { label: "", color: "", width: "0%" };

    const validationErrors = validatePassword(password);
    if (validationErrors.length === 0) {
      return { label: "Mạnh", color: "bg-green-500", width: "100%" };
    } else if (validationErrors.length <= 2) {
      return { label: "Trung bình", color: "bg-yellow-500", width: "66%" };
    } else {
      return { label: "Yếu", color: "bg-red-500", width: "33%" };
    }
  };

  const strength = passwordStrength(formData.newPassword);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white border border-zinc-800 shadow-2xl rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Lock className="h-6 w-6 text-black dark:text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-black dark:text-white">
                Đổi mật khẩu
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-sm">
                Cập nhật mật khẩu của bạn để bảo mật tài khoản
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Old Password */}
          <div className="space-y-2">
            <Label
              htmlFor="oldPassword"
              className="text-sm font-medium text-gray-300"
            >
              Mật khẩu cũ <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOldPassword ? "text" : "password"}
                value={formData.oldPassword}
                onChange={(e) =>
                  handleInputChange("oldPassword", e.target.value)
                }
                placeholder="Nhập mật khẩu cũ"
                disabled={loading}
                className={`pr-10 bg-zinc-50
dark:bg-zinc-900 border-zinc-800 text-black dark:text-white placeholder:text-zinc-500 focus:border-yellow-500 ${errors.oldPassword ? "border-red-500" : ""
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
              >
                {showOldPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.oldPassword && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.oldPassword}
              </div>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label
              htmlFor="newPassword"
              className="text-sm font-medium text-gray-300"
            >
              Mật khẩu mới <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                placeholder="Nhập mật khẩu mới"
                disabled={loading}
                className={`pr-10 bg-zinc-50
dark:bg-zinc-900 border-zinc-800 text-black dark:text-white placeholder:text-zinc-500 focus:border-yellow-500 ${errors.newPassword ? "border-red-500" : ""
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.newPassword && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Độ mạnh mật khẩu</span>
                  <span
                    className={`font-medium ${strength.label === "Mạnh"
                      ? "text-green-500"
                      : strength.label === "Trung bình"
                        ? "text-yellow-500"
                        : "text-red-500"
                      }`}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: strength.width }}
                  />
                </div>
              </div>
            )}

            {errors.newPassword && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.newPassword}
              </div>
            )}

            {/* Password Requirements */}
            <div className="bg-zinc-50
dark:bg-zinc-900/50 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-medium text-zinc-400 mb-2">
                Yêu cầu mật khẩu:
              </p>
              {[
                {
                  check: formData.newPassword.length >= 8,
                  text: "Ít nhất 8 ký tự",
                },
                {
                  check: /[A-Z]/.test(formData.newPassword),
                  text: "Ít nhất 1 chữ hoa",
                },
                {
                  check: /[a-z]/.test(formData.newPassword),
                  text: "Ít nhất 1 chữ thường",
                },
                {
                  check: /[0-9]/.test(formData.newPassword),
                  text: "Ít nhất 1 chữ số",
                },
              ].map((req, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {req.check ? (
                    <CheckCircle className="h-3 w-3 text-green-500" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-zinc-600" />
                  )}
                  <span
                    className={req.check ? "text-green-500" : "text-zinc-500"}
                  >
                    {req.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-gray-300"
            >
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                placeholder="Nhập lại mật khẩu mới"
                disabled={loading}
                className={`pr-10 bg-zinc-50
dark:bg-zinc-900 border-zinc-800 text-black dark:text-white placeholder:text-zinc-500 focus:border-yellow-500 ${errors.confirmPassword ? "border-red-500" : ""
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <div className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 border-zinc-700 text-slate-900 hover:bg-zinc-100 dark:bg-zinc-800 hover:text-black dark:text-white"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-black dark:text-white"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật mật khẩu"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
