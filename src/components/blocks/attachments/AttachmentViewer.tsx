import { useState, useEffect } from "react";
import { FileText, Download, ExternalLink, AlertCircle } from "lucide-react";

interface AttachmentViewerProps {
  url: string;
  filename?: string;
  mimeType?: string;
}

export const AttachmentViewer = ({
  url,
  filename = "document",
  mimeType = "",
}: AttachmentViewerProps) => {
  const [viewerError, setViewerError] = useState(false);
  const [loading, setLoading] = useState(true);



  // Reset error khi URL thay đổi
  useEffect(() => {
    setViewerError(false);
    setLoading(true);
  }, [url]);

  // Xác định loại file
  const isExcel =
    url.includes(".xlsx") ||
    url.includes(".xls") ||
    mimeType.includes("spreadsheet");

  const isPDF = url.includes(".pdf") || mimeType === "application/pdf";

  const isImage =
    mimeType.startsWith("image/") ||
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);

  const isVideo =
    mimeType.startsWith("video/") || /\.(mp4|webm|ogg|mov)$/i.test(url);

  // Encode URL properly
  const encodedUrl = encodeURIComponent(url);

  // Handle iframe load error
  const handleIframeError = () => {
    setViewerError(true);
    setLoading(false);
  };

  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Fallback: Download button
  const DownloadFallback = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-900 via-gray-950 to-black p-8 text-center">
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">
          Không thể xem trước
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          File này không thể hiển thị trực tiếp trong trình duyệt. Vui lòng tải
          xuống để xem.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={url}
            download={filename}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
          >
            <Download className="h-4 w-4" />
            Tải xuống
          </a>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Mở tab mới
          </a>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <FileText className="h-4 w-4 inline mr-1" />
          {filename}
        </div>
      </div>
    </div>
  );

  // Nếu có lỗi, hiển thị fallback
  if (viewerError) {
    return <DownloadFallback />;
  }

  // Image viewer
  if (isImage) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center p-4">
        <img
          src={url}
          alt={filename}
          className="max-h-full max-w-full object-contain rounded-lg"
          onError={() => setViewerError(true)}
        />
      </div>
    );
  }

  // Video viewer
  if (isVideo) {
    return (
      <div className="h-full w-full bg-black flex items-center justify-center">
        <video
          src={url}
          controls
          className="max-h-full max-w-full"
          onError={() => setViewerError(true)}
        >
          Trình duyệt không hỗ trợ video này.
        </video>
      </div>
    );
  }

  // PDF viewer - dùng browser native
  if (isPDF) {
    return (
      <div className="h-full w-full relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        <iframe
          src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
          className="h-full w-full"
          onError={handleIframeError}
          onLoad={handleIframeLoad}
          title={filename}
        />
      </div>
    );
  }

  // Excel viewer - Office Web Apps
  if (isExcel) {
    return (
      <div className="h-full w-full relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        )}
        <iframe
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`}
          className="h-full w-full"
          onError={handleIframeError}
          onLoad={handleIframeLoad}
          title={filename}
        />
      </div>
    );
  }

  // Fallback: Google Docs Viewer cho các file khác (Word, PPT, etc.)
  // Nhưng có error handling tốt hơn
  return (
    <div className="h-full w-full relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      )}
      <iframe
        src={`https://docs.google.com/gview?url=${encodedUrl}&embedded=true`}
        className="h-full w-full"
        onError={handleIframeError}
        onLoad={handleIframeLoad}
        title={filename}
        sandbox="allow-scripts allow-same-origin"
      />

      {/* Timeout fallback - nếu sau 10s vẫn loading */}
      {loading && (
        <div
          className="absolute bottom-4 right-4"
          onClick={() => setViewerError(true)}
        >
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg">
            Tải xuống thay thế
          </button>
        </div>
      )}
    </div>
  );
};
