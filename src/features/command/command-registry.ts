import { SlashCommand, CommandContext } from './commands.type';
import { ChannelRegistry } from './registry/channel.registry';

export const commands: Record<string, SlashCommand> = {

  ...ChannelRegistry,

  help: {
    name: 'help',
    description: 'Hiển thị danh sách lệnh',
    execute: (args: string[], context: CommandContext) => {
      const commandList = Object.values(commands)
        .map(cmd => `**/${cmd.name}** - ${cmd.description}`)
        .join('\n');
      
      context.sendMessage(`**Danh sách lệnh có sẵn:**\n${commandList}`);
    }
  },

  shrug: {
    name: 'shrug',
    description: 'Gửi ¯\\_(ツ)_/¯',
    execute: (args: string[], context: CommandContext) => {
      const message = args.length > 0 ? `${args.join(' ')} ¯\\_(ツ)_/¯` : '¯\\_(ツ)_/¯';
      context.sendMessage(message);
    }
  }
};

export const parseCommand = (input: string): { command: string; args: string[] } | null => {
  if (!input.startsWith('/')) return null;
  
  const parts = input.slice(1).split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  return { command, args };
};

export const executeCommand = async (input: string, context: CommandContext): Promise<boolean> => {
  const parsed = parseCommand(input);
  if (!parsed) return false;
  
  const { command, args } = parsed;
  const cmd = commands[command];
  
  if (!cmd) {
    context.toast({
      title: 'Lệnh không tồn tại',
      description: `Lệnh "/${command}" không được tìm thấy. Sử dụng /help để xem danh sách lệnh.`
    });
    return true;
  }
  
  try {
    await cmd.execute(args, context);
  } catch (error) {
    context.toast({
      title: 'Lỗi thực thi lệnh',
      description: 'Đã xảy ra lỗi khi thực thi lệnh.'
    });
  }
  
  return true;
};