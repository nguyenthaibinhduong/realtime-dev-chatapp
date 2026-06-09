import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const themeOrder = ["light", "dark", "system"] as const;

const themeLabels: Record<(typeof themeOrder)[number], string> = {
  light: "Light mode",
  dark: "Dark mode",
  system: "Theo hệ thống",
};

interface ThemeToggleProps {
  className?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

export function ThemeToggle({ className, tooltipSide = "right" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = themeOrder.includes(theme as (typeof themeOrder)[number])
    ? (theme as (typeof themeOrder)[number])
    : "system";

  const nextTheme =
    themeOrder[(themeOrder.indexOf(activeTheme) + 1) % themeOrder.length];

  const Icon =
    activeTheme === "light" ? Sun : activeTheme === "dark" ? Moon : Monitor;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-xl border border-transparent text-sidebar-foreground/75 transition-all duration-200 hover:border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            className
          )}
          onClick={() => setTheme(nextTheme)}
          aria-label="Đổi giao diện sáng/tối"
          title={mounted ? themeLabels[activeTheme] : "Giao diện"}
        >
          <Icon className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side={tooltipSide}
        className="border border-border bg-popover text-popover-foreground"
      >
        {mounted ? themeLabels[activeTheme] : "Giao diện"}
      </TooltipContent>
    </Tooltip>
  );
}
