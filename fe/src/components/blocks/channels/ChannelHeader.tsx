import { Hash } from "lucide-react";
import { Separator } from "../../ui/separator";


interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}
interface ChannelHeaderProps {
    selectedChannel: Channel;
}

export const ChannelHeader = ({ selectedChannel }: ChannelHeaderProps) => {
    return (
        <div className="h-14 border-b border-border bg-card px-6 flex items-center">
            <Hash className="h-5 w-5 text-muted-foreground mr-2" />
            <h2 className="font-semibold text-foreground">{selectedChannel.name}</h2>
            {selectedChannel.description && (
                <>
                    <Separator orientation="vertical" className="mx-3 h-4" />
                    <p className="text-sm text-muted-foreground">{selectedChannel.description}</p>
                </>
            )}
        </div>
    );
};
