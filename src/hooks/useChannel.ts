import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatAPI } from "@/api/api";

interface CreateChannelData {
  userIds: number[];
  type: "personal" | "group" | "group-private";
  name: string;
}

export const useCreateChannel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateChannelData) => {
      const response = await ChatAPI.createChannel(data);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate và refetch channels list
      queryClient.invalidateQueries({
        queryKey: ["channels"],
      });
    },
    onError: (error: any) => {
      console.error("Error creating channel:", error);
    },
  });
};

// Hook riêng cho create group chat
export const useCreatePublicChannel = () => {
  const createChannel = useCreateChannel();

  return {
    ...createChannel,
    createGroupChat: (userIds: number[], name: string) => {
      return createChannel.mutate({
        userIds,
        type: "group",
        name,
      });
    },
  };
};

// Hook riêng cho create private channel
export const useCreatePrivateChannel = () => {
  const createChannel = useCreateChannel();

  return {
    ...createChannel,
    createPrivateChannel: (userIds: number[], name: string) => {
      return createChannel.mutate({
        userIds,
        type: "group-private",
        name,
      });
    },
  };
};

// Hook riêng cho create personal chat (1-on-1)
export const useCreatePersonalChat = () => {
  const createChannel = useCreateChannel();

  return {
    ...createChannel,
    createPersonalChat: (userId: number, name?: string) => {
      return createChannel.mutate({
        userIds: [userId],
        type: "personal",
        name: name || "Personal Chat",
      });
    },
  };
};
