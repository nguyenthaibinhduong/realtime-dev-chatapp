import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ChannelDialogProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    type: "public" | "private";
    channelName: string;
    setChannelName: (v: string) => void;
    memberIds?: string;
    setMemberIds?: (v: string) => void;
    onCreate: () => void;
}

export function ChannelDialog({
    open,
    onOpenChange,
    type,
    channelName,
    setChannelName,
    memberIds,
    setMemberIds,
    onCreate,
}: ChannelDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-gray-900 text-white border border-gray-700">
                <DialogHeader>
                    <DialogTitle>
                        {type === "public" ? "Tạo kênh Public" : "Tạo kênh Private"}
                    </DialogTitle>
                </DialogHeader>
                <Input
                    value={channelName}
                    onChange={e => setChannelName(e.target.value)}
                    placeholder={`Tên kênh ${type}`}
                    className="mb-2 bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                />
                {type === "private" && setMemberIds && (
                    <Input
                        value={memberIds}
                        onChange={e => setMemberIds(e.target.value)}
                        placeholder="Nhập các user_id, phân cách bằng dấu phẩy"
                        className="mb-2 bg-gray-800 text-white border-gray-700 placeholder:text-gray-400"
                    />
                )}
                <DialogFooter>
                    <Button size="sm" onClick={onCreate}>
                        {type === "public" ? "Tạo" : "OK"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>
                        Hủy
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}