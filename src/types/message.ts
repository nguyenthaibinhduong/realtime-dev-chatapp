// Khai báo kiểu dữ liệu cho tin nhắn
export interface Message {
  id: number | string;
  text: string;
  type:"message" | "notification"|"system" | "code-share" | "file-upload" | "code-card";
  created_at: string;
  updated_at: string;
  sender: {
    id: number | string;
    username: string;
    email: string;
  };
  json_data:string | null;
  send_at: string;
  isMine: boolean;
  isPin?: boolean;
  attachments?: {
    id: number | string;
    fileUrl: string;
    mimeType: string;
    filename?: string;
  };
}

export interface MessageListProps {
  messages: Message[];
}
