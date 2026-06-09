/**
 * Shared styles and constants for message components
 * Chuẩn hóa UX/UI cho tất cả các loại message
 */

import { cn } from "@/lib/utils";

// ==================== COLOR PALETTE ====================
export const COLORS = {
  // Background colors
  bg: {
    me: "chat-bubble-outgoing",
    meHover: "brightness-95",
    other: "chat-bubble-incoming",
    otherHover: "brightness-95",
    card: "app-surface",
    cardHover: "bg-muted/60",
    overlay: "bg-background/60",
  },
  
  // Text colors
  text: {
    primary: "text-gray-900 dark:text-white",
    secondary: "text-gray-700 dark:text-gray-200",
    muted: "text-gray-500 dark:text-gray-400",
    mutedDark: "text-gray-400 dark:text-gray-500",
    timestamp: "text-gray-500 dark:text-gray-400",
    username: "text-gray-700 dark:text-gray-300",
  },
  
  // Border colors
  border: {
    default: "border-border",
    hover: "border-primary/40",
    card: "border-border",
    accent: "border-primary/30",
  },
  
  // Status colors
  status: {
    pending: "text-yellow-500 dark:text-yellow-400",
    uploading: "text-blue-500 dark:text-blue-400",
    error: "text-red-500 dark:text-red-400",
    success: "text-green-500 dark:text-green-400",
  },
  
  // Language colors for code
  language: {
    javascript: "text-yellow-500 dark:text-yellow-400",
    typescript: "text-blue-500 dark:text-blue-400",
    python: "text-green-500 dark:text-green-400",
    java: "text-orange-500 dark:text-orange-400",
    cpp: "text-blue-500 dark:text-blue-400",
    go: "text-cyan-500 dark:text-cyan-400",
    html: "text-orange-500 dark:text-orange-400",
    css: "text-blue-500 dark:text-blue-400",
    json: "text-gray-500 dark:text-gray-400",
    markdown: "text-gray-500 dark:text-gray-400",
    plaintext: "text-gray-500 dark:text-gray-400",
  },
  
  // Method colors for API requests
  method: {
    GET: "bg-sky-500 dark:bg-sky-600 text-white",
    POST: "bg-green-500 dark:bg-green-600 text-white",
    PUT: "bg-amber-500 dark:bg-amber-600 text-white",
    PATCH: "bg-purple-500 dark:bg-purple-600 text-white",
    DELETE: "bg-red-500 dark:bg-red-600 text-white",
  },
} as const;

// ==================== TYPOGRAPHY ====================
export const TYPOGRAPHY = {
  // Font sizes
  size: {
    xs: "text-[9px]",
    sm: "text-[10px]",
    base: "text-[11px]",
    md: "text-[12px]",
    lg: "text-[13px]",
  },
  
  // Font weights
  weight: {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  },
  
  // Line heights
  leading: {
    tight: "leading-tight",
    normal: "leading-normal",
    relaxed: "leading-relaxed",
  },
} as const;

// ==================== SPACING ====================
export const SPACING = {
  // Padding
  padding: {
    message: "px-2.5 py-1.5",
    messageCompact: "px-2 py-1",
    card: "p-3",
    cardCompact: "p-2",
  },
  
  // Gaps
  gap: {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  },
  
  // Margins
  margin: {
    messageGroup: "my-2",
    messageItem: "my-0.5",
  },
} as const;

// ==================== LAYOUT ====================
export const LAYOUT = {
  // Max widths
  maxWidth: {
    message: "max-w-[65%]",
    card: "max-w-[600px]",
    cardLarge: "max-w-4xl",
  },
  
  // Min widths
  minWidth: {
    message: "min-w-[100px]",
    card: "min-w-[350px]",
  },
  
  // Avatar sizes
  avatar: {
    sm: 24,
    md: 24,
    lg: 32,
  },
} as const;

// ==================== BORDERS & RADIUS ====================
export const BORDERS = {
  // Border radius
  radius: {
    sm: "rounded-md",
    md: "rounded-lg",
    lg: "rounded-xl",
    full: "rounded-full",
  },
  
  // Border width
  width: {
    default: "border",
    thick: "border-2",
  },
  
  // Border styles
  style: {
    solid: "border-solid",
    dashed: "border-dashed",
  },
} as const;

// ==================== SHADOWS ====================
export const SHADOWS = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  card: "shadow-lg",
} as const;

// ==================== TRANSITIONS ====================
export const TRANSITIONS = {
  fast: "transition-all duration-100",
  normal: "transition-all duration-200",
  slow: "transition-all duration-300",
} as const;

