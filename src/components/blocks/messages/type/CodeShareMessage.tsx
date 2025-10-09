import { memo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Code } from "lucide-react";

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



    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

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
        <div className={`flex my-4 ${isMe ? "justify-end" : "justify-start"}`}>
            {/* Avatar người gửi */}
            {!isMe && showSenderInfo && (
                <div className="mr-3 flex flex-col items-center justify-center">
                    <Avatar
                        className="h-8 w-8 flex-shrink-0 cursor-pointer"
                        onMouseEnter={() => onHover(message.id)}
                        onMouseLeave={() => onHover(null)}
                    >
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                            {message?.sender?.username?.[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>
                    {hoveredId === message.id && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-10 px-2 py-1 bg-black text-white text-xs rounded shadow z-10 whitespace-nowrap">
                            {message?.sender?.username}
                        </div>
                    )}
                </div>
            )}

            <div
                onClick={handleClick}
                className={`flex flex-col hover:cursor-pointer items-stretch w-full max-w-xl ${!isMe && showSenderInfo ? "" : "ml-10"}`}
            >
                {/* Tiêu đề repo */}
                <div className="rounded-t-xl bg-blue-600 px-6 py-2 text-white font-semibold text-sm flex items-center gap-2">
                    <Code className="h-4 w-4 text-white" />
                    <span>{repo?.full_name}</span>
                    <span className="ml-auto font-mono text-blue-300">
                        {codePath?.split("/").pop()}
                    </span>
                </div>

                {/* Nội dung */}
                <div className="bg-zinc-900 border border-zinc-700 rounded-b-xl px-6 py-4 flex flex-col items-center shadow-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-blue-400">Chia sẻ code</span>
                        <span className="text-xs text-zinc-400 ml-2">
                            {formatTime(message.send_at || message.created_at)}
                        </span>
                    </div>

                    <div className="text-sm text-white mb-2 text-center">
                        <span className="font-semibold">{message?.sender?.username}</span>
                        <span className="mx-1">đã chia sẻ file</span>
                        <span className="font-mono text-blue-300">{codePath?.split("/").pop()}</span>
                        <span className="mx-1">từ repo</span>
                        <span className="font-mono text-emerald-400">{repo?.full_name}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                        <Button
                            size="sm"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={handleClick}
                        >
                            <Code className="h-4 w-4 mr-1" /> Xem code
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
});

CodeShareMessage.displayName = "CodeShareMessage";

export default CodeShareMessage;