import { AuthAPI } from "@/api/api";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface PresenceUpdate {
  online: string[];
  offline: { userId: string; lastSeen: number }[];
}

type PresenceMap = Record<string, { online: boolean; lastSeen?: number }>;

interface PresenceContextValue {
  presenceMap: PresenceMap;
}

const PresenceContext = createContext<PresenceContextValue>({
  presenceMap: {},
});

export function PresenceProvider({
  children,
  onPresenceUpdate,
  offPresenceUpdate,
}: {
  children: ReactNode;
  onPresenceUpdate: (cb: (data: PresenceUpdate) => void) => void;
  offPresenceUpdate: (cb?: (data: PresenceUpdate) => void) => void;
}) {
  const [presenceMap, setPresenceMap] = useState<PresenceMap>({});
  const [initialized, setInitialized] = useState(false);

  // Lấy snapshot online ngay sau khi login
  useEffect(() => {
    async function initPresence() {
      const res = await AuthAPI.listOnline();
      if (res.data) {
        const onlineUsers: string[] = res.data;
        setPresenceMap(
          Object.fromEntries(onlineUsers.map((uid) => [uid, { online: true }]))
        );
      }
      setInitialized(true); // Đánh dấu đã khởi tạo xong
    }
    initPresence();
  }, []);

  // Chỉ lắng nghe socket sau khi đã khởi tạo danh sách online
  useEffect(() => {
    if (!initialized) return;
    const handlePresenceUpdate = (data: PresenceUpdate) => {
      setPresenceMap((prev) => {
        const updated: PresenceMap = { ...prev };
        for (const uid of data.online) {
          updated[uid] = {
            online: true,
            lastSeen: prev[uid]?.lastSeen,
          };
        }
        for (const off of data.offline) {
          updated[off.userId] = {
            online: false,
            lastSeen: off.lastSeen,
          };
        }
        return updated;
      });
    };
    onPresenceUpdate(handlePresenceUpdate);
    return () => offPresenceUpdate(handlePresenceUpdate);
  }, [initialized, onPresenceUpdate, offPresenceUpdate]);

  return (
    <PresenceContext.Provider value={{ presenceMap }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresenceMap() {
  return useContext(PresenceContext).presenceMap;
}
