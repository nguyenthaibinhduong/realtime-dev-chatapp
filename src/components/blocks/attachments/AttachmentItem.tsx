import React, { useEffect, useState } from "react";
import attachmentService from "@/services/attachmentService";
import {
  FileText,
  File,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  Download,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePreview } from "@/hooks/useAttachmentPreview";

type AttachmentItemProps = {
  keyName?: string;
  fileUrl?: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
  onPreview?: (url: string) => void;
};

// Get file icon based on mime type or extension
const getFileIcon = (mimeType?: string, filename?: string) => {
  if (mimeType) {
    if (mimeType.startsWith("image/")) return null;
    if (mimeType.startsWith("video/")) return FileVideo;
    if (mimeType.startsWith("audio/")) return FileAudio;
    if (mimeType.includes("pdf")) return FileText;
    if (mimeType.includes("sheet") || mimeType.includes("spreadsheet"))
      return FileSpreadsheet;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return FileText;
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("7z")
    )
      return FileArchive;
    if (
      mimeType.includes("json") ||
      mimeType.includes("javascript") ||
      mimeType.includes("typescript") ||
      mimeType.includes("--")
    )
      return FileCode;
  }

  if (filename) {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
      case "pdf":
        return FileText;
      case "doc":
      case "docx":
      case "txt":
        return FileText;
      case "xls":
      case "xlsx":
      case "csv":
        return FileSpreadsheet;
      case "zip":
      case "rar":
      case "7z":
      case "tar":
      case "gz":
        return FileArchive;
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "json":
      case "html":
      case "css":
      case "py":
      case "java":
      case "cpp":
      case "c":
      case "go":
        return FileCode;
      case "mp4":
      case "avi":
      case "mov":
      case "webm":
        return FileVideo;
      case "mp3":
      case "wav":
      case "ogg":
      case "m4a":
        return FileAudio;
      default:
        return File;
    }
  }

  return File;
};

// Get color and gradient based on mime type
const getFileStyle = (mimeType?: string, filename?: string) => {
  if (mimeType) {
    if (mimeType.startsWith("video/"))
      return {
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        gradient: "from-purple-600 to-purple-700",
      };
    if (mimeType.startsWith("audio/"))
      return {
        color: "text-pink-400",
        bg: "bg-pink-500/10",
        gradient: "from-pink-600 to-pink-700",
      };
    if (mimeType.includes("pdf"))
      return {
        color: "text-red-400",
        bg: "bg-red-500/10",
        gradient: "from-red-600 to-red-700",
      };
    if (mimeType.includes("sheet") || mimeType.includes("spreadsheet"))
      return {
        color: "text-green-400",
        bg: "bg-green-500/10",
        gradient: "from-green-600 to-green-700",
      };
    if (mimeType.includes("word") || mimeType.includes("document"))
      return {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        gradient: "from-blue-600 to-blue-700",
      };

    if (mimeType.includes("zip") || mimeType.includes("rar"))
      return {
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        gradient: "from-yellow-600 to-orange-600",
      };
    if (mimeType.includes("json") || mimeType.includes("javascript"))
      return {
        color: "text-orange-400",
        bg: "bg-orange-500/10",
        gradient: "from-orange-600 to-orange-700",
      };
  }

  if (filename) {
    const ext = filename.toLowerCase().split(".").pop();
    const extStyles: Record<
      string,
      { color: string; bg: string; gradient: string }
    > = {
      pdf: {
        color: "text-red-400",
        bg: "bg-red-500/10",
        gradient: "from-red-600 to-red-700",
      },
      doc: {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        gradient: "from-blue-600 to-blue-700",
      },
      docx: {
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        gradient: "from-blue-600 to-blue-700",
      },
      xls: {
        color: "text-green-400",
        bg: "bg-green-500/10",
        gradient: "from-green-600 to-green-700",
      },
      xlsx: {
        color: "text-green-400",
        bg: "bg-green-500/10",
        gradient: "from-green-600 to-green-700",
      },
      zip: {
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        gradient: "from-yellow-600 to-orange-600",
      },
      rar: {
        color: "text-yellow-400",
        bg: "bg-yellow-500/10",
        gradient: "from-yellow-600 to-orange-600",
      },
    };
    if (ext && extStyles[ext]) return extStyles[ext];
  }

  return {
    color: "text-gray-400",
    bg: "bg-gray-500/10",
    gradient: "from-gray-600 to-gray-700",
  };
};

