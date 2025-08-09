import { CommandContext, SlashCommand } from "../commands.type";

export const ChannelRegistry: Record<string, SlashCommand> = {
  create: {
    name: "create",
    description: "Tạo kênh mới",
    options: [
      {
        name: "name",
        description: "Tên kênh",
        type: "string",
        required: true,
      },
      {
        name: "type",
        description: "Loại kênh (public/private)",
        type: "string",
        required: false,
      },
    ],
    execute: async (args: string[], context: CommandContext) => {
      const [name, type = "public"] = args;
      if (!name) {
        context.toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên kênh",
        });
        return;
      }

      await context.createChannel(name, type as "public" | "private");
    },
  },
};
