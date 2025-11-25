import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageActions, MessageActionType } from "@/components/blocks/messages/MessageAction";
import AvatarUser from "@/components/common/AvartarUser";
import { Code2, Copy, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CodeCardMessageProps {
    message: any;
    isMe: boolean;
    showSenderInfo: boolean;
    hoveredId: string | null;
    onHover: (id: string | null) => void;
    onMessageAction?: (type: MessageActionType, messageId: string, messageData?: any) => void;
    onOpenInTool?: (code: string, language: string) => void;
}

const CodeCardMessage = memo(({
    message,
    isMe,
    showSenderInfo,
    hoveredId,
    onHover,
    onMessageAction,
    onOpenInTool
}: CodeCardMessageProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isHovered = hoveredId === String(message.id);

    // Get code data from json_data.codeData
    const getCodeData = () => {
        if (message.json_data?.codeData) {
            return {
                code: message.json_data.codeData.code || '',
                language: message.json_data.codeData.language || 'plaintext',
                author: message.json_data.codeData.author || message.sender?.username || 'Unknown'
            };
        }

        // Fallback - empty code
        return {
            code: '',
            language: 'plaintext',
            author: message.sender?.username || 'Unknown'
        };
    };

    const { code, language, author } = getCodeData();

    // Return early if no code
    if (!code.trim()) {
        return (
            <div className="text-gray-400 italic p-2 text-sm">
                [Code không khả dụng]
            </div>
        );
    }

    const codeLines = code.split('\n');
    const totalLines = codeLines.length;
    const PREVIEW_LINES = 5; // Hiển thị 5 dòng đầu thay vì 10
    const previewLines = isExpanded ? codeLines : codeLines.slice(0, PREVIEW_LINES);
    const hasMoreLines = totalLines > PREVIEW_LINES;

    // Language display mapping
    const languageMap: Record<string, { icon: string; name: string; color: string }> = {
        javascript: { icon: "🟨", name: "JavaScript", color: "text-yellow-400" },
        typescript: { icon: "🔷", name: "TypeScript", color: "text-blue-400" },
        python: { icon: "🐍", name: "Python", color: "text-green-400" },
        java: { icon: "☕", name: "Java", color: "text-orange-400" },
        cpp: { icon: "🔷", name: "C++", color: "text-blue-400" },
        go: { icon: "🔵", name: "Go", color: "text-cyan-400" },
        html: { icon: "🌐", name: "HTML", color: "text-orange-400" },
        css: { icon: "🎨", name: "CSS", color: "text-blue-400" },
        json: { icon: "📄", name: "JSON", color: "text-gray-400" },
        markdown: { icon: "📝", name: "Markdown", color: "text-gray-400" },
        plaintext: { icon: "📄", name: "Plain Text", color: "text-gray-400" }
    };

    const langInfo = languageMap[language] || languageMap.plaintext;

    const handleAction = (actionType: MessageActionType) => {
        onMessageAction?.(actionType, String(message.id), message);
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(code);
            // You might want to show a toast here
            console.log('Code copied to clipboard');
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const handleOpenInTool = () => {
        console.log("🚀 CodeCard - Opening code in Tool2:", { code, language }); // Debug log
        onOpenInTool?.(code, language);
    };

    const handleMouseEnter = () => {
        onHover(String(message.id));
    };

    const handleMouseLeave = () => {
        onHover(null);
    };

    return (
        <div
            data-message-id={message.id}
            className={cn(
                "group relative flex gap-2 px-2 py-1 transition-colors",
                isMe ? "justify-end" : "justify-start"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Avatar */}
            {showSenderInfo && !isMe ? (
                <div className="mr-2 flex-shrink-0">
                    <AvatarUser user={message?.sender} isMe={isMe} size={8} />
                </div>
            ) : !isMe ? (
                <div className="w-10 flex-shrink-0" />
            ) : null}

            {/* Message Content */}
            <div
                className={cn(
                    "flex flex-col gap-1",
                    isMe ? "items-end" : "items-start"
                )}
            >
                {/* Sender Info */}
                {!isMe && showSenderInfo && (
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            {message.sender?.username || "Unknown"}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-500">
                            {new Date(message.created_at).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                )}

                {/* Code Card */}
                <div className={cn(
                    "max-w-[50vw] sm:max-w-[400px] md:max-w-[450px] lg:max-w-[500px] min-w-[280px] sm:min-w-[320px]",
                    "cursor-pointer transition-all duration-200",
                    "relative rounded-lg border shadow-lg overflow-hidden",
                    isMe
                        ? "bg-white dark:bg-gray-950 border-blue-300 dark:border-blue-600/30"
                        : "bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-700/50",
                    isHovered && "shadow-xl border-gray-400 dark:border-gray-600/70"
                )}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700/50">
                        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                            <Code2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400 flex-shrink-0" />
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                <span className="text-[10px] sm:text-[11px] font-medium text-black dark:text-white truncate">
                                    {message.text || `${author} đã chia sẻ code`}
                                </span>
                                <Badge variant="outline" className={cn("text-[8px] sm:text-[9px] border-gray-600 flex-shrink-0 px-0.5 sm:px-1 py-0", langInfo.color)}>
                                    {langInfo.icon} {langInfo.name}
                                </Badge>
                            </div>
                        </div>

                        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 ml-1 sm:ml-2">
                            {/* Toggle preview/full view */}
                            {hasMoreLines && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-gray-400 hover:text-black dark:text-white hover:bg-gray-700/50"
                                    title={isExpanded ? "Thu gọn" : "Xem toàn bộ"}
                                >
                                    {isExpanded ? <EyeOff className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                                </Button>
                            )}

                            {/* Copy code */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyCode}
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-gray-400 hover:text-black dark:text-white hover:bg-gray-700/50"
                                title="Copy toàn bộ code"
                            >
                                <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>

                            {/* Open in Tool2 */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleOpenInTool}
                                className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-gray-400 hover:text-black dark:text-white hover:bg-gray-700/50"
                                title="Chỉnh sửa trong Code Editor"
                            >
                                <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </Button>
                        </div>
                    </div>

                    {/* Code Preview */}
                    <div className="relative">
                        <pre className={cn(
                            "text-[9px] sm:text-[10px] md:text-[11px] text-gray-300 font-mono p-1.5 sm:p-2 bg-gray-950/50",
                            "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800",
                            isExpanded ? "max-h-64 sm:max-h-80 md:max-h-96 overflow-y-auto" : "max-h-24 sm:max-h-28 md:max-h-32 overflow-y-hidden"
                        )}>
                            <code className={`language-${language} whitespace-pre`}>
                                {previewLines.join('\n')}
                            </code>
                        </pre>

                        {/* Gradient overlay when collapsed */}
                        {hasMoreLines && !isExpanded && (
                            <div className="absolute bottom-0 left-0 right-0 h-10 sm:h-12 bg-gradient-to-t from-gray-950/95 to-transparent flex items-end justify-center pb-1.5 sm:pb-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setIsExpanded(true)}
                                    className="h-6 sm:h-7 text-[10px] sm:text-xs bg-gray-800/90 hover:bg-gray-700/90 text-gray-300 border border-gray-600/50"
                                >
                                    +{totalLines - PREVIEW_LINES} dòng nữa
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-800/50 border-t border-gray-700/30">
                        <div className="flex items-center gap-1 sm:gap-2 text-[8px] sm:text-[9px] text-gray-400 min-w-0 flex-1">
                            <span className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                                <Code2 className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                <span className="hidden sm:inline">{totalLines} dòng</span>
                                <span className="sm:hidden">{totalLines}</span>
                            </span>
                            <span className="flex-shrink-0 hidden sm:inline">•</span>
                            <span className="flex-shrink-0 text-[8px] sm:text-[9px]">{new Date(message.created_at || message.send_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                            {author && (
                                <>
                                    <span className="flex-shrink-0 hidden md:inline">•</span>
                                    <span className="truncate hidden md:inline">by {author}</span>
                                </>
                            )}
                        </div>

                        {/* Quick action - Open in Tool2 */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleOpenInTool}
                            className="h-4 sm:h-5 px-1 sm:px-1.5 text-[8px] sm:text-[9px] text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 flex-shrink-0 ml-1 sm:ml-2"
                        >
                            <span className="hidden sm:inline">Chỉnh sửa</span>
                            <ExternalLink className="h-2.5 w-2.5 sm:hidden" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

CodeCardMessage.displayName = "CodeCardMessage";

export default CodeCardMessage;