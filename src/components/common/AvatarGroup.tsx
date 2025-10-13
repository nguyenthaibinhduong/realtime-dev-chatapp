import * as React from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * A11y-friendly AvatarGroup built on Radix UI Avatar primitives.
 * - Renders an array of users
 * - Optional stacking (overlap) with ring to separate items
 * - Max visible count with "+N" overflow chip
 * - Click to navigate to user profile (or /profile when it's currentUserId)
 * - Works with Tailwind JIT safely (no dynamic class pitfalls for size)
 */

type User = {
    id: string | number;
    username?: string | null;
    email?: string | null;
    avatar?: string | null;
    github_avatar?: string | null;
};

type PresetSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarGroupSize = PresetSize | number; // number = px

const presetSizeClass: Record<PresetSize, string> = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-[12px]",
    lg: "h-12 w-12 text-[13px]",
    xl: "h-14 w-14 text-[14px]",
};

function getSizeClass(size: AvatarGroupSize): string | undefined {
    return typeof size === "number" ? undefined : presetSizeClass[size];
}

function getSizeStyle(size: AvatarGroupSize): React.CSSProperties | undefined {
    if (typeof size === "number") {
        const px = `${size}px`;
        return { width: px, height: px };
    }
    return undefined;
}

export interface AvatarGroupProps {
    users: User[];
    /** Maximum number of avatars to render before "+N" overflow */
    max?: number;
    /** Preset size or a custom pixel number (e.g., 36) */
    size?: AvatarGroupSize;
    /** Stack avatars with overlap (negative margin) */
    overlap?: boolean;
    /** Overlap offset in px when overlap=true */
    overlapOffset?: number;
    /** Show the +N overflow chip when there are more users than `max` */
    showOverflowCount?: boolean;
    /** Add extra classes to the container */
    className?: string;
    /** Use the `title` attribute on each avatar for a basic tooltip */
    tooltip?: boolean;
    /** If provided, clicking the current user routes to `/profile` */
    currentUserId?: User["id"];
}

