import {
  Database,
  MessageSquare,
  Moon,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sun,
  Type,
} from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import {
  AppearanceMode,
  BorderContrast,
  FONT_OPTIONS,
  useAppearance,
} from "@/hooks/useAppearance";
import { cn } from "@/lib/utils";

const colorFields = [
  { key: "background", label: "Màu nền" },
  { key: "card", label: "Màu khối/card" },
  { key: "primary", label: "Màu chính" },
  { key: "outgoingMessage", label: "Tin nhắn của tôi" },
  { key: "incomingMessage", label: "Tin nhắn người khác" },
] as const;

const backendSettings = [
  {
    key: "appearance.fontFamily",
    type: "string",
    note: "Font hiển thị toàn app, lưu theo user.",
  },
  {
    key: "appearance.fontScale",
    type: "number",
    note: "90-115, áp vào html font-size.",
  },
  {
    key: "appearance.borderContrast",
    type: "soft | normal | strong",
    note: "Điều khiển độ đậm border light/dark.",
  },
  {
    key: "appearance.palette.light",
    type: "object",
    note: "background, card, primary, outgoingMessage, incomingMessage.",
  },
  {
    key: "appearance.palette.dark",
    type: "object",
    note: "Bộ màu riêng cho dark mode.",
  },
  {
    key: "notification.preferences",
    type: "object",
    note: "Mute channel, desktop push, email digest, mention only.",
  },
  {
    key: "chat.preferences",
    type: "object",
    note: "Enter to send, compact mode, show avatar, code preview.",
  },
] as const;

const plannedSettings = [
  "Đồng bộ theme theo tài khoản khi login trên thiết bị khác",
  "Preset giao diện theo workspace/team",
  "Quyền admin khóa brand color cho toàn workspace",
  "Cấu hình thông báo theo channel và keyword",
  "Export/import settings dạng JSON",
] as const;

function ColorInput({
  mode,
  field,
  label,
}: {
  mode: AppearanceMode;
  field: (typeof colorFields)[number]["key"];
  label: string;
}) {
  const { appearance, updatePalette } = useAppearance();

  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
      <span className="min-w-0 text-sm text-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          {appearance[mode][field]}
        </span>
        <input
          type="color"
          value={appearance[mode][field]}
          onChange={(event) =>
            updatePalette(mode, { [field]: event.target.value })
          }
          className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent p-0"
          aria-label={`${label} ${mode}`}
        />
      </span>
    </label>
  );
}

function PaletteEditor({
  mode,
  icon,
  title,
}: {
  mode: AppearanceMode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>
          Bộ màu này được áp khi người dùng chọn {mode} mode.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        {colorFields.map((field) => (
          <ColorInput
            key={`${mode}-${field.key}`}
            mode={mode}
            field={field.key}
            label={field.label}
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function AppearanceSettings() {
  const { appearance, updateAppearance, resetAppearance } = useAppearance();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            <Badge variant="secondary">Static UI + local preview</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tuỳ chỉnh giao diện
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Màn này định nghĩa bộ setting chuẩn cho UX/UI chat realtime. Hiện
            tại lưu localStorage; backend có thể dùng cùng schema ở phần bên
            dưới để đồng bộ theo user/workspace.
          </p>
        </div>
        <Button variant="outline" onClick={resetAppearance} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Khôi phục mặc định
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Type className="h-4 w-4 text-primary" />
                Typography & density
              </CardTitle>
              <CardDescription>
                Đồng bộ font chữ, cỡ chữ và độ bo góc toàn ứng dụng.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Font chữ</Label>
                <select
                  value={appearance.fontFamily}
                  onChange={(event) =>
                    updateAppearance({ fontFamily: event.target.value })
                  }
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.label} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Cỡ chữ</Label>
                  <span className="text-xs text-muted-foreground">
                    {appearance.fontScale}%
                  </span>
                </div>
                <Slider
                  min={90}
                  max={115}
                  step={1}
                  value={[appearance.fontScale]}
                  onValueChange={([value]) =>
                    updateAppearance({ fontScale: value })
                  }
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between">
                  <Label>Bo góc</Label>
                  <span className="text-xs text-muted-foreground">
                    {appearance.radius}px
                  </span>
                </div>
                <Slider
                  min={4}
                  max={16}
                  step={1}
                  value={[appearance.radius]}
                  onValueChange={([value]) => updateAppearance({ radius: value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Độ đậm border</CardTitle>
              <CardDescription>
                Tác động đến card, input, sidebar, modal và message border.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={appearance.borderContrast}
                onValueChange={(value) =>
                  updateAppearance({
                    borderContrast: value as BorderContrast,
                  })
                }
                className="grid gap-3 md:grid-cols-3"
              >
                {(["soft", "normal", "strong"] as const).map((value) => (
                  <label
                    key={value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border border-border bg-background p-3",
                      appearance.borderContrast === value && "border-primary"
                    )}
                  >
                    <RadioGroupItem value={value} />
                    <span className="text-sm capitalize">{value}</span>
                  </label>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <PaletteEditor
              mode="light"
              title="Light palette"
              icon={<Sun className="h-4 w-4 text-amber-500" />}
            />
            <PaletteEditor
              mode="dark"
              title="Dark palette"
              icon={<Moon className="h-4 w-4 text-sky-500" />}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4 text-primary" />
                Backend follow schema
              </CardTitle>
              <CardDescription>
                Các setting cần có để backend triển khai lưu theo user hoặc
                workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Key</th>
                    <th className="py-2 pr-4 font-medium">Type</th>
                    <th className="py-2 font-medium">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {backendSettings.map((setting) => (
                    <tr key={setting.key} className="border-b border-border/70">
                      <td className="py-3 pr-4 font-mono text-xs">
                        {setting.key}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {setting.type}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {setting.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="grid content-start gap-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4 text-primary" />
                Chat preview
              </CardTitle>
              <CardDescription>
                Preview dùng cùng token với message thật trong app.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border bg-background p-4">
                <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <div className="text-sm font-semibold">#dev-team</div>
                    <div className="text-xs text-muted-foreground">
                      12 online
                    </div>
                  </div>
                  <Badge>Realtime</Badge>
                </div>
                <div className="space-y-3">
                  <div className="max-w-[78%] rounded-lg rounded-tl-sm border border-border chat-bubble-incoming px-3 py-2 text-sm shadow-sm">
                    Backend đã nhận event typing, cần thêm user preference API.
                  </div>
                  <div className="ml-auto max-w-[78%] rounded-lg rounded-tr-sm chat-bubble-outgoing px-3 py-2 text-sm shadow-sm">
                    OK, UI đã có schema để follow.
                  </div>
                  <div className="max-w-[78%] rounded-lg rounded-tl-sm border border-border chat-bubble-incoming px-3 py-2 text-sm shadow-sm">
                    Màu bubble đổi ngay theo setting.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Setting roadmap
              </CardTitle>
              <CardDescription>
                Giao diện tĩnh cho các chức năng backend nên bổ sung.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {plannedSettings.map((item) => (
                <div
                  key={item}
                  className="rounded-md border border-border bg-background p-3 text-sm"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
