import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}

interface ChannelSearchProps {
    searchChannel: string;
    setSearchChannel: (v: string) => void;
    publicChannels: Channel[];
    joinChannel: (channel: Channel) => void;
}

export function ChannelSearch({
    searchChannel,
    setSearchChannel,
    publicChannels,
    joinChannel,
}: ChannelSearchProps) {
    return (
        <div className="p-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sidebar-foreground/50" />
                <Input
                    value={searchChannel}
                    onChange={e => setSearchChannel(e.target.value)}
                    placeholder="Tìm kiếm kênh public..."
                    className="pl-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground"
                />
            </div>
            {searchChannel.trim() && (
                <div className="mt-2 space-y-2">
                    {publicChannels.length === 0 && (
                        <div className="text-xs text-gray-400 px-2">Không tìm thấy kênh phù hợp.</div>
                    )}
                    {publicChannels.map(channel => (
                        <div key={channel.id} className="flex items-center justify-between px-2 py-1 bg-gray-800 rounded">
                            <span className="text-white">{channel.name}</span>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => joinChannel(channel)}
                            >
                                join
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}