// ==================== HELPER FUNCTIONS ====================

/**
 * Get message bubble classes based on sender and hover state
 */
export const getMessageBubbleClasses = (isMe: boolean, isHovered: boolean, hasOnlyImages?: boolean) => {
  if (hasOnlyImages) return "bg-transparent";
  
  return cn(
    "relative break-words",
    TRANSITIONS.normal,
    isMe ? "rounded-lg rounded-tr-sm" : "rounded-lg rounded-tl-sm",
    SPACING.padding.message,
    isMe ? COLORS.bg.me : COLORS.bg.other,
    isMe ? SHADOWS.sm : cn(SHADOWS.sm, COLORS.border.default, "border"),
    isHovered && (isMe ? cn(SHADOWS.lg, COLORS.bg.meHover) : cn(SHADOWS.md, COLORS.border.hover))
  );
};

/**
 * Get card classes for special message types
 */
export const getCardClasses = (isMe: boolean, isHovered: boolean) => {
  return cn(
    "relative rounded-lg overflow-hidden w-full",
    TRANSITIONS.normal,
    SHADOWS.card,
    COLORS.bg.card,
    isMe ? COLORS.border.accent : COLORS.border.card,
    isHovered && cn(SHADOWS.xl, COLORS.border.hover)
  );
};

/**
 * Get timestamp classes
 */
export const getTimestampClasses = (isMe: boolean) => {
  return cn(
    TYPOGRAPHY.size.xs,
    TYPOGRAPHY.weight.medium,
    isMe ? "text-blue-100 dark:text-blue-200" : COLORS.text.timestamp
  );
};

/**
 * Get username/sender classes
 */
export const getUsernameClasses = () => {
  return cn(
    TYPOGRAPHY.size.sm,
    TYPOGRAPHY.weight.medium,
    COLORS.text.username
  );
};

/**
 * Format time consistently across all message types
 */
export const formatMessageTime = (date: string | Date) => {
  return new Date(date).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Get status color classes for HTTP status codes
 */
export const getStatusColorClasses = (status?: number) => {
  if (!status) return "bg-gray-400 dark:bg-zinc-200 dark:bg-zinc-700 text-white";
  if (status < 300) return "bg-emerald-500 dark:bg-emerald-600 text-white";
  if (status < 400) return "bg-blue-500 dark:bg-blue-600 text-white";
  if (status < 500) return "bg-amber-500 dark:bg-amber-600 text-white";
  return "bg-red-500 dark:bg-red-600 text-white";
};

/**
 * Language display mapping for code blocks
 */
export const LANGUAGE_MAP: Record<string, { icon: string; name: string; color: string }> = {
  javascript: { icon: "🟨", name: "JavaScript", color: COLORS.language.javascript },
  typescript: { icon: "🔷", name: "TypeScript", color: COLORS.language.typescript },
  python: { icon: "🐍", name: "Python", color: COLORS.language.python },
  java: { icon: "☕", name: "Java", color: COLORS.language.java },
  cpp: { icon: "🔷", name: "C++", color: COLORS.language.cpp },
  go: { icon: "🔵", name: "Go", color: COLORS.language.go },
  html: { icon: "🌐", name: "HTML", color: COLORS.language.html },
  css: { icon: "🎨", name: "CSS", color: COLORS.language.css },
  json: { icon: "📄", name: "JSON", color: COLORS.language.json },
  markdown: { icon: "📝", name: "Markdown", color: COLORS.language.markdown },
  plaintext: { icon: "📄", name: "Plain Text", color: COLORS.language.plaintext },
};

/**
 * Method color mapping for API requests
 */
export const METHOD_COLORS = COLORS.method;

/**
 * Get container classes for message wrapper
 */
export const getMessageContainerClasses = (isMe: boolean) => {
  return cn(
    "flex gap-1 group py-1 transition-all duration-100 rounded-md",
    isMe ? "flex-row-reverse" : "flex-row"
  );
};

/**
 * Get content container classes
 */
export const getContentContainerClasses = (isMe: boolean) => {
  return cn(
    "relative flex flex-col",
    LAYOUT.maxWidth.message,
    LAYOUT.minWidth.message,
    isMe ? "items-end" : "items-start"
  );
};

/**
 * Get card content container classes
 */
export const getCardContentContainerClasses = (isMe: boolean) => {
  return cn(
    "relative flex flex-col gap-1",
    LAYOUT.maxWidth.card,
    LAYOUT.minWidth.card,
    isMe ? "items-end ml-auto" : "items-start mr-auto"
  );
};
