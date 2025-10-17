import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const requestMethods = [
  {
    slug: "get",
    method: "GET",
    color: "bg-green-600",
  },
  {
    slug: "post",
    method: "POST",
    color: "bg-blue-600",
  },
  {
    slug: "put",
    method: "PUT",
    color: "bg-yellow-600",
  },
  {
    slug: "patch",
    method: "PATCH",
    color: "bg-purple-600",
  },
  {
    slug: "delete",
    method: "DELETE",
    color: "bg-red-600",
  },
];

interface UrlEditorProps {
  url: string;
  setUrl: (url: string) => void;
  reqMethod: string;
  setReqMethod: (method: string) => void;
  onInputSend: (e: React.FormEvent) => void;
  loading?: boolean;
}

export default function UrlEditor({
  url,
  setUrl,
  reqMethod,
  setReqMethod,
  onInputSend,
  loading = false,
}: UrlEditorProps) {
  const currentMethod = requestMethods.find((m) => m.method === reqMethod);

  return (
    <form className="grid grid-cols-1 gap-y-2" onSubmit={onInputSend}>


      <div className="flex gap-2">
        <div >
          <Select value={reqMethod} onValueChange={setReqMethod}>
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 ">
              {requestMethods.map((option) => (
                <SelectItem
                  key={option.slug}
                  value={option.method}
                  className="text-white hover:bg-zinc-700"
                >
                  <Badge className={cn("font-mono", option.color)}>
                    {option.method}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>


        <Input
          placeholder="https://api.example.com/endpoint"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 w-2/3 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !loading) {
              onInputSend(e);
            }
          }}
        />
      </div>
      <Button
        type="button"
        onClick={onInputSend}
        // guard against url being undefined/null
        disabled={loading || !(typeof url === "string" && url.trim().length > 0)}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send
          </>
        )}
      </Button>


    </form>

  );
}
