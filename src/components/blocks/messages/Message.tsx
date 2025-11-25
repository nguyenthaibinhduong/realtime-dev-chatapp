import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // Có thể đổi style khác như 'atom-one-dark', 'monokai-sublime'

import { useEffect, useRef, useState } from 'react';

interface AutoCodeBlockProps {
    code: string;
    language?: string;
}

// ✅ Component hiển thị code block với highlight + copy + tên ngôn ngữ
const AutoCodeBlock = ({ code, language = 'plaintext' }: AutoCodeBlockProps) => {
    const codeRef = useRef<HTMLElement>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (codeRef.current) {
            if (language && hljs.getLanguage(language)) {
                const result = hljs.highlight(code, { language });
                codeRef.current.innerHTML = result.value;
            } else {
                const result = hljs.highlightAuto(code);
                codeRef.current.innerHTML = result.value;
            }
        }
    }, [code, language]);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1000);
    };

    return (
        <div className="relative my-4 border border-gray-700 rounded-lg bg-[#1e1e1e] overflow-hidden ">
            <div className="flex items-center justify-between px-2 py-2 text-xs bg-[#2d2d2d] text-gray-300 font-mono ">
                <span className="capitalize">{language}</span>
                <button
                    onClick={handleCopy}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-black dark:text-white px-2 py-1 rounded"
                >
                    {copied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <pre className="m-0 p-4 overflow-auto text-sm">
                <code ref={codeRef} className="hljs" />
            </pre>
        </div>
    );
};

// ✅ Hàm tách language + code từ ```markdown``` block
const parseCodeBlock = (raw: string) => {
    const lines = raw.trim().split('\n');
    const firstLine = lines[0].trim();
    const hasLang = /^[a-zA-Z0-9]+$/.test(firstLine);
    const language = hasLang ? firstLine : 'plaintext';
    const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');
    return { language, code };
};

interface MessageRendererProps {
    text: string;
}

// ✅ Component chính: xử lý cả đoạn văn bản thường và code block
export const Message = ({ text }: MessageRendererProps) => {
    if (text.includes('```')) {
        const parts = text.split('```');

        return (
            <div className="space-y-2">
                {parts.map((part, index) => {
                    if (index % 2 === 1) {
                        const { language, code } = parseCodeBlock(part);
                        return <AutoCodeBlock key={index} code={code} language={language} />;
                    }
                    return (
                        <p key={index} className="whitespace-pre-wrap text-black dark:text-white">
                            {part}
                        </p>
                    );
                })}
            </div>
        );
    }

    return <p className="whitespace-pre-wrap text-black dark:text-white">{text}</p>;
};