const getDisplayName = (u?: User) => u?.username || u?.email || "User";
const getAvatarUrl = (u?: User) => u?.avatar ?? u?.github_avatar ?? undefined;
export default function AvatarGroup({
    users,
    max = 5,
    size = "md",
    overlap = true,
    overlapOffset = 8,
    showOverflowCount = true,
    className,
    tooltip = true,
    currentUserId,
}: AvatarGroupProps) {
    const navigate = useNavigate();
    const visible = users?.slice(0, Math.max(0, max)) ?? [];
    const remaining = Math.max(0, (users?.length ?? 0) - visible.length);

    if (!users || users.length === 0) return null;

    const sizeClass = getSizeClass(size);
    const sizeStyle = getSizeStyle(size);

    return (
        <div
            className={cn("flex items-center", className)}
            role="group"
            aria-label={`Participants (${users.length})`}
        >
            {visible.map((u, idx) => {
                const isMe = currentUserId != null && u.id === currentUserId;
                const url = isMe ? "/profile" : `/users/${u.id}`;
                const name = getDisplayName(u);
                const ml = overlap && idx !== 0 ? { marginLeft: `-${overlapOffset}px` } : undefined;

                return (
                    <Avatar
                        key={`${u.id}-${idx}`}
                        className={cn(
                            // a subtle ring helps separate overlapped circles
                            "ring-2 ring-background",
                            sizeClass ?? "h-10 w-10",
                            "hover:cursor-pointer hover:z-10 transition-transform active:scale-95 rounded-full"
                        )}
                        style={{ ...sizeStyle, ...ml }}
                        onClick={() => navigate(url)}
                        aria-label={name}
                        title={tooltip ? name : undefined}
                    >
                        <AvatarImage src={getAvatarUrl(u)} alt={name} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                            {name?.[0]?.toUpperCase() ?? "U"}
                        </AvatarFallback>
                    </Avatar>
                );
            })}

            {showOverflowCount && remaining > 0 && (
                <div
                    className={cn(
                        "flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background select-none",
                        sizeClass ?? "h-10 w-10",
                        overlap ? "ml-[-8px]" : undefined
                    )}
                    style={sizeStyle}
                    aria-label={`${remaining} more`}
                    title={tooltip ? `${remaining} more` : undefined}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}


export interface AvatarGroupSquareProps {
    users: User[];
    /** Overall square size in px or preset */
    size?: AvatarGroupSize; // presets follow AvatarGroup
    /** Corner radius token for the outer square */
    radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
    /** Gap between tiles in px */
    gap?: number;
    className?: string;
    tooltip?: boolean;
    currentUserId?: User["id"];
}

const presetBoxPx: Record<PresetSize, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
};

export function AvatarGroupSquare({
    users,
    size = "md",
    radius = "lg",
    gap = 2,
    className,
    tooltip = true,
    currentUserId,
}: AvatarGroupSquareProps) {
    const navigate = useNavigate();
    if (!users || users.length === 0) return null;

    const boxPx = typeof size === "number" ? size : presetBoxPx[size];
    const visible = users.slice(0, Math.min(3, users.length));
    const remaining = Math.max(0, users.length - visible.length);

    const radiusClass =
        radius === "none"
            ? "rounded-none"
            : radius === "sm"
                ? "rounded"
                : radius === "md"
                    ? "rounded-md"
                    : radius === "lg"
                        ? "rounded-lg"
                        : radius === "xl"
                            ? "rounded-xl"
                            : "rounded-2xl";

    // Helper to compute special spans for 1 or 2 images
    const spanClass = (idx: number, len: number) => {
        if (len === 1) return "col-span-2 row-span-2";
        if (len === 2) return "row-span-2"; // first two fill left & right columns
        return "";
    };

    return (
        <div
            className={cn(
                "relative grid grid-cols-2 grid-rows-2 overflow-hidden bg-background ring-1 ring-border",
                radiusClass,
                className
            )}
            style={{ width: boxPx, height: boxPx, gap }}
            role="group"
            aria-label={`Participants (${users.length})`}
        >
            {visible.map((u, idx) => {
                const isMe = currentUserId != null && u.id === currentUserId;
                const url = isMe ? "/profile" : `/users/${u.id}`;
                const name = getDisplayName(u);

                return (
                    <div key={`${u.id}-${idx}`} className={cn(spanClass(idx, visible.length))}>
                        <Avatar
                            className={cn(
                                "h-full w-full rounded-none", // square tiles; container provides outer radius
                                "hover:cursor-pointer"
                            )}
                            title={tooltip ? name : undefined}
                            aria-label={name}
                            onClick={() => navigate(url)}
                        >
                            <AvatarImage className="object-cover" src={getAvatarUrl(u)} alt={name} />
                            <AvatarFallback className="bg-muted text-muted-foreground font-medium">
                                {name?.[0]?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                );
            })}

            {/* Fourth tile shows +N if there are more than 3 users */}
            {remaining > 0 && (
                <div
                    className={cn(
                        "flex items-center justify-center bg-muted text-muted-foreground font-medium select-none",
                        // ensure tile fills remaining cell
                        visible.length < 3 ? "col-span-1 row-span-1" : undefined
                    )}
                    title={tooltip ? `${remaining} more` : undefined}
                    aria-label={`${remaining} more`}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}

export interface AvatarGroupProps {
    users: User[];
    /** Diameter of each circle in px or preset */
    tile?: AvatarGroupSize;
    /** Gap between circles in px */
    gap?: number;
    /** Show +N tile as the 4th circle */
    showOverflowCount?: boolean;
    /** Extra class on container */
    className?: string;
    tooltip?: boolean;
    currentUserId?: User["id"];
}

const presetTilePx: Record<PresetSize, number> = {
    xs: 18,
    sm: 24,
    md: 28,
    lg: 32,
    xl: 36,
};

export function AvatarGroupGrid({
    users,
    tile = "lg",
    gap = 4,
    showOverflowCount = true,
    className,
    tooltip = true,
    currentUserId,
}: AvatarGroupProps) {
    const navigate = useNavigate();
    if (!users || users.length === 0) return null;

    const tilePx = typeof tile === "number" ? tile : presetTilePx[tile];
    const visible = users.slice(0, Math.min(3, users.length));
    const remaining = Math.max(0, users.length - visible.length);

    const containerSize = tilePx * 2 + gap; // width/height for 2x2 grid

    return (
        <div
            className={cn("grid grid-cols-2 grid-rows-2", className)}
            style={{ gap, width: containerSize, height: containerSize }}
            role="group"
            aria-label={`Participants (${users.length})`}
        >
            {visible.map((u, idx) => {
                const isMe = currentUserId != null && u.id === currentUserId;
                const url = isMe ? "/profile" : `/users/${u.id}`;
                const name = getDisplayName(u);
                return (
                    <div key={`${u.id}-${idx}`} className="relative">
                        <Avatar
                            className={cn(
                                "rounded-full ring-4 ring-black border border-primary hover:cursor-pointer",
                                "h-full w-full"
                            )}
                            style={{ width: tilePx, height: tilePx }}
                            onClick={() => navigate(url)}
                            aria-label={name}
                            title={tooltip ? name : undefined}
                        >
                            <AvatarImage className="object-cover" src={getAvatarUrl(u)} alt={name} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                {name?.[0]?.toUpperCase() ?? "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                );
            })}

            {showOverflowCount && remaining > 0 && (
                <div
                    className={cn(
                        "flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background select-none"
                    )}
                    style={{ width: tilePx, height: tilePx }}
                    title={tooltip ? `${remaining} more` : undefined}
                    aria-label={`${remaining} more`}
                >
                    {remaining}
                </div>
            )}
        </div>
    );
}

/*
USAGE
-----

// 2×2 cụm tròn: 3 avatar + ô đếm
import { AvatarGroup } from "@/components/ui/avatar-group";

<AvatarGroup users={users} tile={32} />
<AvatarGroup users={users} tile="xl" gap={6} currentUserId={me.id} />

*/
