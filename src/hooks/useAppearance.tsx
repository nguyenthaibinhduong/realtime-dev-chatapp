import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useTheme } from "next-themes";

export type AppearanceMode = "light" | "dark";
export type BorderContrast = "soft" | "normal" | "strong";

export interface AppearancePalette {
  background: string;
  card: string;
  primary: string;
  outgoingMessage: string;
  incomingMessage: string;
}

export interface AppearanceSettings {
  fontFamily: string;
  fontScale: number;
  radius: number;
  borderContrast: BorderContrast;
  light: AppearancePalette;
  dark: AppearancePalette;
}

interface AppearanceContextValue {
  appearance: AppearanceSettings;
  updateAppearance: (patch: Partial<AppearanceSettings>) => void;
  updatePalette: (mode: AppearanceMode, patch: Partial<AppearancePalette>) => void;
  resetAppearance: () => void;
}

export const APPEARANCE_STORAGE_KEY = "codesync-appearance";

export const FONT_OPTIONS = [
  {
    label: "Inter",
    value:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    label: "Segoe UI",
    value: "'Segoe UI', ui-sans-serif, system-ui, -apple-system, sans-serif",
  },
  {
    label: "Roboto",
    value: "Roboto, Arial, ui-sans-serif, system-ui, sans-serif",
  },
  {
    label: "System",
    value:
      "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  {
    label: "Mono",
    value:
      "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  },
] as const;

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  fontFamily: FONT_OPTIONS[0].value,
  fontScale: 100,
  radius: 8,
  borderContrast: "normal",
  light: {
    background: "#f8fafc",
    card: "#ffffff",
    primary: "#0f6fff",
    outgoingMessage: "#2563eb",
    incomingMessage: "#e5e7eb",
  },
  dark: {
    background: "#09090b",
    card: "#18181b",
    primary: "#2f81f7",
    outgoingMessage: "#2563eb",
    incomingMessage: "#27272a",
  },
};

const AppearanceContext = createContext<AppearanceContextValue | undefined>(
  undefined
);

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return { r: 255, g: 255, b: 255 };

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const hexToHsl = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const diff = max - min;
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / diff + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / diff + 2;
        break;
      default:
        h = (rNorm - gNorm) / diff + 4;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(
    l * 100
  )}%`;
};

const readableForeground = (hex: string) => {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? "222.2 47.4% 11.2%" : "210 40% 98%";
};

const borderForMode = (mode: AppearanceMode, contrast: BorderContrast) => {
  const light = {
    soft: "214 24% 92%",
    normal: "214 31.8% 88%",
    strong: "215 20.2% 74%",
  };
  const dark = {
    soft: "217 25% 20%",
    normal: "217.2 32.6% 24%",
    strong: "215 20.2% 38%",
  };

  return mode === "dark" ? dark[contrast] : light[contrast];
};

const normalizeAppearance = (value: Partial<AppearanceSettings>) => ({
  ...DEFAULT_APPEARANCE,
  ...value,
  fontScale: clamp(Number(value.fontScale ?? DEFAULT_APPEARANCE.fontScale), 90, 115),
  radius: clamp(Number(value.radius ?? DEFAULT_APPEARANCE.radius), 4, 16),
  light: {
    ...DEFAULT_APPEARANCE.light,
    ...value.light,
  },
  dark: {
    ...DEFAULT_APPEARANCE.dark,
    ...value.dark,
  },
});

const loadAppearance = () => {
  if (typeof window === "undefined") return DEFAULT_APPEARANCE;

  try {
    const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    return raw
      ? normalizeAppearance(JSON.parse(raw) as Partial<AppearanceSettings>)
      : DEFAULT_APPEARANCE;
  } catch {
    return DEFAULT_APPEARANCE;
  }
};

const applyAppearance = (
  settings: AppearanceSettings,
  resolvedTheme?: string
) => {
  if (typeof document === "undefined") return;

  const mode: AppearanceMode = resolvedTheme === "dark" ? "dark" : "light";
  const palette = settings[mode];
  const root = document.documentElement;

  root.style.setProperty("--app-font-family", settings.fontFamily);
  root.style.fontSize = `${settings.fontScale}%`;
  root.style.setProperty("--radius", `${settings.radius}px`);

  root.style.setProperty("--background", hexToHsl(palette.background));
  root.style.setProperty("--foreground", readableForeground(palette.background));
  root.style.setProperty("--card", hexToHsl(palette.card));
  root.style.setProperty("--card-foreground", readableForeground(palette.card));
  root.style.setProperty("--popover", hexToHsl(palette.card));
  root.style.setProperty("--popover-foreground", readableForeground(palette.card));
  root.style.setProperty("--primary", hexToHsl(palette.primary));
  root.style.setProperty("--primary-foreground", readableForeground(palette.primary));

  const border = borderForMode(mode, settings.borderContrast);
  root.style.setProperty("--border", border);
  root.style.setProperty("--input", border);
  root.style.setProperty("--sidebar-border", border);

  root.style.setProperty("--sidebar-background", hexToHsl(palette.card));
  root.style.setProperty("--sidebar-foreground", readableForeground(palette.card));
  root.style.setProperty("--sidebar-accent", hexToHsl(palette.background));
  root.style.setProperty(
    "--sidebar-accent-foreground",
    readableForeground(palette.background)
  );

  root.style.setProperty("--chat-background", hexToHsl(palette.background));
  root.style.setProperty("--chat-input", hexToHsl(palette.card));
  root.style.setProperty("--chat-hover", hexToHsl(palette.card));
  root.style.setProperty("--message-outgoing", hexToHsl(palette.outgoingMessage));
  root.style.setProperty(
    "--message-outgoing-foreground",
    readableForeground(palette.outgoingMessage)
  );
  root.style.setProperty("--message-incoming", hexToHsl(palette.incomingMessage));
  root.style.setProperty(
    "--message-incoming-foreground",
    readableForeground(palette.incomingMessage)
  );
};

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const [appearance, setAppearance] = useState<AppearanceSettings>(() =>
    loadAppearance()
  );

  useEffect(() => {
    applyAppearance(appearance, resolvedTheme);
    window.localStorage.setItem(
      APPEARANCE_STORAGE_KEY,
      JSON.stringify(appearance)
    );
  }, [appearance, resolvedTheme]);

  const updateAppearance = useCallback((patch: Partial<AppearanceSettings>) => {
    setAppearance((current) => normalizeAppearance({ ...current, ...patch }));
  }, []);

  const updatePalette = useCallback(
    (mode: AppearanceMode, patch: Partial<AppearancePalette>) => {
      setAppearance((current) =>
        normalizeAppearance({
          ...current,
          [mode]: {
            ...current[mode],
            ...patch,
          },
        })
      );
    },
    []
  );

  const resetAppearance = useCallback(() => {
    setAppearance(DEFAULT_APPEARANCE);
  }, []);

  const value = useMemo(
    () => ({
      appearance,
      updateAppearance,
      updatePalette,
      resetAppearance,
    }),
    [appearance, resetAppearance, updateAppearance, updatePalette]
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error("useAppearance must be used inside AppearanceProvider");
  }
  return context;
}
