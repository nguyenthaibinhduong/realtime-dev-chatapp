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
import attachmentService from "@/services/attachmentService";
import { usePreview } from "@/hooks/useAttachmentPreview";
import { blockUi } from "@/components/blocks/block-ui";

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
};

// Mapping mime types to attachment types

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
  const { setPreviewUrl } = usePreview();
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
        document: "document",
        archive: "compressed",
      };
      newFilters.mimeType = mimeTypeMap[selectedType];
    }
    if (selectedSender) newFilters.senderId = selectedSender;
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
        <DialogContent className={`max-w-4xl h-[min(82vh,760px)] w-[calc(100vw-1.5rem)] overflow-hidden flex flex-col rounded-xl p-0 ${blockUi.dialog}`}>
          {/* Header */}
          <div
            className={`px-6 py-6 ${blockUi.dialogHeader}`}
          >
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg border border-primary/15 bg-primary/10 text-primary flex items-center justify-center">
                    <File className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold text-foreground tracking-tight">
                      Tệp đính kèm
                    </DialogTitle>
                    <p className="text-muted-foreground text-sm font-medium">
                      {attachments.length} tệp trong cuộc trò chuyện
                    </p>
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Search */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm tệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 ${blockUi.input}`}
              />
            </div>
          </div>

          {/* Filter Tabs & Advanced Filters */}
          <div className="px-6 py-4 border-b border-border space-y-3">
            {/* Type Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto scrollbar-thin">
              <Badge
                variant={selectedType === null ? "default" : "outline"}
                className={`cursor-pointer whitespace-nowrap ${
                  selectedType === null
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : `${blockUi.chip} hover:bg-accent hover:text-foreground`
                }`}
                onClick={() => setSelectedType(null)}
              >
                Tất cả
              </Badge>
              {Object.entries(attachmentTypeConfig).map(([type, config]) => {
                return (
                  <Badge
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    className={`cursor-pointer whitespace-nowrap ${
                      selectedType === type
                        ? `${config.bgColor} ${config.color} border-transparent`
                        : `${blockUi.chip} hover:bg-accent hover:text-foreground`
                    }`}
                    onClick={() => setSelectedType(type)}
                  >
                    {config.label}
                  </Badge>
                );
              })}
            </div>

            {/* Advanced Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Sender Filter */}
              {members.length > 0 && (
                <Popover>
                  <div className="space-y-2 w-36">
                    <Select
                      value={selectedSender || ""}
                      onValueChange={setSelectedSender}
                    >
                      <SelectTrigger className={blockUi.select}>
                        <SelectValue placeholder="Chọn người gửi" />
                      </SelectTrigger>
                      <SelectContent
                        className="border-border bg-popover text-popover-foreground"
                      >
                        {members.map((member) => (
                          <SelectItem
                            key={member.id}
                            value={member.id.toString()}
                            className="text-foreground"
                          >
                            {member.username}
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
                    className={`${blockUi.subtleButton} ${
                      startDate || endDate ? "border-primary" : ""
                    }`}
                  >
                    <Calendar className="h-3 w-3 mr-1" />
                    {startDate || endDate ? "Đã lọc ngày" : "Ngày tạo"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-72 border-border bg-popover text-popover-foreground"
                >
                  <div className="space-y-3">
                    <Label className="text-sm text-muted-foreground">
                      Lọc theo ngày
                    </Label>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Từ ngày</Label>
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
                          className={blockUi.input}
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
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
                          className={blockUi.input}
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
                  className="bg-red-500 text-white hover:bg-red-600"
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
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            ) : filteredAttachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <File className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-foreground text-lg font-medium">
                  {searchQuery ||
                  selectedType ||
                  selectedSender ||
                  startDate ||
                  endDate
                    ? "Không tìm thấy tệp nào"
                    : "Chưa có tệp đính kèm"}
                </p>
                <p className="text-muted-foreground text-sm mt-1">
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
                      fileUrl={attachment.fileUrl}
                      showRemove={false}
                      onPreview={() => {
                        setPreviewUrl(attachment.fileUrl);
                        onOpenChange(false);
                      }}
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
                      className={blockUi.subtleButton}
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
    </>
  );
};
