// Khai báo kiểu dữ liệu cho tin nhắn
export interface Message {
    id: number;
    text: string;
    created_at: string;
    updated_at: string;
    sender: {
        id: number;
        username: string;
        email: string;
    };
    send_at: string;
    isMine: boolean;
}



export interface MessageListProps {
    messages: Message[];
}