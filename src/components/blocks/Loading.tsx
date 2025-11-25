import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";

const Loading = () => {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("Đang kết nối...");

    useEffect(() => {
        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) return 95; // Stop at 95% until actual load completes
                return prev + Math.random() * 15;
            });
        }, 300);

        // Loading text rotation
        const textInterval = setInterval(() => {
            const texts = [
                "Đang kết nối...",
                "Đang tải tin nhắn...",
                "Đang đồng bộ...",
                "Sắp xong rồi..."
            ];
            setLoadingText(texts[Math.floor(Math.random() * texts.length)]);
        }, 2000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(textInterval);
        };
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-950 dark:via-black dark:to-gray-900 relative overflow-hidden">
            {/* Animated background circles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-8 px-6">
                {/* Logo with pulse animation */}
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-3xl shadow-2xl shadow-blue-500/20">
                        <MessageCircle className="w-16 h-16 text-white animate-pulse" strokeWidth={1.5} />
                    </div>
                </div>

                {/* App name */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        DevChat
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        Realtime Communication
                    </p>
                </div>

                {/* Progress bar - WhatsApp style */}
                <div className="w-80 space-y-3">
                    <div className="relative h-1 bg-gray-300 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                        </div>
                    </div>

                    {/* Loading text */}
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                        {loadingText}
                    </p>
                </div>

                {/* Dots animation */}
                <div className="flex gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
            </div>

            {/* Custom CSS for shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
}

export default Loading;