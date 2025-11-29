import { memo } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
    onClick: () => void;
    className?: string;
    label?: string;
}

const ShareButton = memo(({ onClick, className, label = "Chia sẻ" }: ShareButtonProps) => {
    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-md",
                "text-[10px] border border-blue-500/60 text-blue-500 hover:bg-blue-500/10",
                className
            )}
            aria-label={label}
        >
            <Share2 className="h-3 w-3" /> {label}
        </button>
    );
});

ShareButton.displayName = "ShareButton";

export default ShareButton;
