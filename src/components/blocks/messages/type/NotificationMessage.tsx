import { memo } from "react";
import { cn } from "@/lib/utils";
import { formatMessageTime, COLORS, TYPOGRAPHY, SPACING, BORDERS } from "./messageStyles";

interface NotificationMessageProps {
    message: any;
    onViewRepo: () => void;
}

const NotificationMessage = memo(({ message, onViewRepo }: NotificationMessageProps) => {
    return (
        <div className="flex justify-center my-2">
            <div className={cn(
                "px-4 py-2 rounded-full shadow flex items-center gap-2",
                COLORS.text.primary,
                COLORS.bg.card,
                BORDERS.radius.full,
                TYPOGRAPHY.size.base
            )}>
                <span className={cn(TYPOGRAPHY.weight.semibold, "text-blue-400")}>
                    {message?.sender?.username}
                </span>
                <span className={COLORS.text.secondary}>{message.text}</span>
                <span className={cn(TYPOGRAPHY.size.xs, COLORS.text.mutedDark)}>
                    {formatMessageTime(message.send_at || message.created_at)}
                </span>
                {/* <span
                    onClick={onViewRepo}
                    className="text-blue-400 hover:text-blue-300 hover:underline cursor-pointer transition-colors"
                >
                    xem
                </span> */}
            </div>
        </div>
    );
});

NotificationMessage.displayName = "NotificationMessage";

export default NotificationMessage;