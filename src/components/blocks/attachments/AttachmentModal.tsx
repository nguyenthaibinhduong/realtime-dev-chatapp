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
  Loader2,
  Filter,
  RotateCcw,
  User,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useAttachment,
  Attachment as AttachmentType,
} from "@/hooks/useAttachment";
import { AttachmentItem } from "./AttachmentItem";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttachmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId?: string | number;
  members?: any[];
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

// Mapping mime types to attachment types
const getMimeTypeCategory = (mimeType: string): string | null => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return "document";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("tar") ||
    mimeType.includes("gz")
  )
    return "archive";
  return "other";
};

export const AttachmentModal = ({
  open,
  onOpenChange,
  channelId,
  members = [],
}: AttachmentModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [previewAttachment, setPreviewAttachment] =
    useState<AttachmentType | null>(null);

  const {
    attachments,
    loading,
    error,
    hasMore,
    filters,
    fetchAttachments,
    loadMore,
    setFilters,
    resetFilters,
  } = useAttachment(channelId);

  // Fetch attachments khi mở modal hoặc channelId thay đổi
  useEffect(() => {
    if (open && channelId) {
      fetchAttachments(true);
    }
  }, [open, channelId]);

  // Apply filters khi thay đổi
  useEffect(() => {
    if (!open) return;

    const newFilters: any = {};
    if (searchQuery) newFilters.filename = searchQuery;
    if (selectedType) {
      // Map type to mimeType pattern
      const mimeTypeMap: Record<string, string> = {
        image: "image/",
        video: "video/",
        audio: "audio/",
        document: "application/pdf",
        archive: "application/zip",
      };
      newFilters.mimeType = mimeTypeMap[selectedType];
    }
    if (selectedSender) newFilters.senderId = parseInt(selectedSender);
    if (startDate) newFilters.startDate = startDate;
    if (endDate) newFilters.endDate = endDate;

    setFilters(newFilters);
  }, [searchQuery, selectedType, selectedSender, startDate, endDate]);

  useEffect(() => {
    fetchAttachments(true);
  }, [filters]);

  const filteredAttachments = useMemo(() => {
    return attachments;
  }, [attachments]);

  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {};
    attachments.forEach((att) => {
      const category = getMimeTypeCategory(att.mimeType);
      if (category) {
        stats[category] = (stats[category] || 0) + 1;
      }
    });
    return stats;
  }, [attachments]);

  const handleDownload = (attachment: AttachmentType) => {
    if (attachment.url) {
      window.open(attachment.url, "_blank");
    }
  };

  const handlePreview = (attachment: AttachmentType) => {
    const category = getMimeTypeCategory(attachment.mimeType);
    if (category && ["image", "video", "audio"].includes(category)) {
      setPreviewAttachment(attachment);
    } else if (attachment.url) {
      window.open(attachment.url, "_blank");
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType(null);
    setSelectedSender(null);
    setStartDate(undefined);
    setEndDate(undefined);
    resetFilters();
    fetchAttachments(true);
  };

  const activeFilterCount = [
    searchQuery,
    selectedType,
    selectedSender,
    startDate,
    endDate,
  ].filter(Boolean).length;

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

          {/* Filter Tabs & Advanced Filters */}
          <div className="px-6 py-4 border-b border-zinc-800 space-y-3">
            {/* Type Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-thin">
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

            {/* Advanced Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sender Filter */}
              {members.length > 0 && (
                <Popover>
                  <div className="space-y-2">
                    <Select
                      value={selectedSender || ""}
                      onValueChange={setSelectedSender}
                    >
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Chọn người gửi" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800">
                        <SelectItem value=" " className="text-white">
                          Tất cả người gửi
                        </SelectItem>
                        {members.map((member) => (
                          <SelectItem
                            key={member.id}
                            value={member.id.toString()}
                            className="text-white"
                          >
                            {member.username} ({member.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Popover>
              )}

              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 ${
                      startDate || endDate ? "border-blue-500" : ""
                    }`}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {startDate || endDate ? "Đã lọc ngày" : "Ngày tạo"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 bg-zinc-900 border-zinc-800">
                  <div className="space-y-3">
                    <Label className="text-sm text-zinc-400">
                      Lọc theo ngày
                    </Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-zinc-500">Từ ngày</Label>
                        <Input
                          type="date"
                          value={
                            startDate
                              ? startDate.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setStartDate(
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            )
                          }
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-zinc-500">
                          Đến ngày
                        </Label>
                        <Input
                          type="date"
                          value={
                            endDate ? endDate.toISOString().split("T")[0] : ""
                          }
                          onChange={(e) =>
                            setEndDate(
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            )
                          }
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Reset Filters */}
              {activeFilterCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="bg-red-500 hover:bg-red-600 text-white hover:text-slate-700"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Xóa bộ lọc ({activeFilterCount})
                </Button>
              )}
            </div>
          </div>

          {/* Attachments List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {loading && attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-zinc-400">Đang tải...</p>
              </div>
            ) : filteredAttachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <File className="h-8 w-8 text-zinc-600" />
                </div>
                <p className="text-zinc-400 text-lg font-medium">
                  {searchQuery ||
                  selectedType ||
                  selectedSender ||
                  startDate ||
                  endDate
                    ? "Không tìm thấy tệp nào"
                    : "Chưa có tệp đính kèm"}
                </p>
                <p className="text-zinc-500 text-sm mt-1">
                  {searchQuery ||
                  selectedType ||
                  selectedSender ||
                  startDate ||
                  endDate
                    ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                    : "Các tệp được chia sẻ sẽ hiển thị ở đây"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3 justify-items-center">
                  {filteredAttachments.map((attachment) => (
                    <AttachmentItem
                      key={attachment.id}
                      keyName={attachment.key}
                      filename={attachment.filename}
                      mimeType={attachment.mimeType}
                      fileSize={attachment.fileSize}
                      showRemove={false}
                      className="hover:shadow-lg transition-shadow w-40"
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={loadMore}
                      disabled={loading}
                      variant="outline"
                      className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Đang tải...
                        </>
                      ) : (
                        "Tải thêm"
                      )}
                    </Button>
                  </div>
                )}
              </>
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

              {getMimeTypeCategory(previewAttachment.mimeType) === "image" &&
                previewAttachment.url && (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.filename}
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                )}

              {getMimeTypeCategory(previewAttachment.mimeType) === "video" &&
                previewAttachment.url && (
                  <video
                    src={previewAttachment.url}
                    controls
                    className="w-full h-auto max-h-[80vh] rounded-lg"
                  />
                )}

              {getMimeTypeCategory(previewAttachment.mimeType) === "audio" &&
                previewAttachment.url && (
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
                  {previewAttachment.filename}
                </p>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span>{formatFileSize(previewAttachment.fileSize)}</span>
                  <span>•</span>
                  <span>
                    {formatDate(new Date(previewAttachment.createdAt))}
                  </span>
                  <span>•</span>
                  <span>
                    {previewAttachment.senderName ||
                      `User ${previewAttachment.senderId}`}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
