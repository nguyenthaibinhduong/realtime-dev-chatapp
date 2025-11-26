import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import attachmentService from "@/services/attachmentService";

/**
 * Avatar Group — UX/UI chuẩn, accessible, Dark/Light ready
 * - 3 biến thể: "stack" (chồng), "square" (2×2 ô vuông), "grid" (2×2 tròn)
 * - Kích thước preset (xs–xl) hoặc số px tuỳ ý
 * - Focus-visible ring + keyboard nav (Enter/Space)
 * - Overflow "+N" có aria-label, tooltip
 * - Tách logic URL: currentUserId → /profile, người khác → /users/:id
 * - Không lệ thuộc Tailwind class động cho size (dùng inline style khi là number)
 */

export type User = {
    id: string | number;
    username?: string | null;
    email?: string | null;
    avatar?: string | null;
    github_avatar?: string | null;
};

type PresetSize = "xs" | "sm" | "md" | "lg" | "xl";
export type AvatarSize = PresetSize | number; // number = px

const presetCircle: Record<PresetSize, string> = {
    xs: "h-6 w-6 text-[10px]",
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-[12px]",
    lg: "h-12 w-12 text-[13px]",
    xl: "h-14 w-14 text-[14px]",
};

const presetBoxPx: Record<PresetSize, number> = { xs: 24, sm: 32, md: 40, lg: 48, xl: 56 };
const presetTilePx: Record<PresetSize, number> = { xs: 18, sm: 24, md: 28, lg: 32, xl: 36 };

function sizeClass(size: AvatarSize) {
    return typeof size === "number" ? undefined : presetCircle[size];
}
function sizeStyle(size: AvatarSize): React.CSSProperties | undefined {
    if (typeof size === "number") {
        const px = `${size}px`;
        return { width: px, height: px };
    }
    return undefined;
}

const displayName = (u?: User) => u?.username || u?.email || "User";

// Hook để lấy avatar URL
// const useAvatarUrl = (user?: User) => {
//     const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

//     useEffect(() => {
//         if (user?.avatar) {
//             attachmentService.getObjectUrl(user.avatar).then(setAvatarUrl);
//         } else {
//             setAvatarUrl(null);
//         }
//     }, [user?.avatar]);

//     return avatarUrl;
// };

const avatarSrc = (u?: User, avatarUrl?: string | null) => {
    return u?.avatar || u?.github_avatar || `https://i.pravatar.cc/150?u=${u?.id}` || undefined;
};

/** Common props */
export type BaseGroupProps = {
    users: User[];
    className?: string;
    tooltip?: boolean;
    /** Nếu cung cấp, click vào chính mình sẽ dẫn /profile; mặc định undefined */
    currentUserId?: User["id"];
    /** Build URL tuỳ biến, ưu tiên hơn currentUserId logic */
    getHref?: (u: User, isMe: boolean) => string | undefined;
    /** Bắt sự kiện click avatar (chạy sau điều hướng mặc định nếu return void) */
    onAvatarClick?: (u: User) => void;
};

/** Component Avatar với URL từ attachmentService */
function AvatarWithUrl({
    user,
    className,
    imageClassName,
    fallbackClassName,
    children
}: {
    user: User;
    className?: string;
    imageClassName?: string;
    fallbackClassName?: string;
    children?: React.ReactNode;
}) {
    const avatarUrl = '';
    const name = displayName(user);

    return (
        <Avatar className={className}>
            <AvatarImage
                className={imageClassName}
                src={avatarSrc(user, avatarUrl)}
                alt={name}
            />
            <AvatarFallback className={fallbackClassName || "bg-muted text-muted-foreground font-medium"}>
                {name?.[0]?.toUpperCase() ?? "U"}
            </AvatarFallback>
            {children}
        </Avatar>
    );
}

