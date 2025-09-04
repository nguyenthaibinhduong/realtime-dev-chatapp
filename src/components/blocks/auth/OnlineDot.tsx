import { usePresenceMap } from "@/hooks/usePresense";

export function OnlineDot({ userId }: { userId: any }) {
    const presenceMap = usePresenceMap();
    const status = presenceMap[userId];

    return (
        <span
            className={"absolute bottom-0 right-0 block w-2.5 h-2.5 rounded-full " + (status?.online ? "bg-green-500" : "bg-red-500") + " border-2 border-background"}
            title={
                status?.online
                    ? "Online"
                    : status?.lastSeen
                        ? `Last seen: ${new Date(status.lastSeen).toLocaleString()}`
                        : "Offline"
            }
        />
    );
}
