import { useState, useRef, useEffect } from "react";
import "@/monaco-worker";
import MonacoEditor from "@monaco-editor/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, Send, Play, Settings, Terminal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Lang = "javascript" | "typescript" | "json" | "markdown" | "html" | "css" | "python" | "cpp" | "java" | "go" | "plaintext";

interface Tool2Props {
    onSendCode?: (code: string, language: string) => void;
    onClose?: () => void;
    initialCode?: string; // <-- Thêm lại props
    initialLanguage?: string; // <-- Thêm lại props
}

export const Tool2 = ({ onSendCode, onClose, initialCode, initialLanguage }: Tool2Props) => {
    const [code, setCode] = useState("");
    const [lang, setLang] = useState<Lang>("javascript");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const canSend = code.trim().length > 0;

    const languageMap = {
        javascript: {
            icon: "🟨",
            name: "JavaScript",
            sample: `console.log("Hello World!");`
        },
        typescript: {
            icon: "🔷",
            name: "TypeScript",
            sample: `const message: string = "Hello World!";\nconsole.log(message);`
        },
        python: {
            icon: "🐍",
            name: "Python",
            sample: `print("Hello World!")`
        },
        cpp: {
            icon: "🔷",
            name: "C++",
            sample: `#include <iostream>\nusing namespace std;\nint main(){\n    cout << "Hello World!";\n    return 0;\n}`
        },
        java: {
            icon: "☕",
            name: "Java",
            sample: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World!");\n    }\n}`
        },
        go: {
            icon: "🔵",
            name: "Go",
            sample: `package main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello World!")\n}`
        },
        json: {
            icon: "📄",
            name: "JSON",
            sample: `{\n  "message": "Hello World!",\n  "status": "success"\n}`
        },
        html: {
            icon: "🌐",
            name: "HTML",
            sample: `<!DOCTYPE html>\n<html>\n<head>\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>`
        },
        css: {
            icon: "🎨",
            name: "CSS",
            sample: `body {\n    font-family: Arial, sans-serif;\n    background-color: #f0f0f0;\n}\n\nh1 {\n    color: #333;\n    text-align: center;\n}`
        },
        markdown: {
            icon: "📝",
            name: "Markdown",
            sample: `# Hello World\n\nThis is a **bold** text and this is *italic*.\n\n- Item 1\n- Item 2\n- Item 3`
        },
        plaintext: {
            icon: "📄",
            name: "Plain Text",
            sample: `Hello World!\nThis is plain text.`
        }
    };

    // Load initial values when props change - FIX: Thêm lại useEffect
    useEffect(() => {
        if (initialCode !== undefined && initialCode.trim()) {
            console.log("🔄 Loading initial code:", initialCode);
            setCode(initialCode);
        }
        if (initialLanguage && languageMap[initialLanguage as Lang]) {
            console.log("🔄 Loading initial language:", initialLanguage);
            setLang(initialLanguage as Lang);
        }
    }, [initialCode, initialLanguage]);

    const handleLanguageChange = (newLang: Lang) => {
        setLang(newLang);
        // Chỉ set sample code khi không có initialCode
        if (!initialCode?.trim()) {
            setCode(languageMap[newLang].sample);
        }
        setOutput("");
    };

    const handleSend = async () => {
        if (!canSend || isSending) return;

        try {
            setIsSending(true);
            await onSendCode?.(code.trim(), lang);

            // Clear code after successful send
            setCode("");
            setOutput("");
        } catch (err) {
            console.error("Send code failed:", err);
        } finally {
            setIsSending(false);
        }
    };

    const runCode = async () => {
        setIsRunning(true);
        setOutput("🔄 Executing code...");

        // Simulate code execution for demo
        setTimeout(() => {
            if (lang === "javascript") {
                try {
                    // Simple evaluation for JavaScript (unsafe in production)
                    const result = eval(code);
                    setOutput(result?.toString() || "✅ Code executed successfully");
                } catch (err: any) {
                    setOutput(`❌ Error: ${err.message}`);
                }
            } else {
                setOutput(`✅ ${languageMap[lang].name} code executed successfully!\n\nNote: Full execution requires backend integration.`);
            }
            setIsRunning(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            {/* Header with close button */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42]">
                <div className="flex items-center space-x-2">
                    <Code2 className="h-5 w-5 text-[#007acc]" />
                    <span className="text-black dark:text-white font-medium">Code Editor Message</span>
                    {initialCode && (
                        <Badge className="bg-green-600 text-black dark:text-white text-xs">
                            Loaded from card
                        </Badge>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#3e3e42] transition-colors"
                    title="Đóng code editor"
                >
                    <X className="h-4 w-4 text-gray-400 hover:text-black dark:text-white" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="w-full flex flex-col gap-y-2 px-4 py-3 bg-[#2d2d30] border-b border-[#3e3e42]">
                <div className="flex justify-between items-center space-x-4">
                    {/* Language selector */}
                    <div className="flex items-center space-x-2">
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-300 text-sm">Language:</span>
                        <div className="relative">
                            <select
                                value={lang}
                                onChange={(e) => handleLanguageChange(e.target.value as Lang)}
                                className="appearance-none bg-[#3c3c3c] text-black dark:text-white px-3 py-1.5 pr-8 rounded-md border border-[#5a5a5a] text-sm focus:outline-none focus:ring-2 focus:ring-[#007acc] focus:border-transparent"
                            >
                                {Object.entries(languageMap).map(([key, lang]) => (
                                    <option key={key} value={key} className="bg-[#3c3c3c]">
                                        {lang.icon} {lang.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <svg
                                    className="w-4 h-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Stats badge */}
                    <Badge variant="outline" className="text-xs text-gray-400 border-[#5a5a5a] bg-[#3c3c3c]">
                        Lines: {code.split('\n').length}
                    </Badge>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2">
                    <button
                        onClick={runCode}
                        disabled={isRunning || !canSend}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#555] text-black dark:text-white rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                        <Play className={`h-4 w-4 ${isRunning ? "animate-spin" : ""}`} />
                        <span>{isRunning ? "Running..." : "Test"}</span>
                    </button>

                    <button
                        onClick={handleSend}
                        disabled={isSending || !canSend}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-[#28a745] hover:bg-[#218838] disabled:bg-[#555] text-black dark:text-white rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                        <Send className={`h-4 w-4 ${isSending ? "animate-spin" : ""}`} />
                        <span>{isSending ? "Sending..." : "Send Code"}</span>
                    </button>
                </div>
            </div>

            {/* Editor - styled like MonacoEditorLayout */}
            <div className="flex-1 border-b border-[#3e3e42]">
                <MonacoEditor
                    height="100%"
                    theme="vs-dark"
                    language={
                        lang === "cpp" ? "cpp" :
                            lang === "python" ? "python" :
                                lang === "plaintext" ? "plaintext" :
                                    lang
                    }
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    options={{
                        fontSize: 14,
                        lineHeight: 20,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: "on",
                        lineNumbers: "on",
                        renderLineHighlight: "all",
                        selectOnLineNumbers: true,
                        fontLigatures: true,
                        cursorBlinking: "blink",
                        cursorSmoothCaretAnimation: "on",
                        smoothScrolling: true,
                        contextmenu: true,
                        mouseWheelZoom: true,
                        padding: { top: 16, bottom: 16 },
                    }}
                />
            </div>

            {/* Output panel - styled like MonacoEditorLayout */}
            <div className="h-48 bg-[#1e1e1e] border-t border-[#3e3e42] flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d30] border-b border-[#3e3e42]">
                    <div className="flex items-center space-x-2">
                        <Terminal className="h-4 w-4 text-[#007acc]" />
                        <span className="text-black dark:text-white text-sm font-medium">Output</span>
                    </div>
                    <div className="text-xs text-gray-400">
                        {languageMap[lang].icon} {languageMap[lang].name}
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                        {output || "Click 'Test' to run code or 'Send Code' to share..."}
                    </pre>
                </div>
            </div>
        </div>
    );
};