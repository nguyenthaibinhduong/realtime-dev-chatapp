import { useState, useCallback, useEffect, useRef } from "react";
import { ChatAPI } from "@/api/api";
import { useToast } from "./useToast";

export interface NonMemberUser {
  id: number;
  username: string;
  email: string;
  avatar?: string;
}

export interface NonMemberFilters {
  username?: string;
}

export interface UseNonMembersResult {
  users: NonMemberUser[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  filters: NonMemberFilters;
  fetchNonMembers: (reset?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: NonMemberFilters) => void;
  resetFilters: () => void;
}

export interface UseChannelActionsResult {
  loading: boolean;
  error: string | null;
  addMembers: (
    channelId: string | number,
    memberIds: number[]
  ) => Promise<boolean>;
  removeMember: (
    channelId: string | number,
    memberId: number
  ) => Promise<boolean>;
  leaveChannel: (channelId: string | number) => Promise<boolean>;
  renameChannel: (
    channelId: string | number,
    newName: string
  ) => Promise<boolean>;
}

const LIMIT = 20;

/**
 * Hook for fetching non-member users with cursor-based pagination
 */
export const useNonMembers = (
  channelId?: string | number
): UseNonMembersResult => {
  const [users, setUsers] = useState<NonMemberUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFiltersState] = useState<NonMemberFilters>({});
  const { toast } = useToast();

  // Sử dụng ref để lưu filters mới nhất
  const filtersRef = useRef<NonMemberFilters>(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchNonMembers = useCallback(
    async (reset: boolean = false) => {
      if (!channelId) return;
      if (loading) return;
      if (!reset && !hasMore) return;

      setLoading(true);
      setError(null);

      try {
        const currentFilters = filtersRef.current;

        const params: any = {
          channelId,
          limit: LIMIT,
          cursor: reset ? undefined : cursor,
          username: currentFilters.username,
        };

        const response = await ChatAPI.fetchNonMemberUsers(params);

        if (response.status === 200 && response.data) {
          const newUsers = response.data.users || [];
          const nextCursor = response.data.nextCursor;

          if (reset) {
            setUsers(newUsers);
          } else {
            setUsers((prev) => [...prev, ...newUsers]);
          }

          setCursor(nextCursor);
          setHasMore(!!nextCursor && newUsers.length === LIMIT);
        } else {
          throw new Error(response.msg || "Không thể tải danh sách người dùng");
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.msg || err.message || "Có lỗi xảy ra";
        setError(errorMsg);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [channelId, cursor, hasMore, loading, toast]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchNonMembers(false);
  }, [hasMore, loading, fetchNonMembers]);

  const setFilters = useCallback((newFilters: NonMemberFilters) => {
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
    setUsers([]);
    setCursor(undefined);
    setHasMore(true);
    setError(null);
  }, [channelId]);

  return {
    users,
    loading,
    error,
    hasMore,
    filters,
    fetchNonMembers,
    loadMore,
    setFilters,
    resetFilters,
  };
};

/**
 * Hook for channel management actions
 */
export const useChannelActions = (): UseChannelActionsResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addMembers = useCallback(
    async (
      channelId: string | number,
      memberIds: number[]
    ): Promise<boolean> => {
      if (!channelId || !memberIds || memberIds.length === 0) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn ít nhất một thành viên",
          variant: "destructive",
        });
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await ChatAPI.addMembers({
          channel_id: channelId,
          member_ids: memberIds,
        });

        if (response.status === 200) {
          toast({
            title: response.msg || "Thành công",
            description: `Đã thêm ${memberIds.length} thành viên vào kênh`,
          });
          return true;
        } else {
          throw new Error(response.msg || "Không thể thêm thành viên");
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.msg || err.message || "Có lỗi xảy ra";
        setError(errorMsg);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const removeMember = useCallback(
    async (channelId: string | number, memberId: number): Promise<boolean> => {
      if (!channelId || !memberId) {
        toast({
          title: "Lỗi",
          description: "Thông tin không hợp lệ",
          variant: "destructive",
        });
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await ChatAPI.removeMember({
          channelId,
          memberId,
        });

        if (response.status === 200) {
          toast({
            title: "Thành công",
            description: "Đã xóa thành viên khỏi kênh",
          });
          return true;
        } else {
          throw new Error(response.msg || "Không thể xóa thành viên");
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.msg || err.message || "Có lỗi xảy ra";
        setError(errorMsg);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const leaveChannel = useCallback(
    async (channelId: string | number): Promise<boolean> => {
      if (!channelId) {
        toast({
          title: "Lỗi",
          description: "Thông tin không hợp lệ",
          variant: "destructive",
        });
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await ChatAPI.leaveChannel({
          channelId,
        });

        if (response.status === 200) {
          toast({
            title: "Thành công",
            description: "Bạn đã rời khỏi kênh",
          });
          return true;
        } else {
          throw new Error(response.msg || "Không thể rời kênh");
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.msg || err.message || "Có lỗi xảy ra";
        setError(errorMsg);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  const renameChannel = useCallback(
    async (channelId: string | number, newName: string): Promise<boolean> => {
      if (!channelId || !newName || !newName.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên kênh mới",
          variant: "destructive",
        });
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await ChatAPI.renameChannel({
          channelId,
          name: newName.trim(),
        });

        if (response.status === 200) {
          toast({
            title: "Thành công",
            description: `Đã đổi tên kênh thành "${newName}"`,
          });
          return true;
        } else {
          throw new Error(response.msg || "Không thể đổi tên kênh");
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.msg || err.message || "Có lỗi xảy ra";
        setError(errorMsg);
        toast({
          title: "Lỗi",
          description: errorMsg,
          variant: "destructive",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  return {
    loading,
    error,
    addMembers,
    removeMember,
    leaveChannel,
    renameChannel,
  };
};

export const useChannel = (channelId?: string | number) => {
  const nonMembers = useNonMembers(channelId);
  const actions = useChannelActions();

  return {
    ...nonMembers,
    ...actions,
  };
};
