import { Code2, Clock, Database, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useMemo } from "react";

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

const methodColor: Record<string, string> = {
    GET: "bg-sky-600 text-white",
    POST: "bg-green-600 text-white",
    PUT: "bg-amber-600 text-white",
    PATCH: "bg-purple-600 text-white",
    DELETE: "bg-red-600 text-white",
};

const statusColor = (s?: number) =>
    !s
        ? "bg-zinc-700 text-zinc-300"
        : s < 300
            ? "bg-emerald-600 text-white"
            : s < 400
                ? "bg-blue-600 text-white"
                : s < 500
                    ? "bg-amber-600 text-white"
                    : "bg-red-600 text-white";

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
        <div className={`flex my-3 ${computedIsMe ? "justify-end" : "justify-start"}`}>
            {/* Avatar */}
            {!computedIsMe && showSenderInfo ? (
                <div className="mr-3 flex flex-col items-center justify-center relative">
                    {/* small avatar component used in other messages */}
                    {/* AvatarUser is used elsewhere; import above exists in other message types */}
                    {/* We render a simple avatar fallback here to avoid extra imports */}
                    <div
                        onMouseEnter={() => onHover?.(String(item.id || item._id || ''))}
                        onMouseLeave={() => onHover?.(null)}
                        className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-300"
                    >
                        {item?.userName?.[0] || item?.sender?.username?.[0] || "?"}
                    </div>
                    {hoveredId === String(item.id || item._id || '') && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-10 px-2 py-1 bg-black text-white text-xs rounded shadow z-10 whitespace-nowrap">
                            {item?.sender?.username || item?.userName}
                        </div>
                    )}
                </div>
            ) : !computedIsMe ? (
                <div className="w-9 flex-shrink-0" />
            ) : null}

            <Card
                className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group max-w-md ${computedIsMe ? 'ml-10' : ''}`}
                onClick={handleOpen}
            >
                <div className="p-3 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Code2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-zinc-300">
                                API Request được chia sẻ
                            </span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 transition-colors flex-shrink-0" />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${methodColor[method] ?? "bg-zinc-700 text-zinc-300"} text-xs font-bold px-2 py-0.5`}>
                            {method}
                        </Badge>
                        <code className="text-xs text-zinc-300 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 flex-1 truncate min-w-0">
                            {url}
                        </code>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                        {status !== undefined && (
                            <Badge className={`${statusColor(status)} text-xs px-2 py-0.5`}>{status}</Badge>
                        )}
                        <div className="flex items-center gap-1 text-zinc-400">
                            <Clock className="w-3 h-3" />
                            <span>{time}</span>
                        </div>
                        <div className="flex items-center gap-1 text-zinc-400">
                            <Database className="w-3 h-3" />
                            <span>{size}</span>
                        </div>
                    </div>

                    {/* Chỉ hiển thị preview data khi parse JSON thành công */}
                    {ok && (
                        <pre className="text-[10px] text-zinc-300 bg-zinc-950 px-2 py-1 rounded border border-zinc-800 max-h-28 overflow-auto">
                            {JSON.stringify(responseData, null, 2)}
                        </pre>
                    )}

                    <p className="pt-1 border-t border-zinc-800 text-[10px] text-zinc-500 group-hover:text-zinc-400">
                        Click để mở và xem chi tiết request này trong API Tool
                        {!ok && " (chưa hiển thị data vì parse JSON không thành công)"}
                    </p>
                </div>
            </Card>
        </div>
    );
}
