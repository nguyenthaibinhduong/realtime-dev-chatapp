import { Hash, Users, Info, Lock, Globe } from "lucide-react";
import { Separator } from "../../ui/separator";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Channel {
    id: string | number;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
    created_at?: string;
    updated_at?: string;
}

interface Member {
    id: string | number;
    username: string;
    email: string;
    isMine?: boolean;
}

interface ChannelHeaderProps {
    channel: Channel;
    members: Member[];
}

const getChannelIcon = (type: string) => {
    if (type === "group")
        return <Globe className="h-5 w-5 text-blue-500 mr-2" />;
    if (type === "private")
        return <Lock className="h-5 w-5 text-red-500 mr-2" />;
    return <Hash className="h-5 w-5 text-muted-foreground mr-2" />;
};

export const ChannelHeader = ({ channel, members }: ChannelHeaderProps) => {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState("members");

    return (
        <div className="h-14 border-b border-border bg-card px-6 flex items-center justify-between">
            <div className="flex items-center">
                {getChannelIcon(channel.type)}
                <h2 className="font-semibold text-foreground">{channel.name}</h2>
                {channel.member_count && (
                    <>
                        <Separator orientation="vertical" className="mx-3 h-4" />
                        <p className="text-sm text-muted-foreground">{channel.member_count} thành viên</p>
                    </>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <button
                            className="p-2 rounded hover:bg-muted transition"
                            title="Xem thành viên"
                            onClick={() => { setTab("members"); setOpen(true); }}
                        >
                            <Users className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </DialogTrigger>
                    <DialogTrigger asChild>
                        <button
                            className="p-2 rounded hover:bg-muted transition"
                            title="Thông tin kênh"
                            onClick={() => { setTab("info"); setOpen(true); }}
                        >
                            <Info className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {tab === "members" ? "Danh sách thành viên" : "Thông tin kênh"}
                            </DialogTitle>
                        </DialogHeader>
                        <Tabs value={tab} onValueChange={setTab} className="mt-2">
                            <TabsList className="mb-4">
                                <TabsTrigger value="members">
                                    <Users className="h-4 w-4 mr-1" /> Thành viên
                                </TabsTrigger>
                                <TabsTrigger value="info">
                                    <Info className="h-4 w-4 mr-1" /> Thông tin
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="members">
                                <ul>
                                    {members.map((m) => (
                                        <li key={m.id} className="flex items-center gap-2 py-2 border-b last:border-none">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{m.username}</span>
                                            <span className="text-xs text-muted-foreground ml-2">{m.email}</span>
                                            {m.isMine && (
                                                <span className="ml-2 px-2 py-0.5 bg-primary text-xs text-white rounded">Bạn</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </TabsContent>
                            <TabsContent value="info">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {getChannelIcon(channel.type)}
                                        <span className="font-semibold">{channel.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Loại kênh:</span>
                                        <span className="text-muted-foreground">
                                            {channel.type === "group" ? "Kênh nhóm" : channel.type === "private" ? "Kênh riêng tư" : "Khác"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold">Tạo lúc:</span>
                                        <span className="text-muted-foreground">
                                            {channel.created_at
                                                ? new Date(channel.created_at).toLocaleString("vi-VN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric"
                                                })
                                                : ""}
                                        </span>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};
