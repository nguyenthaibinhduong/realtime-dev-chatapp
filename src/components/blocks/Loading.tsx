const Loading = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--chat-background))]">
            <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-zinc-400">Đang tải...</p>
            </div>
        </div>
    );
}

export default Loading;