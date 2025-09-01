import { useQuery } from "@tanstack/react-query";
import { ChatAPI } from "@/api/api";

export const useSearchUsers = (searchTerm: string) => {
  return useQuery({
    queryKey: ["search-users", searchTerm],
    queryFn: async () => {
      const response = await ChatAPI.fetchSearchUser(searchTerm, 10);
      return response.data || [];
    },
    enabled: searchTerm.length >= 1,
    staleTime: 30 * 1000,
  });
};

export const useSearchChats = (searchTerm: string) => {
  return useQuery({
    queryKey: ["search-chats", searchTerm],
    queryFn: async () => {
      const response = await ChatAPI.fetchSearchChat(
        "personal",
        searchTerm,
        10
      );
      return response.data || [];
    },
    enabled: searchTerm.length >= 1,
    staleTime: 30 * 1000,
  });
};
