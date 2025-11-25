import React from "react";
import { v4 as uuidv4 } from "uuid";
import KeyValueEditor from "./KeyValueEditor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KeyPair {
  id: string;
  keyItem: string;
  valueItem: string;
  enabled?: boolean;
}

interface KeyValuePaneProps {
  paneValue: KeyPair[];
  setPaneValue: React.Dispatch<React.SetStateAction<KeyPair[]>>;
}

export default function KeyValuePane({
  paneValue,
  setPaneValue,
}: KeyValuePaneProps) {
  const onKeyPairAdd = () => {
    setPaneValue((prevValue) => [
      ...prevValue,
      {
        id: uuidv4(),
        keyItem: "",
        valueItem: "",
        enabled: true,
      },
    ]);
  };

  const onKeyPairRemove = (keyPair: KeyPair) => {
    setPaneValue((prevValue) => prevValue.filter((x) => x.id !== keyPair.id));
  };

  const onKeyPairUpdate = (keyPair: KeyPair) => {
    const elementIndex = paneValue.findIndex(
      (element) => element.id === keyPair.id
    );
    if (elementIndex === -1) return;

    const newKeyValues = [...paneValue];
    newKeyValues[elementIndex] = {
      ...newKeyValues[elementIndex],
      keyItem: keyPair.keyItem,
      valueItem: keyPair.valueItem,
      enabled: keyPair.enabled,
    };
    setPaneValue(newKeyValues);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-zinc-400">
          {paneValue.filter((kv) => kv.enabled !== false).length} enabled
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onKeyPairAdd}
          className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800 hover:text-black dark:text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Thêm tham số
        </Button>
      </div>

      <ScrollArea className="max-h-[400px]">
        <div className="space-y-1 pr-4">
          {paneValue.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <p className="text-sm">Chưa có tham số nào</p>
              <p className="text-xs mt-1">
                Click "Thêm tham số" để bắt đầu thêm tham số mới
              </p>
            </div>
          ) : (
            paneValue.map((keyPair) => (
              <KeyValueEditor
                key={keyPair.id}
                keyPair={keyPair}
                setKeyPair={onKeyPairUpdate}
                onKeyPairRemove={() => onKeyPairRemove(keyPair)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
