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
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AttachmentItemProps = {
  keyName?: string;
  fileUrl?: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
};

// Get file icon based on mime type or extension
const getFileIcon = (mimeType?: string, filename?: string) => {
  // Check mime type first
  if (mimeType) {
    if (mimeType.startsWith("image/")) return null; // Will show image preview
    if (mimeType.startsWith("video/")) return FileVideo;
    if (mimeType.startsWith("audio/")) return FileAudio;
    if (mimeType.includes("pdf")) return FileText;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return FileText;
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return FileSpreadsheet;
    if (
      mimeType.includes("zip") ||
      mimeType.includes("rar") ||
      mimeType.includes("7z")
    )
      return FileArchive;
    if (
      mimeType.includes("json") ||
      mimeType.includes("javascript") ||
      mimeType.includes("typescript")
    )
      return FileCode;
  }

  // Check file extension as fallback
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

  return File; // Default icon
};

// Get color class based on mime type
const getFileColor = (mimeType?: string, filename?: string) => {
  if (mimeType) {
    if (mimeType.startsWith("video/")) return "text-purple-400";
    if (mimeType.startsWith("audio/")) return "text-pink-400";
    if (mimeType.includes("pdf")) return "text-red-400";
    if (mimeType.includes("word") || mimeType.includes("document"))
      return "text-blue-400";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "text-green-400";
    if (mimeType.includes("zip") || mimeType.includes("rar"))
      return "text-yellow-400";
    if (mimeType.includes("json") || mimeType.includes("javascript"))
      return "text-orange-400";
  }

  if (filename) {
    const ext = filename.toLowerCase().split(".").pop();
    switch (ext) {
      case "pdf":
        return "text-red-400";
      case "doc":
      case "docx":
        return "text-blue-400";
      case "xls":
      case "xlsx":
        return "text-green-400";
      case "zip":
      case "rar":
      case "7z":
        return "text-yellow-400";
      case "js":
      case "jsx":
      case "ts":
      case "tsx":
      case "json":
        return "text-orange-400";
      case "mp4":
      case "avi":
      case "mov":
        return "text-purple-400";
      case "mp3":
      case "wav":
        return "text-pink-400";
      default:
        return "text-gray-400";
    }
  }

  return "text-gray-400";
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
}) => {
  const [url, setUrl] = useState<string | null>(fileUrl ?? null);
  const [loading, setLoading] = useState<boolean>(!!keyName && !fileUrl);
  const [error, setError] = useState<string | null>(null);

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

  const isImage = !!mimeType && mimeType.startsWith("image/");
  const FileIcon = getFileIcon(mimeType, filename);
  const fileColor = getFileColor(mimeType, filename);

  // Loading state
  if (loading) {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg ${className}`}
      >
        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        </div>
        <div className="flex-1">
          <div className="h-4 bg-zinc-800 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`flex items-center gap-3 p-3 bg-red-900/20 border border-red-800/50 rounded-lg ${className}`}
      >
        <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center">
          <X className="w-6 h-6 text-red-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-400">Failed to load</p>
          <p className="text-xs text-red-400/70">{error}</p>
        </div>
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="hover:bg-red-900/30"
          >
            <X className="w-4 h-4 text-red-400" />
          </Button>
        )}
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
        className={`relative group rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 ${className}`}
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
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm transition-colors"
            >
              <Download className="w-5 h-5 text-white" />
            </a>
            {showRemove && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg backdrop-blur-sm"
              >
                <X className="w-5 h-5 text-white" />
              </Button>
            )}
          </div>
        </div>
        {/* Filename */}
        <div className="p-2 bg-zinc-900/90 backdrop-blur-sm">
          <p className="text-xs text-white truncate font-medium">
            {filename || "Image"}
          </p>
          <p className="text-xs text-zinc-400">
            {attachmentService.formatFileSize(fileSize)}
          </p>
        </div>
      </div>
    );
  }

  // Non-image file
  return (
    <div
      className={`flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-colors group ${className}`}
    >
      {/* File icon */}
      <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
        {FileIcon && <FileIcon className={`w-6 h-6 ${fileColor}`} />}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {filename || "Unknown file"}
        </p>
        <p className="text-xs text-zinc-400">
          {attachmentService.formatFileSize(fileSize)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
          title="Download"
        >
          <Download className="w-4 h-4 text-zinc-400 hover:text-white transition-colors" />
        </a>
        {showRemove && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
            title="Remove"
          >
            <X className="w-4 h-4 text-zinc-400 hover:text-red-400 transition-colors" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AttachmentItem;