export const AttachmentItem: React.FC<AttachmentItemProps> = ({
  keyName,
  fileUrl,
  filename,
  mimeType,
  fileSize,
  onRemove,
  showRemove = false,
  className = "",
  onPreview,
}) => {
  const [url, setUrl] = useState<string | null>(fileUrl ?? null);
  const [loading, setLoading] = useState<boolean>(!!keyName && !fileUrl);
  const [error, setError] = useState<string | null>(null);

  const { setPreviewUrl } = usePreview();

  useEffect(() => {
    let mounted = true;
    setError(null);

    if (!keyName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    attachmentService
      .getObjectUrl(keyName)
      .then((u) => {
        if (!mounted) return;
        setUrl(u);
      })
      .catch((err: any) => {
        if (!mounted) return;
        console.error("AttachmentItem.getObjectUrl error", err);
        setError(err?.message || "Failed to load file");
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [keyName, fileUrl]);

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!fileUrl) return;

    console.log("🖼️ Preview triggered:", {
      fileUrl,
      hasOnPreview: !!onPreview,
    });

    // Ưu tiên callback từ prop (nếu có)
    if (onPreview) {
      onPreview(fileUrl);
    } else {
      // Fallback: sử dụng context
      setPreviewUrl(fileUrl);
    }
  };

  const isImage = !!mimeType && mimeType.startsWith("image/");
  const FileIcon = getFileIcon(mimeType, filename);
  const fileStyle = getFileStyle(mimeType, filename);

  // Loading state
  if (loading) {
    return (
      <div
        className={`w-full max-w-[160px] bg-card border border-border rounded-xl overflow-hidden ${className}`}
      >
        <div className="aspect-square bg-muted flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
        </div>
        <div className="p-3 space-y-2">
          <div className="h-3 bg-muted rounded w-full"></div>
          <div className="h-2 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`w-full max-w-[160px] bg-red-900/20 border border-red-800/50 rounded-xl overflow-hidden ${className}`}
      >
        <div className="aspect-square bg-red-900/30 flex items-center justify-center">
          <X className="w-8 h-8 text-red-400" />
        </div>
        <div className="p-3">
          <p className="text-xs font-medium text-red-400 truncate">
            Failed to load
          </p>
          <p className="text-xs text-red-400/70 truncate">{error}</p>
        </div>
      </div>
    );
  }

  if (!url) {
    return null;
  }

  // Image preview
  if (isImage) {
    return (
      <div
        className={`relative group w-full max-w-[160px] rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200 ${className}`}
      >
        <div className="relative aspect-square">
          <img
            src={url}
            alt={filename || "attachment"}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23333' width='100' height='100'/%3E%3C/svg%3E";
            }}
          />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
              title="Tải xuống"
            >
              <Download className="w-5 h-5 text-white" />
            </a>
            {showRemove && onRemove && (
              <button
                onClick={onRemove}
                className="p-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg backdrop-blur-sm transition-colors"
                title="Xóa"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
        {/* Filename */}
        <div
          className="p-3 bg-card"
        >
          <p
            className="text-xs text-foreground truncate font-medium"
            title={filename}
          >
            {filename || "Image"}
          </p>
          {fileSize !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {attachmentService.formatFileSize(fileSize)}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Non-image file - Vertical card layout
  return (
    <div
      className={`relative group w-full max-w-[160px] bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all duration-200 ${className}`}
    >
      {/* Icon Section */}
      <div
        className={`aspect-square flex items-center justify-center ${fileStyle.bg} relative`}
      >
        <div
          className={`w-16 h-16 bg-gradient-to-br ${fileStyle.gradient} rounded-2xl flex items-center justify-center shadow-lg`}
        >
          {FileIcon && (
            <FileIcon className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
          {/* <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
            title="Mở"
          > */}
          <button
            type="button"
            onClick={handlePreview}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
          >
            <ExternalLink className="w-5 h-5 text-white" />
          </button>
          <a
            href={url}
            download={filename}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
            title="Tải xuống"
          >
            <Download className="w-5 h-5 text-white" />
          </a>
        </div>

        {/* Remove button */}
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Xóa"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      {/* File Info Section */}
      <div className="p-3 space-y-1">
        <p
          className="text-xs font-semibold text-foreground truncate leading-tight"
          title={filename}
        >
          {filename || "Unknown file"}
        </p>
        {fileSize !== undefined && (
          <p className="text-xs text-muted-foreground font-medium">
            {attachmentService.formatFileSize(fileSize)}
          </p>
        )}
      </div>

      {/* File type badge */}
      <div className="absolute top-2 left-2 px-2 py-0.5 bg-background/90 dark:bg-black/50 backdrop-blur-sm rounded-md border border-border/50">
        <p className={`text-[10px] font-semibold uppercase ${fileStyle.color}`}>
          {filename?.split(".").pop() || "File"}
        </p>
      </div>
    </div>
  );
};

export default AttachmentItem;
