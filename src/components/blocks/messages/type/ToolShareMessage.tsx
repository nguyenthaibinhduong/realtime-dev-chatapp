import { Code2, Clock, Database, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import AvatarUser from "@/components/common/AvartarUser";
import {
    METHOD_COLORS,
    getStatusColorClasses,
    COLORS,
    TYPOGRAPHY,
    SPACING,
    BORDERS,
    SHADOWS,
    TRANSITIONS,
    LAYOUT
} from "./messageStyles";

type ToolShareData = {
    method?: string;
    url?: string;
    response?: { status?: number; time?: string; size?: string };
    json_data?: unknown; // string | object
    [k: string]: any;
};

type Props = {
    item: ToolShareData;
    onOpenTool?: (data: any) => void;
    isMe?: boolean;
    showSenderInfo?: boolean;
    hoveredId?: string | null;
    onHover?: (id: string | null) => void;
};

const safeParse = (val: unknown) => {
    if (val == null) return { ok: false as const };
    if (typeof val === "string") {
        try {
            return { ok: true as const, data: JSON.parse(val) };
        } catch {
            return { ok: false as const };
        }
    }
    if (typeof val === "object") return { ok: true as const, data: val };
    return { ok: false as const };
};

export default function ToolShareMessage({ item, onOpenTool, isMe = false, showSenderInfo = true, hoveredId = null, onHover }: Props) {
    const { ok, data } = safeParse(item.json_data);
    const { user } = useAuth();

    const computedIsMe = useMemo(() => {
        return isMe || user?.id === item.userId;
    }, [isMe, user, item]);

    const handleOpen = () => {
        if (!ok) return;
        // eslint-disable-next-line no-console
        console.log("json_data", data);
        if (onOpenTool) onOpenTool(data);
    };

    const method = (item.method || "GET").toUpperCase();
    const url = data.url || "—";
    const status = data.onOpenTool?.status;
    const time = data.response?.time || "—";
    const size = data.response?.size || "—";
    const responseData = data.response?.data || "—";

    return (
        <div
            className={cn(
                "group relative flex gap-2 px-2 py-1 transition-colors",
                computedIsMe ? "justify-end" : "justify-start"
            )}
        >
            {/* Avatar */}
            {showSenderInfo && !computedIsMe ? (
                <div className="mr-2 flex-shrink-0">
                    <AvatarUser user={item?.sender} isMe={isMe} size={8} />
                </div>
            ) : !computedIsMe ? (
                <div className="w-10 flex-shrink-0" />
            ) : null}

            {/* Message Content */}
            <div
                className={cn(
                    "flex flex-col gap-1",
                    computedIsMe ? "items-end" : "items-start"
                )}
            >
                {/* Sender Info */}
                {!computedIsMe && showSenderInfo && (
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-xs font-semibold text-gray-300">
                            {item?.sender?.username || "Unknown"}
                        </span>
                        <span className="text-[10px] text-gray-500">
                            {new Date(item.send_at || item.created_at).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                            })}
                        </span>
                    </div>
                )}

                {/* Card */}
                <Card
                    className={cn(
                        "cursor-pointer group",
                        "max-w-[50vw] sm:max-w-[400px] md:max-w-[450px] lg:max-w-[500px]",
                        "min-w-[280px] sm:min-w-[320px]",
                        COLORS.bg.card,
                        COLORS.border.card,
                        "border",
                        "hover:border-gray-700",
                        TRANSITIONS.normal
                    )}
                    onClick={handleOpen}
                >
                    <div className={cn("p-1.5 sm:p-2 space-y-1.5 sm:space-y-2")}>
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                                <Code2 className="w-3 h-3 sm:w-4 sm:h-4 text-sky-400 flex-shrink-0" />
                                <span className={cn(
                                    "text-[9px] sm:text-[10px]",
                                    TYPOGRAPHY.weight.medium,
                                    COLORS.text.secondary
                                )}>
                                    API Request được chia sẻ
                                </span>
                            </div>
                            <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 group-hover:text-sky-400 transition-colors flex-shrink-0" />
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <Badge className={cn(
                                METHOD_COLORS[method as keyof typeof METHOD_COLORS] ?? "bg-gray-700 text-gray-300",
                                "text-[8px] sm:text-[9px]",
                                TYPOGRAPHY.weight.bold,
                                "px-1.5 sm:px-2 py-0.5"
                            )}>
                                {method}
                            </Badge>
                            <code className={cn(
                                "text-[8px] sm:text-[9px]",
                                COLORS.text.secondary,
                                "bg-gray-950 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-gray-800 flex-1 truncate min-w-0"
                            )}>
                                {url}
                            </code>
                        </div>

                        <div className={cn("flex items-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] flex-wrap")}>
                            {status !== undefined && (
                                <Badge className={cn(
                                    getStatusColorClasses(status),
                                    "text-[8px] sm:text-[9px]",
                                    "px-1.5 sm:px-2 py-0.5"
                                )}>
                                    {status}
                                </Badge>
                            )}
                            <div className={cn("flex items-center gap-0.5 sm:gap-1", COLORS.text.muted)}>
                                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>{time}</span>
                            </div>
                            <div className={cn("flex items-center gap-0.5 sm:gap-1", COLORS.text.muted)}>
                                <Database className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>{size}</span>
                            </div>
                        </div>

                        {/* Chỉ hiển thị preview data khi parse JSON thành công */}
                        {ok && (
                            <pre className={cn(
                                "text-[8px] sm:text-[9px]",
                                COLORS.text.secondary,
                                "bg-gray-950 px-1.5 sm:px-2 py-1 rounded border border-gray-800 max-h-20 sm:max-h-24 md:max-h-28 overflow-auto"
                            )}>
                                {JSON.stringify(responseData, null, 2)}
                            </pre>
                        )}

                        <p className={cn(
                            "pt-1 border-t border-gray-800",
                            "text-[8px] sm:text-[9px]",
                            COLORS.text.mutedDark,
                            "group-hover:text-gray-400 transition-colors"
                        )}>
                            <span className="hidden sm:inline">Click để mở và xem chi tiết request này trong API Tool</span>
                            <span className="sm:hidden">Click để mở trong API Tool</span>
                            {!ok && <span className="hidden md:inline"> (chưa hiển thị data vì parse JSON không thành công)</span>}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
