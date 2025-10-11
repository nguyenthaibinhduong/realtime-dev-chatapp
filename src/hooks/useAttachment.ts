import { useState, useCallback, useEffect } from "react";
import { AttachmentAPI } from "@/api/api";
import { useToast } from "./useToast";

export interface Attachment {
  id: number;
  filename: string;
  mimeType: string;
  fileSize: number;
  key: string;
  senderId: number;
  senderName?: string;
  channelId: number;
  createdAt: string;
  url?: string;
}

export interface AttachmentFilters {
  filename?: string;
  mimeType?: string;
  senderId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface UseAttachmentResult {
  attachments: Attachment[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  filters: AttachmentFilters;
  fetchAttachments: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: AttachmentFilters) => void;
  resetFilters: () => void;
}

const LIMIT = 20;

export const useAttachment = (
  channelId?: string | number
): UseAttachmentResult => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFiltersState] = useState<AttachmentFilters>({});
  const { toast } = useToast();

  const fetchAttachments = useCallback(
    async (reset: boolean = false) => {
      if (!channelId) return;
      if (loading) return;
      if (!reset && !hasMore) return;

      setLoading(true);
      setError(null);

      try {
        const params: any = {
          channelId,
          limit: LIMIT,
          cursor: reset ? undefined : cursor,
          filename: filters.filename,
          mimeType: filters.mimeType,
          senderId: filters.senderId,
          startDate: filters.startDate?.toISOString(),
          endDate: filters.endDate?.toISOString(),
        };

        const response = await AttachmentAPI.getAttachmentsByChannel(params);
        if (response.status === 200 && response.data) {
          const newAttachments = response.data.attachments || [];
          const nextCursor = response.data.nextCursor;

          if (reset) {
            setAttachments(newAttachments);
          } else {
            setAttachments((prev) => [...prev, ...newAttachments]);
          }

          setCursor(nextCursor);
          setHasMore(!!nextCursor && newAttachments.length === LIMIT);
        } else {
          throw new Error(response.msg || "Không thể tải attachments");
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.msg || err.message || "Có lỗi xảy ra";
        setError(errorMsg);
        toast({
          title: "",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [channelId, cursor, hasMore, loading, filters, toast]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchAttachments(false);
  }, [hasMore, loading, fetchAttachments]);

  const setFilters = useCallback((newFilters: AttachmentFilters) => {
    setFiltersState(newFilters);
    setCursor(undefined);
    setHasMore(true);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({});
    setCursor(undefined);
    setHasMore(true);
  }, []);

  // Reset khi channelId thay đổi
  useEffect(() => {
    setAttachments([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);
  }, [channelId]);

  return {
    attachments,
    loading,
    error,
    hasMore,
    filters,
    fetchAttachments,
    loadMore,
    setFilters,
    resetFilters,
  };
};
