import { useState } from "react";
import { Send, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SimpleCodeEditor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/themes/prism.css";

interface Channel {
    id: string;
    name: string;
    description?: string;
    type: string;
    member_count?: number;
}
interface MessageInputProps {
    newMessage: string;
    setNewMessage: (value: string) => void;
    sendMessage: () => void;
    selectedChannel: Channel;
}

export const MessageInput = ({
    newMessage,
    setNewMessage,
    sendMessage,
    selectedChannel,
}: MessageInputProps) => {
    const [showCode, setShowCode] = useState(false);
    const [code, setCode] = useState("");

    const handleSend = () => {
        if (showCode) {
            setNewMessage("```" + code + "```");
            setShowCode(false);
            setCode("");
        }
        sendMessage();
    };

    return (
        <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-2">
                <Button
                    variant={showCode ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setShowCode((v) => !v)}
                    className={`flex-shrink-0 ${showCode ? "bg-white text-black" : "text-white"}`}
                    title="Soạn thảo code"
                >
                    <Code className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                    {showCode ? (
                        <SimpleCodeEditor
                            value={code}
                            onValueChange={setCode}
                            highlight={code => highlight(code, languages.js, "javascript")}
                            padding={10}
                            style={{
                                fontFamily: '"Fira code", "Fira Mono", monospace',
                                fontSize: 14,
                                background: "#222",
                                color: "#fff",
                                borderRadius: "8px",
                                minHeight: 48,
                            }}
                            placeholder="Nhập code..."
                        />
                    ) : (
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={`Nhắn tin đến #${selectedChannel.name}...`}
                            className="pr-10 bg-[hsl(var(--chat-input))] border-border text-white"
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        />
                    )}
                </div>
                <Button onClick={handleSend} size="icon" className="flex-shrink-0">
                    <Send className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                Sử dụng <kbd className="px-1 py-0.5 text-xs bg-muted rounded">```</kbd> để chia sẻ code,{" "}
                <kbd className="px-1 py-0.5 text-xs bg-muted rounded">/create</kbd> để tạo kênh mới
            </p>
        </div>
    );
};