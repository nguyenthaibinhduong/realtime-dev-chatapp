export interface SlashCommand {
  name: string;
  description: string;
  options?: CommandOption[];
  execute: (args: string[], context: CommandContext) => Promise<void> | void;
}

export interface CommandOption {
  name: string;
  description: string;
  type: 'string' | 'number' | 'user' | 'channel';
  required?: boolean;
}

export interface CommandContext {
  channelId: string;
  userId: string;
  sendMessage: (content: string) => void;
  createChannel: (name: string, type: 'public' | 'private', memberIds?: string[]) => void;
  toast: (options: { title: string; description: string }) => void;
}