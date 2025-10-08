import { memo } from "react";

interface NotificationMessageProps {
    message: any;
    onViewRepo: () => void;
}

const NotificationMessage = memo(({ message, onViewRepo }: NotificationMessageProps) => {
    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="flex justify-center my-2">
            <div className="text-white px-4 py-2 rounded-full text-sm shadow flex items-center gap-2">
                <span className="font-semibold text-blue-400">
                    {message?.sender?.username}
                </span>
                <span>{message.text}</span>
                <span className="text-xs text-zinc-400">
                    {formatTime(message.send_at || message.created_at)}
                </span>
                <span
                    onClick={onViewRepo}
                    className="text-blue-600 hover:underline hover:cursor-pointer"
                >
                    xem
                </span>
            </div>
        </div>
    );
});

NotificationMessage.displayName = "NotificationMessage";

export default NotificationMessage;