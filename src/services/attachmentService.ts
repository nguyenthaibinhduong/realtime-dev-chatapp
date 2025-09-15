import { UploadApi } from "@/api/api";

export interface UploadResult {
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  key: string;
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  result?: UploadResult;
}

class AttachmentService {
  /**
   * Upload file to R2 Cloudflare using presigned URL
   * @param file - File to upload
   * @param onProgress - Progress callback
   * @returns Upload result
   */
  async uploadSingleFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      onProgress?.(10); // Start progress

      // 1. Get presigned URL
      console.log("Getting presigned URL for:", file.name);
      const presignedResponse = await UploadApi.getPresignedUrl({
        filename: file.name,
        contentType: file.type,
      });

      console.log("Presigned response:", presignedResponse);

      const { uploadUrl, fileUrl, key } = presignedResponse.data;
      console.log("Upload URL:", uploadUrl);
      console.log("File URL:", fileUrl);

      onProgress?.(30); // Got presigned URL

      // 2. Upload file to R2 using presigned URL
      console.log("Starting upload to R2...");
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file, // Binary data
        headers: {
          "Content-Type": file.type,
          // Remove Content-Length - browser handles this automatically
          // "Content-Length": file.size.toString(),
        },
      });

      console.log("Upload response status:", uploadResponse.status);
      console.log("Upload response ok:", uploadResponse.ok);
      console.log("Upload response statusText:", uploadResponse.statusText);

      onProgress?.(80); // Upload completed

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed response:", errorText);
        throw new Error(
          `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`
        );
      }

      onProgress?.(100); // Complete

      // 3. Return upload result
      const result = {
        filename: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        key,
      };

      return result;
    } catch (error) {
      console.error("Upload file error", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      throw error;
    }
  }

  /**
   * Upload multiple files with progress tracking
   * @param files - Files to upload
   * @param onProgress - Progress callback for each file
   * @returns Array of upload results
   */
  async uploadFile(
    files: File[] | null,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadResult[]> {
    try {
      if (!files || files.length === 0) return [];

      const results: UploadResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const result = await this.uploadSingleFile(file, (progress) => {
          onProgress?.(i, progress);
        });

        results.push(result);
        console.log(`File ${i + 1}/${files.length} uploaded:`, result.fileUrl);
      }

      return results;
    } catch (error) {
      console.error("Upload files error", error);
      throw error;
    }
  }

  /**
   * Upload files with detailed progress tracking
   * @param files - Files to upload
   * @param onFileProgress - Progress callback for individual files
   * @param onOverallProgress - Overall progress callback
   * @returns Array of upload results
   */
  async uploadFilesWithProgress(
    files: File[],
    onFileProgress?: (fileIndex: number, progress: UploadProgress) => void,
    onOverallProgress?: (completedFiles: number, totalFiles: number) => void
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) return [];

    const results: UploadResult[] = [];
    let completedFiles = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Initialize progress
        onFileProgress?.(i, {
          file,
          progress: 0,
          status: "pending",
        });

        // Start upload
        onFileProgress?.(i, {
          file,
          progress: 10,
          status: "uploading",
        });

        const result = await this.uploadSingleFile(file, (progress) => {
          onFileProgress?.(i, {
            file,
            progress,
            status: "uploading",
          });
        });

        // Complete
        onFileProgress?.(i, {
          file,
          progress: 100,
          status: "completed",
          result,
        });

        results.push(result);
        completedFiles++;
        onOverallProgress?.(completedFiles, files.length);
      } catch (error) {
        // Error
        onFileProgress?.(i, {
          file,
          progress: 0,
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        });

        throw error; // Re-throw to stop the process
      }
    }

    return results;
  }

  /**
   * Validate file before upload
   * @param file - File to validate
   * @param options - Validation options
   * @returns Validation result
   */
  validateFile(
    file: File,
    options: {
      maxSize?: number; // in bytes
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): { valid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [
        "image/*",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      allowedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".pdf",
        ".doc",
        ".docx",
        ".txt",
      ],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`,
      };
    }

    // Check file type
    const isTypeAllowed = allowedTypes.some((type) => {
      if (type.includes("*")) {
        const [mainType] = type.split("/");
        return file.type.startsWith(mainType);
      }
      return file.type === type;
    });

    // Check file extension
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isExtensionAllowed = allowedExtensions.includes(fileExtension);

    if (!isTypeAllowed && !isExtensionAllowed) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: ${allowedTypes.join(", ")}`,
      };
    }

    return { valid: true };
  }

  /**
   * Get file info without uploading
   * @param file - File to analyze
   * @returns File information
   */
  getFileInfo(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      extension: "." + file.name.split(".").pop()?.toLowerCase(),
      sizeFormatted: this.formatFileSize(file.size),
    };
  }

  /**
   * Format file size to human readable string
   * @param bytes - File size in bytes
   * @returns Formatted string
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Create a preview URL for image files
   * @param file - Image file
   * @returns Preview URL
   */
  createPreviewUrl(file: File): string | null {
    if (!file.type.startsWith("image/")) return null;
    return URL.createObjectURL(file);
  }

  /**
   * Cleanup preview URLs to prevent memory leaks
   * @param urls - Array of preview URLs to cleanup
   */
  cleanupPreviewUrls(urls: string[]) {
    urls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
  }

  //get-object-url from R2
  async getObjectUrl(key: string): Promise<string> {
    try {
      const response = await UploadApi.getObjectUrl({ key });
      return response.data;
    } catch (error) {
      console.error("Get object URL error", error);
      throw error;
    }
  }
}

export const attachmentService = new AttachmentService();
export default attachmentService;
