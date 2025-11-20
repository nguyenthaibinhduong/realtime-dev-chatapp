import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";
import { cn } from "@/lib/utils";
import AvatarUser from "@/components/common/AvartarUser";
import {
    formatMessageTime,
    COLORS,
    TYPOGRAPHY,
    SPACING,
    BORDERS,
    SHADOWS,
    TRANSITIONS,
    getMessageContainerClasses,
    LAYOUT
} from "./messageStyles";

interface CodeShareMessageProps {
    message: any;
    isMe: boolean;
    showSenderInfo: boolean;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
    onOpenCode: (params: any) => void;
}

const CodeShareMessage = memo(({
    message,
    isMe,
    showSenderInfo,
    hoveredId,
    onHover,
    onOpenCode,
}: CodeShareMessageProps) => {
    let jsonData: any = {};
    try {
        jsonData = message.json_data ? JSON.parse(message.json_data) : {};
    } catch {
        jsonData = {};
    }

    const repo = jsonData.repo;
    const refParam = jsonData.refParam;
    const codePath = jsonData.initialPath;
    const installation_id = jsonData.installation_id;
    const json_code_data = jsonData.code_text || "No code shared";

    const handleClick = () => {
        onOpenCode({
            repo,
            refParam,
            initialPath: codePath,
            installation_id: message?.sender?.github_installation_id || installation_id,
            isShare: true,
            json_code_data
        });
    };

    return (
        <div className={cn(
            "flex my-3",
            isMe ? "justify-end" : "justify-start"
        )}>
            {/* Avatar người gửi */}
            {!isMe && showSenderInfo && (
                <div className="mr-2 flex flex-col items-center justify-center">
                    <AvatarUser user={message?.sender} isMe={isMe} size={8} />
                </div>
            )}

            <div
                onClick={handleClick}
                className={cn(
                    "flex flex-col cursor-pointer items-stretch w-full",
                    // Giới hạn max 50% khung chat và responsive
                    "max-w-[50vw] sm:max-w-[400px] md:max-w-[450px] lg:max-w-[500px]",
                    "min-w-[280px] sm:min-w-[320px]",
                    TRANSITIONS.normal,
                    !isMe && !showSenderInfo && "ml-10"
                )}
            >
                {/* Tiêu đề repo */}
                <div className={cn(
                    "rounded-t-lg bg-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2",
                    COLORS.text.primary,
                    TYPOGRAPHY.weight.semibold,
                    "text-[10px] sm:text-[11px]"
                )}>
                    <Code className="h-3 w-3 sm:h-4 sm:w-4 text-white flex-shrink-0" />
                    <span className="flex-1 truncate">{repo?.full_name}</span>
                    <span className="font-mono text-blue-200 text-[9px] sm:text-xs truncate max-w-[80px] sm:max-w-none">
                        {codePath?.split("/").pop()}
                    </span>
                </div>

                {/* Nội dung */}
                <div className={cn(
                    "rounded-b-lg px-2 sm:px-3 py-1.5 sm:py-2 flex flex-col items-center",
                    COLORS.bg.card,
                    COLORS.border.default,
                    "border",
                    SHADOWS.lg
                )}>
                    <div className="flex items-center gap-1 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap justify-center">
                        <span className={cn(TYPOGRAPHY.weight.semibold, "text-blue-400 text-[10px] sm:text-[11px]")}>
                            Chia sẻ code
                        </span>
                        <span className={cn("text-[8px] sm:text-[9px]", COLORS.text.mutedDark)}>
                            {formatMessageTime(message.send_at || message.created_at)}
                        </span>
                    </div>

                    <div className={cn("text-[10px] sm:text-[11px]", COLORS.text.primary, "mb-1.5 sm:mb-2 text-center")}>
                        <span className={TYPOGRAPHY.weight.semibold}>{message?.sender?.username}</span>
                        <span className="mx-0.5 sm:mx-1">đã chia sẻ file</span>
                        <span className="font-mono text-blue-400 break-all">{codePath?.split("/").pop()}</span>
                        <span className="mx-0.5 sm:mx-1 hidden sm:inline">từ repo</span>
                        <span className="font-mono text-emerald-400 break-all hidden sm:inline">{repo?.full_name}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-1 sm:mt-2">
                        <Button
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700 transition-colors h-7 sm:h-8 text-[10px] sm:text-[11px]"
                            onClick={handleClick}
                        >
                            <Code className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> Xem code
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

CodeShareMessage.displayName = "CodeShareMessage";

export default CodeShareMessage;