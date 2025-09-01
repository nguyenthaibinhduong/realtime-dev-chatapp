import { useQuery } from "@tanstack/react-query";
import { ChatAPI } from "@/api/api";

//Search Users
export const useSearchUsers = (key: string, limit: number) => {
  return useQuery({
    queryKey: ["search-users", key],
    queryFn: async () => {
      const response = await ChatAPI.fetchSearchUser(key, limit);
      return response.data || [];
    },
    enabled: key.length >= 1,
    staleTime: 30 * 1000,
  });
};

//Search Channels
export const useSearchChats = (key: string, limit: number, type?: string) => {
  return useQuery({
    queryKey: ["search-chats", key, type],
    queryFn: async () => {
      const response = await ChatAPI.fetchSearchChat(key, limit, type);
      return response.data || [];
    },
    enabled: key.length >= 1,
    staleTime: 30 * 1000,
  });
};
