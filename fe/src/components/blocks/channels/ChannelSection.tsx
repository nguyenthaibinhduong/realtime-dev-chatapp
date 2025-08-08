import { Button } from "../../ui/button";
import { Plus } from "lucide-react";
import { ChannelList } from "./ChannelList";
interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}
interface ChannelSectionProps {
    channels: Channel[];
    selectedChannel: Channel | null;
    onSelectChannel: (channel: Channel) => void;
    onShowChannelTypeMenu: () => void;
    showChannelTypeMenu: boolean;
    onCreatePublic: () => void;
    onCreatePrivate: () => void;
}

export const ChannelSection = ({
    channels,
    selectedChannel,
    onSelectChannel,
    onShowChannelTypeMenu,
    showChannelTypeMenu,
    onCreatePublic,
    onCreatePrivate,
}: ChannelSectionProps) => (
    <div className="space-y-1">
        <div className="flex items-center justify-between py-2">
            <h3 className="text-sm font-medium text-sidebar-foreground/70 uppercase tracking-wide">
                Kênh chat
            </h3>
            <div className="relative">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onShowChannelTypeMenu}
                    className="h-6 w-6 p-0 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:text-black"
                >
                    <Plus className="h-4 w-4 " />
                </Button>
                {showChannelTypeMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 text-white rounded shadow z-50 border border-gray-700">
                        <button
                            className="w-full px-4 py-2 text-left hover:bg-gray-800"
                            onClick={onCreatePublic}
                        >
                            Tạo kênh Public
                        </button>
                        <button
                            className="w-full px-4 py-2 text-left hover:bg-gray-800"
                            onClick={onCreatePrivate}
                        >
                            Tạo kênh Private
                        </button>
                    </div>
                )}
            </div>
        </div>
        <ChannelList
            channels={channels}
            selectedChannel={selectedChannel}
            onSelectChannel={onSelectChannel}
        />
    </div>
);