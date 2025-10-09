import { memo } from "react";
import { Loader2 } from "lucide-react";

interface LoadMoreIndicatorProps {
    loading: boolean;
}

const LoadMoreIndicator = memo(({ loading }: LoadMoreIndicatorProps) => {
    if (!loading) return null;

    return (
        <div className="flex items-center justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary mr-2" />
            <span className="text-xs text-muted-foreground">
                Đang tải thêm tin nhắn...
            </span>
        </div>
    );
});

LoadMoreIndicator.displayName = "LoadMoreIndicator";

export default LoadMoreIndicator;