import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Download,
  Search,
  Calendar,
  Eye,
  X,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Attachment {
  id: string;
  name: string;
  type: "image" | "video" | "document" | "audio" | "archive" | "other";
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  thumbnailUrl?: string;
}

interface AttachmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachments?: Attachment[];
}

const attachmentTypeConfig = {
  image: {
    label: "Hình ảnh",
    icon: Image,
    gradient: "from-blue-600 to-blue-700",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  video: {
    label: "Video",
    icon: Video,
    gradient: "from-purple-600 to-purple-700",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  document: {
    label: "Tài liệu",
    icon: FileText,
    gradient: "from-green-600 to-green-700",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  audio: {
    label: "Âm thanh",
    icon: Music,
    gradient: "from-pink-600 to-pink-700",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  archive: {
    label: "Tệp nén",
    icon: Archive,
    gradient: "from-yellow-600 to-orange-600",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  other: {
    label: "Khác",
    icon: File,
    gradient: "from-gray-600 to-gray-700",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
  },
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export const AttachmentModal = ({
  open,
  onOpenChange,
  attachments = [],
}: AttachmentModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(
    null
  );

  const filteredAttachments = useMemo(() => {
    return attachments.filter((attachment) => {
      const matchesSearch = attachment.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = !selectedType || attachment.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [attachments, searchQuery, selectedType]);

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    attachments.forEach((att) => {
      stats[att.type] = (stats[att.type] || 0) + 1;
    });
    return stats;
  }, [attachments]);

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.url, "_blank");
  };

  const handlePreview = (attachment: Attachment) => {
    if (["image", "video", "audio"].includes(attachment.type)) {
      setPreviewAttachment(attachment);
    } else {
      window.open(attachment.url, "_blank");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-zinc-950 text-white border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 -mx-6 -mt-6 px-6 py-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <File className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-white tracking-tight">
                      Tệp đính kèm
                    </DialogTitle>
                    <p className="text-zinc-400 text-sm font-medium">
                      {attachments.length} tệp trong cuộc trò chuyện
                    </p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Search */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input
                placeholder="Tìm kiếm tệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 px-6 py-4 border-b border-zinc-800 overflow-x-auto scrollbar-thin">
            <Badge
              variant={selectedType === null ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap ${
                selectedType === null
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
              }`}
              onClick={() => setSelectedType(null)}
            >
              Tất cả ({attachments.length})
            </Badge>
            {Object.entries(attachmentTypeConfig).map(([type, config]) => {
              const count = typeStats[type] || 0;
              if (count === 0) return null;

              return (
                <Badge
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  className={`cursor-pointer whitespace-nowrap ${
                    selectedType === type
                      ? `${config.bgColor} ${config.color} border-${config.color}`
                      : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700"
                  }`}
                  onClick={() => setSelectedType(type)}
                >
                  {config.label} ({count})
                </Badge>
              );
            })}
          </div>

          {/* Attachments List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {filteredAttachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <File className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-lg font-medium">
                  {searchQuery || selectedType
                    ? "Không tìm thấy tệp nào"
                    : "Chưa có tệp đính kèm"}
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  {searchQuery || selectedType
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                    : "Các tệp được chia sẻ sẽ hiển thị ở đây"}
                </p>
              </div>
            ) : (
              filteredAttachments.map((attachment) => {
                const config = attachmentTypeConfig[attachment.type];
                const Icon = config.icon;

                return (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-4 p-4 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-all duration-200 border border-zinc-800 hover:border-zinc-700 group"
                  >
                    {/* Thumbnail/Icon */}
                    <div className="relative">
                      {attachment.thumbnailUrl &&
                      attachment.type === "image" ? (
                        <img
                          src={attachment.thumbnailUrl}
                          alt={attachment.name}
                          className="w-14 h-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div
                          className={`w-14 h-14 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center`}
                        >
                          <Icon className="h-7 w-7 text-white" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate mb-1">
                        {attachment.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(attachment.uploadedAt)}
                        </span>
                        <span>•</span>
                        <span>{formatFileSize(attachment.size)}</span>
                        <span>•</span>
                        <span>{attachment.uploadedBy}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handlePreview(attachment)}
                        className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Xem"
                      >
                        <Eye className="h-4 w-4 text-zinc-400" />
                      </button>
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                        title="Tải xuống"
                      >
                        <Download className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {previewAttachment && (
        <Dialog
          open={!!previewAttachment}
          onOpenChange={() => setPreviewAttachment(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] bg-zinc-950 text-white border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            <div className="relative">
              <button
                onClick={() => setPreviewAttachment(null)}
                className="absolute top-2 right-2 z-10 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>

              {previewAttachment.type === "image" && (
                <img
                  src={previewAttachment.url}
                  alt={previewAttachment.name}
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
              )}

              {previewAttachment.type === "video" && (
                <video
                  src={previewAttachment.url}
                  controls
                  className="w-full h-auto max-h-[80vh] rounded-lg"
                />
              )}

              {previewAttachment.type === "audio" && (
                <div className="p-8">
                  <audio
                    src={previewAttachment.url}
                    controls
                    className="w-full"
                  />
                </div>
              )}

              <div className="mt-4 p-4 bg-zinc-900 rounded-lg">
                <p className="text-white font-semibold mb-2">
                  {previewAttachment.name}
                </p>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>{formatFileSize(previewAttachment.size)}</span>
                  <span>•</span>
                  <span>{formatDate(previewAttachment.uploadedAt)}</span>
                  <span>•</span>
                  <span>{previewAttachment.uploadedBy}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