/** Accessible trigger wrapper for Avatar (handles click + keyboard) */
function AvatarButton({
    user,
    label,
    className,
    style,
    title,
    onActivate,
    children,
}: {
    user: User;
    label: string;
    className?: string;
    style?: React.CSSProperties;
    title?: string;
    onActivate?: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            className={cn(
                "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:opacity-50 disabled:pointer-events-none",
                className
            )}
            style={style}
            aria-label={label}
            title={title}
            onClick={onActivate}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onActivate?.();
                }
            }}
        >
            {children}
        </button>
    );
}

/**
 * Variant: Stack (chồng)
 */
export function AvatarGroupStack({
    users,
    className,
    tooltip = true,
    currentUserId,
    getHref,
    onAvatarClick,
    max = 5,
    size = "md",
    overlap = true,
    overlapOffset = 8,
    showOverflowCount = true,
}: BaseGroupProps & {
    max?: number;
    size?: AvatarSize;
    overlap?: boolean;
    overlapOffset?: number; // px
    showOverflowCount?: boolean;
}) {
    const navigate = useNavigate();
    if (!users?.length) return null;

    const visible = users.slice(0, Math.max(0, max));
    const remaining = Math.max(0, users.length - visible.length);

    const cls = sizeClass(size);
    const stl = sizeStyle(size);

    return (
        <TooltipProvider>
            <div
                className={cn("flex items-center", className)}
                role="list"
                aria-label={`Participants (${users.length})`}
            >
                {visible.map((u, i) => {
                    const isMe = currentUserId != null && u.id === currentUserId;
                    const href = getHref?.(u, isMe) ?? (isMe ? "/profile" : `/users/${u.id}`);
                    const name = displayName(u);
                    const overlapStyle = overlap && i !== 0 ? { marginLeft: `-${overlapOffset}px` } : undefined;

                    const activate = () => {
                        if (href) navigate(href);
                        onAvatarClick?.(u);
                    };

                    const core = (
                        <AvatarWithUrl
                            user={u}
                            className={cn("ring-2 ring-background", cls ?? "h-10 w-10", "rounded-full")}
                        />
                    );

                    const trigger = (
                        <AvatarButton
                            key={`${u.id}-${i}`}
                            user={u}
                            label={name}
                            style={{ ...stl, ...overlapStyle }}
                            className={cn(
                                "hover:z-10 transition-transform active:scale-95",
                                cls ?? "h-10 w-10"
                            )}
                            title={tooltip ? name : undefined}
                            onActivate={activate}
                            children={core}
                        />
                    );

                    return tooltip ? (
                        <Tooltip key={`tt-${u.id}-${i}`}>
                            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                            <TooltipContent sideOffset={6}>{name}</TooltipContent>
                        </Tooltip>
                    ) : (
                        trigger
                    );
                })}

                {showOverflowCount && remaining > 0 && (
                    <div
                        role="listitem"
                        aria-label={`${remaining} more`}
                        className={cn(
                            "flex items-center justify-center rounded-full bg-muted text-muted-foreground select-none ring-2 ring-background",
                            cls ?? "h-10 w-10",
                            overlap ? "ml-[-8px]" : undefined
                        )}
                        style={stl}
                        title={tooltip ? `${remaining} more` : undefined}
                    >
                        +{remaining}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

/**
 * Variant: Square (2×2 ô vuông, auto-layout đẹp với 1–3 ảnh + ô đếm)
 */
export function AvatarGroupSquare({
    users,
    className,
    tooltip = true,
    currentUserId,
    getHref,
    onAvatarClick,
    size = "md",
    radius = "lg",
    gap = 2,
}: BaseGroupProps & {
    size?: AvatarSize;
    radius?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
    gap?: number;
}) {
    const navigate = useNavigate();
    if (!users?.length) return null;

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

    const spanClass = (len: number) => (idx: number) => {
        if (len === 1) return "col-span-2 row-span-2";
        if (len === 2) return "row-span-2";
        return "";
    };
    const spanFor = spanClass(visible.length);

    return (
        <TooltipProvider>
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
                {visible.map((u, i) => {
                    const isMe = currentUserId != null && u.id === currentUserId;
                    const href = getHref?.(u, isMe) ?? (isMe ? "/profile" : `/users/${u.id}`);
                    const name = displayName(u);
                    const activate = () => {
                        if (href) navigate(href);
                        onAvatarClick?.(u);
                    };

                    const tile = (
                        <AvatarWithUrl
                            user={u}
                            className="h-full w-full rounded-none"
                            imageClassName="object-cover"
                        />
                    );

                    const trigger = (
                        <AvatarButton
                            key={`${u.id}-${i}`}
                            user={u}
                            label={name}
                            className={cn(spanFor(i), "hover:cursor-pointer")}
                            title={tooltip ? name : undefined}
                            onActivate={activate}
                        >
                            {tile}
                        </AvatarButton>
                    );

                    return tooltip ? (
                        <Tooltip key={`tt2-${u.id}-${i}`}>
                            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                            <TooltipContent sideOffset={6}>{name}</TooltipContent>
                        </Tooltip>
                    ) : (
                        trigger
                    );
                })}

                {remaining > 0 && (
                    <div
                        className={cn(
                            "flex items-center justify-center bg-muted text-muted-foreground font-medium select-none"
                        )}
                        title={tooltip ? `${remaining} more` : undefined}
                        aria-label={`${remaining} more`}
                    >
                        +{remaining}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

/**
 * Variant: Grid (2×2 tròn)
 */
export function AvatarGroupGrids({
    users,
    className,
    tooltip = true,
    currentUserId,
    getHref,
    onAvatarClick,
    tile = "lg",
    gap = 4,
    showOverflowCount = true,
}: BaseGroupProps & {
    tile?: AvatarSize; // đường kính mỗi vòng tròn
    gap?: number;
    showOverflowCount?: boolean;
}) {
    const navigate = useNavigate();
    if (!users?.length) return null;

    const tilePx = typeof tile === "number" ? tile : presetTilePx[tile];
    const visible = users.slice(0, Math.min(3, users.length));
    const remaining = Math.max(0, users.length - visible.length);
    const containerSize = tilePx * 2 + gap; // 2×2

    return (
        <TooltipProvider>
            <div
                className={cn("grid grid-cols-2 grid-rows-2", className)}
                style={{ gap, width: containerSize, height: containerSize }}
                role="group"
                aria-label={`Participants (${users.length})`}
            >
                {visible.map((u, i) => {
                    const isMe = currentUserId != null && u.id === currentUserId;
                    const href = getHref?.(u, isMe) ?? (isMe ? "/profile" : `/users/${u.id}`);
                    const name = displayName(u);
                    const activate = () => {
                        if (href) navigate(href);
                        onAvatarClick?.(u);
                    };

                    const circle = (
                        <AvatarWithUrl
                            user={u}
                            className="h-full w-full rounded-full ring-2 ring-background border border-border"
                            imageClassName="object-cover"
                            fallbackClassName="bg-muted text-foreground/90"
                        />
                    );

                    const trigger = (
                        <AvatarButton
                            key={`${u.id}-${i}`}
                            user={u}
                            label={name}
                            className="hover:cursor-pointer"
                            style={{ width: tilePx, height: tilePx }}
                            title={tooltip ? name : undefined}
                            onActivate={activate}
                        >
                            {circle}
                        </AvatarButton>
                    );

                    return tooltip ? (
                        <Tooltip key={`tt3-${u.id}-${i}`}>
                            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                            <TooltipContent sideOffset={6}>{name}</TooltipContent>
                        </Tooltip>
                    ) : (
                        trigger
                    );
                })}

                {showOverflowCount && remaining > 0 && (
                    <div
                        className="flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background select-none"
                        style={{ width: tilePx, height: tilePx }}
                        title={tooltip ? `${remaining} more` : undefined}
                        aria-label={`${remaining} more`}
                    >
                        +{remaining}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

/**
 * Variant: GridStacked (2×2 chồng, ảnh to + overlap)
 */
export function AvatarGroupGridStacked({
    users,
    className,
    tooltip = true,
    currentUserId,
    getHref,
    onAvatarClick,
    tile = 64, // ảnh to mặc định
    overlap = 12, // px chồng lên nhau
    showOverflowCount = true,
}: BaseGroupProps & {
    tile?: AvatarSize;
    overlap?: number;
    showOverflowCount?: boolean;
}) {
    const navigate = useNavigate();
    if (!users?.length) return null;

    const tilePx = typeof tile === "number" ? tile : presetTilePx[tile];
    const spots = 4; // 2x2
    const visibleUsers = users.slice(0, Math.min(spots - 1, users.length)); // để dành spot cuối cho +N nếu cần
    const remaining = Math.max(0, users.length - visibleUsers.length);

    // Kích thước khung: 2 ô trừ đi phần chồng (overlap) 1 lần theo mỗi trục
    const containerSize = tilePx * 2 - overlap;

    // Vị trí 4 cell (TL, TR, BL, BR)
    const positions: Array<React.CSSProperties> = [
        { left: 0, top: 0 },
        { left: tilePx - overlap, top: 0 },
        { left: 0, top: tilePx - overlap },
        { left: tilePx - overlap, top: tilePx - overlap },
    ];

    // Tính xem có dùng tile thứ 4 cho +N không
    const showPlusTile = showOverflowCount && users.length > spots - 1;

    return (
        <TooltipProvider>
            <div
                className={cn("relative", className)}
                style={{ width: containerSize, height: containerSize }}
                role="group"
                aria-label={`Participants (${users.length})`}
            >
                {visibleUsers.map((u, i) => {
                    const isMe = currentUserId != null && u.id === currentUserId;
                    const href = getHref?.(u, isMe) ?? (isMe ? "/profile" : `/users/${u.id}`);
                    const name = displayName(u);
                    const activate = () => {
                        if (href) navigate(href);
                        onAvatarClick?.(u);
                    };

                    const circle = (
                        <AvatarWithUrl
                            user={u}
                            className="h-full w-full rounded-full ring-2 ring-background border border-border shadow-sm"
                            imageClassName="object-cover"
                            fallbackClassName="bg-muted text-foreground/90"
                        />
                    );

                    const trigger = (
                        <AvatarButton
                            key={`${u.id}-${i}`}
                            user={u}
                            label={name}
                            className={"absolute hover:z-10 transition-transform active:scale-95"}
                            style={{ width: tilePx, height: tilePx, ...positions[i] }}
                            title={tooltip ? name : undefined}
                            onActivate={activate}
                        >
                            {circle}
                        </AvatarButton>
                    );

                    return tooltip ? (
                        <Tooltip key={`tt4-${u.id}-${i}`}>
                            <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                            <TooltipContent sideOffset={6}>{name}</TooltipContent>
                        </Tooltip>
                    ) : (
                        trigger
                    );
                })}

                {showPlusTile && (
                    <div
                        className={"absolute flex items-center justify-center rounded-full bg-muted text-muted-foreground ring-2 ring-background select-none"}
                        style={{ width: tilePx, height: tilePx, ...positions[3] }}
                        title={tooltip ? `${users.length - (spots - 1)} more` : undefined}
                        aria-label={`${users.length - (spots - 1)} more`}
                    >
                        +{users.length - (spots - 1)}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

/**
USAGE
-----

// import {
//   AvatarGroupStack,
//   AvatarGroupSquare,
//   AvatarGroupGrid,
//   AvatarGroupGridStacked,
//   type User,
// } from "@/components/ui/avatar-group";

// const users: User[] = [/* ... 
// const me = { id: 1 };

// // 1) Stack (chồng) — overlap + overflow
// <AvatarGroupStack users={users} size="lg" max={5} overlap overlapOffset={10} currentUserId={me.id} />

// // 2) Square (2×2 ô vuông)
// <AvatarGroupSquare users={users} size={56} radius="2xl" />

// // 3) Grid (2×2 tròn)
// <AvatarGroupGrid users={users} tile="xl" gap={8} />

// // 4) GridStacked (2×2 chồng, ảnh to + overlap)
// <AvatarGroupGridStacked users={users} tile={72} overlap={14} currentUserId={me.id} />

// // Tùy biến URL
// <AvatarGroupGridStacked users={users} getHref={(u, isMe) => (isMe ? "/profile" : `/member/${u.id}`)} />
//     */

/**
 * Variant: Zalo-style (2×2, 3 ảnh + ô số)
 * - Các vòng tròn gần như chạm nhau (touch), không viền, không ring
 * - Góc nhìn gọn, thích hợp thanh sidebar/chat list
 * - Mặc định hiển thị 3 avatar đầu + ô đếm (tổng - 3)
 */
export function AvatarGroupGrid({
    users,
    className,
    tooltip = false,
    currentUserId,
    getHref,
    onAvatarClick,
    tile = 36, // đường kính mỗi avatar
    touch = 2, // mức chồng để "chạm" nhau (px)
    countMode = "overflow", // "overflow" | "total"
}: BaseGroupProps & {
    tile?: AvatarSize;
    touch?: number; // chồng lên nhau để giảm khe hở
    /** overflow: số còn lại (total-3); total: tổng số thành viên */
    countMode?: "overflow" | "total";
}) {
    const navigate = useNavigate();
    if (!users?.length) return null;

    const tilePx = typeof tile === "number" ? tile : presetTilePx[tile];
    const spots = 4; // 2×2
    const visible = users.slice(0, Math.min(3, users.length));
    const overflow = Math.max(0, users.length - visible.length);
    const count = countMode === "total" ? users.length : overflow;

    // container: 2 ô trừ chồng (để các hình gần như chạm nhau)
    const containerSize = tilePx * 2 - touch;
    const pos = [
        { left: 0, top: 0 },
        { left: tilePx - touch, top: 0 },
        { left: 0, top: tilePx - touch },
        { left: tilePx - touch, top: tilePx - touch },
    ] as const;

    return (
        <div
            className={cn("relative", className)}
            style={{ width: containerSize, height: containerSize }}
            role="group"
            aria-label={`Participants (${users.length})`}
        >
            {visible.map((u, i) => {
                const isMe = currentUserId != null && u.id === currentUserId;
                const href = getHref?.(u, isMe) ?? (isMe ? "/profile" : `/users/${u.id}`);
                const name = displayName(u);
                const activate = () => {
                    if (href) navigate(href);
                    onAvatarClick?.(u);
                };
                const img = (
                    <AvatarWithUrl
                        user={u}
                        className="h-full w-full rounded-full"
                        imageClassName="object-cover"
                    />
                );
                return (
                    <button
                        key={`${u.id}-${i}`}
                        type="button"
                        className="absolute rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        style={{ width: tilePx, height: tilePx, ...pos[i] }}
                        aria-label={name}
                        title={tooltip ? name : undefined}
                        onClick={activate}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                activate();
                            }
                        }}
                    >
                        {img}
                    </button>
                );
            })}

            {/* Ô số ở góc dưới-phải */}
            <div
                className="absolute flex items-center justify-center rounded-full select-none "
                style={{ width: tilePx, height: tilePx, ...pos[3] }}
                aria-label={countMode === "total" ? `Total ${count}` : `${count} more`}
                title={tooltip ? (countMode === "total" ? `Total ${count}` : `${count} more`) : undefined}
            >
                <div className="h-full w-full rounded-full bg-foreground/20 dark:bg-foreground/30 text-foreground grid place-items-center">
                    <span className="text-[13px] font-semibold leading-none">
                        {count}
                    </span>
                </div>
            </div>
        </div>
    );
}

/**
USAGE — Zalo style
------------------
import { AvatarGroupZalo2x2 } from "@/components/ui/avatar-group";

// Giống Zalo: 3 ảnh + ô số ở góc dưới-phải
<AvatarGroupZalo2x2 users={users} tile={40} touch={3} />

// Nếu muốn ô số hiển thị tổng (không phải overflow)
<AvatarGroupZalo2x2 users={users} tile={40} countMode="total" />**/
