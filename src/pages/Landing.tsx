import {
  ArrowRight,
  Bell,
  Code2,
  Github,
  LockKeyhole,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  Search,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import heroImage from "@/assets/image/background.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Chat realtime theo channel",
    description:
      "Tin nhắn, reply, pin, like và trạng thái gửi được tối ưu cho team dev làm việc liên tục.",
  },
  {
    icon: <Code2 className="h-5 w-5" />,
    title: "Chia sẻ code và tool",
    description:
      "Preview code, attachment, form BA/tester và API tool nằm ngay trong luồng hội thoại.",
  },
  {
    icon: <Github className="h-5 w-5" />,
    title: "GitHub integration",
    description:
      "Kết nối repo, sự kiện GitHub và thông báo để team không bỏ lỡ thay đổi quan trọng.",
  },
  {
    icon: <Bell className="h-5 w-5" />,
    title: "Notification workflow",
    description:
      "Thông báo hệ thống, mention và điều hướng về đúng channel hoặc message liên quan.",
  },
] as const;

const workflows = [
  "Tạo channel theo team, dự án hoặc incident",
  "Trao đổi requirement, log, file và code snippet",
  "Theo dõi GitHub event và xử lý ngay trong app",
  "Tùy chỉnh giao diện theo workspace hoặc cá nhân",
] as const;

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/82 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link to="/landing" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <MessageSquare className="h-4 w-4" />
            </span>
            CodeSync Chat
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">
              Tính năng
            </a>
            <a href="#workflow" className="hover:text-foreground">
              Workflow
            </a>
            <a href="#settings" className="hover:text-foreground">
              Tuỳ chỉnh
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle
              tooltipSide="bottom"
              className="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            />
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link to="/auth">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">
                Bắt đầu
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[92svh] overflow-hidden pt-14">
          <img
            src={heroImage}
            alt="CodeSync Chat realtime workspace"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-background/78 dark:bg-background/84" />
          <div className="relative mx-auto grid min-h-[calc(92svh-3.5rem)] max-w-7xl content-center gap-8 px-4 py-16 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.72fr)] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-sm text-muted-foreground">
                <Zap className="h-4 w-4 text-primary" />
                Realtime chat cho đội ngũ phát triển phần mềm
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
                CodeSync Chat
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Không gian trao đổi realtime cho developer, BA, tester và quản
                trị dự án: chat theo channel, chia sẻ code, đồng bộ GitHub,
                attachment và thông báo trong một luồng làm việc thống nhất.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/auth">
                    Dùng thử ngay
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/settings">Xem tuỳ chỉnh giao diện</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card text-card-foreground shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <div className="text-sm font-semibold">#release-room</div>
                  <div className="text-xs text-muted-foreground">
                    8 thành viên online
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Live
                </span>
              </div>
              <div className="space-y-3 p-4">
                <div className="max-w-[82%] rounded-lg rounded-tl-sm border border-border chat-bubble-incoming px-3 py-2 text-sm">
                  API deploy xong, cần test regression trên auth flow.
                </div>
                <div className="ml-auto max-w-[82%] rounded-lg rounded-tr-sm chat-bubble-outgoing px-3 py-2 text-sm">
                  Mình ghim checklist và gửi link PR ở đây.
                </div>
                <div className="rounded-md border border-border bg-background p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Github className="h-4 w-4 text-primary" />
                    GitHub event
                  </div>
                  <p className="text-xs text-muted-foreground">
                    feat(auth): improve captcha validation
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  Tìm message, file, PR hoặc channel...
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-semibold tracking-tight">
                Một workspace cho giao tiếp kỹ thuật
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Thiết kế tập trung vào tốc độ xử lý thông tin, khả năng quét
                nhanh và workflow lặp lại mỗi ngày của team dev.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-t border-border bg-muted/35 py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 lg:grid-cols-[0.8fr_1fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Workflow rõ ràng từ trao đổi đến hành động
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Chat không chỉ là tin nhắn. Ứng dụng gom channel, code,
                attachment, notification và tool vào cùng một trải nghiệm.
              </p>
            </div>
            <div className="grid gap-3">
              {workflows.map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="settings" className="border-t border-border py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-semibold tracking-tight">
                Tuỳ chỉnh giao diện theo cách team làm việc
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Bộ setting mới cho phép backend lưu preference theo user hoặc
                workspace: font, cỡ chữ, border, màu nền và màu tin nhắn.
              </p>
            </div>
            <div className="grid gap-4 lg:col-span-2 md:grid-cols-2">
              {[
                {
                  icon: <Palette className="h-5 w-5" />,
                  title: "Theme tokens",
                  text: "Light/dark mode dùng chung CSS variables để component đồng bộ.",
                },
                {
                  icon: <MonitorSmartphone className="h-5 w-5" />,
                  title: "Responsive controls",
                  text: "Setting UI tĩnh đã có preview để backend follow thêm API.",
                },
                {
                  icon: <LockKeyhole className="h-5 w-5" />,
                  title: "Workspace governance",
                  text: "Có thể mở rộng thành brand preset và quyền admin khóa màu.",
                },
                {
                  icon: <Users className="h-5 w-5" />,
                  title: "User preference",
                  text: "Lưu lựa chọn cá nhân và đồng bộ khi đăng nhập nhiều thiết bị.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-lg border border-border bg-card p-5"
                >
                  <div className="mb-3 text-primary">{item.icon}</div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-primary py-12 text-primary-foreground">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 md:flex-row md:items-center">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm opacity-90">
                <Sparkles className="h-4 w-4" />
                Built for realtime development teams
              </div>
              <h2 className="text-2xl font-semibold">Sẵn sàng bắt đầu?</h2>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link to="/auth">
                Vào ứng dụng
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
