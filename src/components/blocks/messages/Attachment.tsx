import React, { useEffect, useState } from "react";
import attachmentService from "@/services/attachmentService";

type AttachmentProps = {
  keyName?: string;
  fileUrl?: string;
  filename?: string;
  mimeType?: string;
  className?: string;
  fileSize?: number;
  style?: React.CSSProperties;
};

export const Attachment: React.FC<AttachmentProps> = ({
  keyName,
  fileUrl,
  filename,
  mimeType,
  fileSize,
  className = "w-56 rounded", // fixed width by default (change w-56 to adjust)
  style,
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
        console.error("Attachment.getObjectUrl error", err);
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

  // unified wrapper style to keep fixed width and auto height for images
  const wrapperStyle: React.CSSProperties = { width: undefined, ...style };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={wrapperStyle}
      >
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-2 bg-red-50 text-red-600 rounded ${className}`}
        style={wrapperStyle}
      >
        <div className="text-sm">Error loading attachment</div>
        <div className="text-xs text-red-500">{error}</div>
      </div>
    );
  }

  if (!url) {
    return (
      <div
        className={`p-2 bg-gray-50 text-gray-600 rounded ${className}`}
        style={wrapperStyle}
      >
        <div className="text-sm">No attachment</div>
      </div>
    );
  }

  if (isImage) {
    return (
      <div className={`inline-block ${className}`} style={wrapperStyle}>
        <img
          src={url}
          alt={filename || "attachment"}
          className="block w-full h-auto rounded"
          style={{ objectFit: "cover", ...style }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-3 p-2 bg-gray-800/30 rounded ${className}`}
      style={wrapperStyle}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm truncate">{filename || url}</div>
        <div className="text-xs">
          {attachmentService.formatFileSize(fileSize)}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary underline"
        >
          Open / Download
        </a>
      </div>
    </div>
  );
};

export default Attachment;
