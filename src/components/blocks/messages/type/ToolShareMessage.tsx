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
        <div className={cn(
            "flex my-3",
            computedIsMe ? "justify-end" : "justify-start"
        )}>
            {/* Avatar */}
            {!computedIsMe && showSenderInfo ? (
                <div className="mr-2 flex flex-col items-center justify-center">
                    <AvatarUser user={item?.sender} isMe={isMe} size={8} />
                </div>
            ) : !computedIsMe ? (
                <div className="w-10 flex-shrink-0" />
            ) : null}

            <Card
                className={cn(
                    "cursor-pointer group max-w-md",
                    COLORS.bg.card,
                    COLORS.border.card,
                    "border",
                    "hover:border-gray-700",
                    TRANSITIONS.normal,
                    computedIsMe && "ml-8"
                )}
                onClick={handleOpen}
            >
                <div className={cn("p-2 space-y-2")}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Code2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                            <span className={cn(
                                TYPOGRAPHY.size.xs,
                                TYPOGRAPHY.weight.medium,
                                COLORS.text.secondary
                            )}>
                                API Request được chia sẻ
                            </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-500 group-hover:text-sky-400 transition-colors flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={cn(
                            METHOD_COLORS[method as keyof typeof METHOD_COLORS] ?? "bg-gray-700 text-gray-300",
                            TYPOGRAPHY.size.xs,
                            TYPOGRAPHY.weight.bold,
                            "px-2 py-0.5"
                        )}>
                            {method}
                        </Badge>
                        <code className={cn(
                            TYPOGRAPHY.size.xs,
                            COLORS.text.secondary,
                            "bg-gray-950 px-2 py-1 rounded border border-gray-800 flex-1 truncate min-w-0"
                        )}>
                            {url}
                        </code>
                    </div>

                    <div className={cn("flex items-center gap-3", TYPOGRAPHY.size.xs)}>
                        {status !== undefined && (
                            <Badge className={cn(
                                getStatusColorClasses(status),
                                TYPOGRAPHY.size.xs,
                                "px-2 py-0.5"
                            )}>
                                {status}
                            </Badge>
                        )}
                        <div className={cn("flex items-center gap-1", COLORS.text.muted)}>
                            <Clock className="w-3 h-3" />
                            <span>{time}</span>
                        </div>
                        <div className={cn("flex items-center gap-1", COLORS.text.muted)}>
                            <Database className="w-3 h-3" />
                            <span>{size}</span>
                        </div>
                    </div>

                    {/* Chỉ hiển thị preview data khi parse JSON thành công */}
                    {ok && (
                        <pre className={cn(
                            TYPOGRAPHY.size.xs,
                            COLORS.text.secondary,
                            "bg-gray-950 px-2 py-1 rounded border border-gray-800 max-h-28 overflow-auto"
                        )}>
                            {JSON.stringify(responseData, null, 2)}
                        </pre>
                    )}

                    <p className={cn(
                        "pt-1 border-t border-gray-800",
                        TYPOGRAPHY.size.xs,
                        COLORS.text.mutedDark,
                        "group-hover:text-gray-400 transition-colors"
                    )}>
                        Click để mở và xem chi tiết request này trong API Tool
                        {!ok && " (chưa hiển thị data vì parse JSON không thành công)"}
                    </p>
                </div>
            </Card>
        </div>
    );
}
