import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import attachmentService from "@/services/attachmentService";
import { useAuth } from "@/hooks/useAuth";
import authService from "@/services/authService";

interface UpdateAvatarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateAvatar: React.FC<UpdateAvatarProps> = ({
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const { user, setUser } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = attachmentService.validateFile(file, {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ["image/*"],
      allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    });

    if (!validation.valid) {
      toast({
        title: "File không hợp lệ",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const preview = attachmentService.createPreviewUrl(file);
    setPreviewUrl(preview);
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      attachmentService.cleanupPreviewUrls([previewUrl]);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setUploadProgress(0);

    try {
      const avatarUrl = await attachmentService.uploadAvatar(
        selectedFile,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Refresh user profile to get updated avatar
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
        description: "Avatar đã được cập nhật.",
      });

      handleClose();
    } catch (error: any) {
      console.error("Upload avatar error:", error);
      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Có lỗi xảy ra khi cập nhật avatar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    handleRemoveFile();
    setLoading(false);
    setUploadProgress(0);
    onOpenChange(false);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">
            Cập nhật Avatar
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Chọn ảnh mới để cập nhật avatar của bạn. Chỉ chấp nhận file ảnh dưới
            5MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Hidden file input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview area */}
          <div className="flex flex-col items-center gap-4">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-48 h-48 rounded-full object-cover border-4 border-gray-700"
                />
                <button
                  onClick={handleRemoveFile}
                  disabled={loading}
                  className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={handleBrowseClick}
                className="w-48 h-48 rounded-full border-4 border-dashed border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-gray-800/50 transition-colors"
              >
                <ImageIcon className="w-12 h-12 text-gray-500 mb-2" />
                <p className="text-sm text-gray-400">Click để chọn ảnh</p>
              </div>
            )}

            {/* File info */}
            {selectedFile && (
              <div className="text-center space-y-1">
                <p className="text-sm text-gray-300 font-medium">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {attachmentService.formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}

            {/* Progress bar */}
            {loading && uploadProgress > 0 && (
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Đang tải lên...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Browse button */}
          {!selectedFile && (
            <Button
              onClick={handleBrowseClick}
              variant="outline"
              className="w-full border-gray-600 text-slate-700 hover:bg-gray-700/50 hover:text-white"
            >
              <Upload className="w-4 h-4 mr-2 " />
              Chọn ảnh từ máy tính
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="border-gray-600 text-slate-700 hover:bg-gray-700/50 hover:text-white"
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang tải...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Cập nhật
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
