import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface KeyPair {
  id: string;
  keyItem: string;
  valueItem: string;
  enabled?: boolean;
}

interface KeyValueEditorProps {
  keyPair: KeyPair;
  setKeyPair: (keyPair: KeyPair) => void;
  onKeyPairRemove: () => void;
}

export default function KeyValueEditor({
  keyPair,
  setKeyPair,
  onKeyPairRemove,
}: KeyValueEditorProps) {
  const [keyValue, setKeyValue] = useState(keyPair);
  const [debouncedKeyValue, setDebouncedKeyValue] = useState(keyValue);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedKeyValue(keyValue);
    }, 500);
    return () => {
      clearTimeout(timerId);
    };
  }, [keyValue]);

  useEffect(() => {
    setKeyPair(debouncedKeyValue);
  }, [debouncedKeyValue, setKeyPair]);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyValue((prevState) => ({
      ...prevState,
      id: keyValue.id,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEnabledChange = (checked: boolean) => {
    setKeyValue((prevState) => ({
      ...prevState,
      enabled: checked,
    }));
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-800 rounded-lg mb-2">
      <Checkbox
        checked={keyValue.enabled !== false}
        onCheckedChange={handleEnabledChange}
        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
      />
      <Input
        placeholder="Key"
        name="keyItem"
        defaultValue={keyPair.keyItem}
        onChange={handleOnChange}
        className="flex-1 bg-zinc-700 border-zinc-600 text-white text-sm"
      />
      <Input
        placeholder="Value"
        name="valueItem"
        defaultValue={keyPair.valueItem}
        onChange={handleOnChange}
        className="flex-1 bg-zinc-700 border-zinc-600 text-white text-sm"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onKeyPairRemove}
        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
