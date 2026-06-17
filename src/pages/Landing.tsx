import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  Code2,
  FileCode2,
  Github,
  Hash,
  Layers3,
  LockKeyhole,
  MessageCircle,
  MessageSquare,
  MonitorSmartphone,
  Palette,
  PlayCircle,
  PlugZap,
  Rocket,
  Server,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Language = "vi" | "en";

type LandingCopy = {
  nav: Array<{ href: string; label: string }>;
  hero: {
    badge: string;
    titleTop: string;
    titleBottom: string;
    subtitle: string;
    primary: string;
    secondary: string;
    proof: string;
    stats: Array<{ value: string; label: string }>;
    sideCards: Array<{ kicker: string; text: string }>;
  };
  chat: {
    room: string;
    online: string;
    firstMessage: string;
    secondMessage: string;
    event: string;
    commit: string;
  };
  proof: {
    title: string;
    logos: string[];
    stats: Array<{ value: string; label: string; desc: string }>;
  };
  features: {
    kicker: string;
    title: string;
    description: string;
    items: Array<{ title: string; description: string; tag: string }>;
  };
  workflow: {
    kicker: string;
    title: string;
    description: string;
    steps: Array<{ title: string; description: string }>;
  };
  preview: {
    kicker: string;
    title: string;
    description: string;
    cards: Array<{ title: string; description: string }>;
  };
  integrations: {
    kicker: string;
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  ai: {
    kicker: string;
    title: string;
    description: string;
    bullets: string[];
  };
  security: {
    kicker: string;
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  settings: {
    kicker: string;
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  testimonials: {
    kicker: string;
    title: string;
    items: Array<{ quote: string; name: string; role: string }>;
  };
  cta: {
    title: string;
    description: string;
    primary: string;
    secondary: string;
  };
  footer: {
    description: string;
    columns: Array<{ title: string; links: string[] }>;
  };
};

const COPY: Record<Language, LandingCopy> = {
  vi: {
    nav: [
      { href: "#features", label: "Tính năng" },
      { href: "#workflow", label: "Workflow" },
      { href: "#preview", label: "Giao diện" },
      { href: "#security", label: "Bảo mật" },
    ],
    hero: {
      badge: "Realtime workspace cho đội ngũ kỹ thuật",
      titleTop: "Một không gian chat",
      titleBottom: "để giao tiếp nhanh hơn",
      subtitle:
        "CodeSync Chat gom hội thoại, code sharing, GitHub sync, task tracking và thông báo vào một trải nghiệm hiện đại, tối ưu cho mọi kích thước màn hình.",
      primary: "Dùng thử ngay",
      secondary: "Xem giao diện",
      proof: "dev team đang phối hợp hằng ngày",
      stats: [
        { value: "500+", label: "Developers" },
        { value: "50+", label: "Teams" },
        { value: "99.9%", label: "Uptime" },
      ],
      sideCards: [
        {
          kicker: "Realtime Sync",
          text: "Tin nhắn, file và GitHub events cập nhật tức thời.",
        },
        {
          kicker: "Mobile Optimized",
          text: "Giao diện mượt mà trên cả mobile và desktop.",
        },
      ],
    },
    chat: {
      room: "release-room",
      online: "8 thành viên online",
      firstMessage: "API deploy xong, cần test regression trên auth flow.",
      secondMessage: "Mình ghim checklist và gửi link PR ở đây.",
      event: "GitHub push — main",
      commit: "feat(auth): improve captcha validation",
    },
    proof: {
      title: "Được thiết kế cho những team cần tốc độ, rõ ràng và ít nhiễu.",
      logos: ["NOVA DEV", "BUILDLY", "STACKHUB", "APIKIT", "FLOWBASE"],
      stats: [
        {
          value: "2.4x",
          label: "Nhanh hơn",
          desc: "Giảm thời gian tìm lại context trong hội thoại.",
        },
        {
          value: "38%",
          label: "Ít meeting hơn",
          desc: "Checklist và update được gom ngay trong channel.",
        },
        {
          value: "24/7",
          label: "Theo dõi liên tục",
          desc: "Thông báo quan trọng không bị trôi khỏi workflow.",
        },
      ],
    },
    features: {
      kicker: "// TÍNH NĂNG",
      title: "Workspace tối ưu cho dev",
      description:
        "Thiết kế tập trung vào tốc độ xử lý thông tin và workflow lặp lại mỗi ngày của team dev.",
      items: [
        {
          title: "Chat realtime",
          description:
            "Tin nhắn, reply, pin, mention và trạng thái online tối ưu cho team làm việc liên tục.",
          tag: "Realtime",
        },
        {
          title: "Code & Tool",
          description:
            "Preview code, file, API note và checklist nằm ngay trong hội thoại.",
          tag: "Developer",
        },
        {
          title: "GitHub Sync",
          description:
            "Kết nối repo, pull request, commit và release note ngay trong channel.",
          tag: "Git",
        },
        {
          title: "Smart Notification",
          description:
            "Thông báo thông minh, điều hướng đúng channel, tránh spam toàn hệ thống.",
          tag: "Focus",
        },
        {
          title: "Task Context",
          description:
            "Biến tin nhắn thành task, gắn người phụ trách và theo dõi tiến độ.",
          tag: "Workflow",
        },
        {
          title: "Responsive UI",
          description:
            "Layout tối ưu từ desktop tới mobile, phù hợp team làm việc mọi nơi.",
          tag: "UX/UI",
        },
      ],
    },
    workflow: {
      kicker: "// WORKFLOW",
      title: "Từ tin nhắn đến hành động rõ ràng",
      description:
        "Mỗi đoạn chat đều có thể trở thành checklist, task, tài liệu hoặc tín hiệu để team xử lý nhanh hơn.",
      steps: [
        {
          title: "Tạo channel theo dự án",
          description:
            "Gom team, chủ đề, file, API và task liên quan vào đúng không gian làm việc.",
        },
        {
          title: "Thảo luận và ghim context",
          description:
            "Pin quyết định quan trọng, checklist hoặc link PR để người vào sau vẫn nắm được.",
        },
        {
          title: "Đồng bộ GitHub",
          description:
            "Commit, pull request, merge và release được đẩy vào channel tương ứng.",
        },
        {
          title: "Theo dõi và hoàn tất",
          description:
            "Thông báo, deadline và trạng thái giúp team biết việc nào đang chờ xử lý.",
        },
      ],
    },
    preview: {
      kicker: "// PRODUCT PREVIEW",
      title: "Giao diện rõ ràng, hiện đại, có chiều sâu",
      description:
        "Landing page nên cho người xem hình dung sản phẩm thật: chat, code, task, thông báo và dashboard đều xuất hiện trong cùng một trải nghiệm.",
      cards: [
        {
          title: "Dashboard tổng quan",
          description:
            "Xem channel, hoạt động mới, task đang mở và trạng thái deploy ở một nơi.",
        },
        {
          title: "Chat tập trung",
          description:
            "Tin nhắn ngắn gọn, dễ đọc, có avatar, label, trạng thái và file đính kèm.",
        },
        {
          title: "Code preview",
          description:
            "Đọc nhanh snippet, lỗi, commit hoặc hướng dẫn xử lý ngay trong màn hình chat.",
        },
      ],
    },
    integrations: {
      kicker: "// INTEGRATIONS",
      title: "Kết nối với công cụ team đang dùng",
      description:
        "Không bắt team đổi toàn bộ quy trình. CodeSync đóng vai trò trung tâm để gom tín hiệu quan trọng về một nơi.",
      items: [
        {
          title: "GitHub",
          description:
            "Theo dõi commit, pull request, issue, release và trạng thái merge.",
        },
        {
          title: "Webhook API",
          description:
            "Đẩy sự kiện từ hệ thống riêng của doanh nghiệp vào channel.",
        },
        {
          title: "CI/CD",
          description:
            "Nhận kết quả build, test, deploy và cảnh báo lỗi sau mỗi pipeline.",
        },
        {
          title: "Internal Tools",
          description:
            "Gắn công cụ nội bộ như CRM, task board, log viewer hoặc monitoring.",
        },
      ],
    },
    ai: {
      kicker: "// AI ASSISTANT",
      title: "Trợ lý AI cho đội ngũ lập trình",
      description:
        "Tích hợp AI để tóm tắt hội thoại, giải thích lỗi, tạo checklist và gợi ý phản hồi kỹ thuật nhanh hơn.",
      bullets: [
        "Tóm tắt đoạn chat dài thành action items.",
        "Giải thích lỗi build, API, database hoặc Docker.",
        "Viết nháp tài liệu, changelog và release note.",
        "Gợi ý checklist review trước khi merge code.",
      ],
    },
    security: {
      kicker: "// SECURITY",
      title: "Bảo mật đủ tốt để dùng trong môi trường doanh nghiệp",
      description:
        "Quản lý quyền, khóa channel, audit log và cấu hình truy cập giúp doanh nghiệp yên tâm khi đưa vào sử dụng thật.",
      items: [
        {
          title: "Role-based Access",
          description:
            "Phân quyền owner, admin, member, guest theo từng workspace và channel.",
        },
        {
          title: "Private Channel",
          description:
            "Khóa channel nhạy cảm cho dự án, khách hàng hoặc dữ liệu nội bộ.",
        },
        {
          title: "Audit Log",
          description:
            "Theo dõi hoạt động quan trọng như đăng nhập, chỉnh quyền, xóa dữ liệu.",
        },
      ],
    },
    settings: {
      kicker: "// CUSTOMIZE",
      title: "Tuỳ chỉnh theo cách team làm việc",
      description:
        "Mỗi team có quy trình khác nhau. CodeSync có thể mở rộng theo module để phù hợp startup, agency hoặc team sản phẩm.",
      items: [
        {
          title: "Module linh hoạt",
          description:
            "Bật/tắt GitHub sync, task, notification, AI assistant hoặc report theo nhu cầu.",
        },
        {
          title: "Branding riêng",
          description:
            "Tuỳ chỉnh logo, màu thương hiệu, tên workspace và trải nghiệm onboarding.",
        },
        {
          title: "Giao diện responsive",
          description:
            "Tối ưu cho mobile, tablet và desktop để team phản hồi mọi lúc.",
        },
      ],
    },
    testimonials: {
      kicker: "// FEEDBACK",
      title: "Ấn tượng đầu tiên quan trọng",
      items: [
        {
          quote:
            "Landing page giúp mình hiểu sản phẩm trong vài giây: chat, code, task và GitHub đều liên kết rõ ràng.",
          name: "Minh Anh",
          role: "Frontend Developer",
        },
        {
          quote:
            "Các block có chiều sâu, nhìn giống một sản phẩm SaaS thật chứ không chỉ là trang giới thiệu đơn giản.",
          name: "Hoàng Phúc",
          role: "Product Designer",
        },
        {
          quote:
            "Phần workflow và security làm sản phẩm đáng tin hơn khi demo cho nhà tuyển dụng hoặc khách hàng.",
          name: "Gia Huy",
          role: "Fullstack Developer",
        },
      ],
    },
    cta: {
      title: "Sẵn sàng biến chat app thành sản phẩm chuyên nghiệp?",
      description:
        "Dùng landing page này để demo cho nhà tuyển dụng, khách hàng hoặc làm nền tảng marketing cho sản phẩm SaaS của bạn.",
      primary: "Bắt đầu demo",
      secondary: "Xem workflow",
    },
    footer: {
      description:
        "CodeSync Chat là realtime workspace dành cho team kỹ thuật: chat, code, GitHub, task và AI assistant trong một trải nghiệm hiện đại.",
      columns: [
        {
          title: "Sản phẩm",
          links: ["Tính năng", "Workflow", "AI Assistant", "Integrations"],
        },
        {
          title: "Công ty",
          links: ["Giới thiệu", "Khách hàng", "Blog", "Tuyển dụng"],
        },
        {
          title: "Tài nguyên",
          links: ["Tài liệu", "API Docs", "Security", "Status"],
        },
      ],
    },
  },
  en: {
    nav: [
      { href: "#features", label: "Features" },
      { href: "#workflow", label: "Workflow" },
      { href: "#preview", label: "Preview" },
      { href: "#security", label: "Security" },
    ],
    hero: {
      badge: "Realtime workspace for engineering teams",
      titleTop: "A chat space",
      titleBottom: "that helps teams ship faster",
      subtitle:
        "CodeSync Chat brings conversations, code sharing, GitHub sync, task tracking, and notifications into a modern experience optimized for every screen size.",
      primary: "Try it now",
      secondary: "View preview",
      proof: "dev teams coordinate every day",
      stats: [
        { value: "500+", label: "Developers" },
        { value: "50+", label: "Teams" },
        { value: "99.9%", label: "Uptime" },
      ],
      sideCards: [
        {
          kicker: "Realtime Sync",
          text: "Messages, files, and GitHub events update instantly.",
        },
        {
          kicker: "Mobile Optimized",
          text: "Smooth experience across mobile and desktop.",
        },
      ],
    },
    chat: {
      room: "release-room",
      online: "8 members online",
      firstMessage: "Deployment is done. We need regression testing on auth flow.",
      secondMessage: "I pinned the checklist and sent the PR link here.",
      event: "GitHub push — main",
      commit: "feat(auth): improve captcha validation",
    },
    proof: {
      title: "Designed for teams that need speed, clarity, and less noise.",
      logos: ["NOVA DEV", "BUILDLY", "STACKHUB", "APIKIT", "FLOWBASE"],
      stats: [
        {
          value: "2.4x",
          label: "Faster",
          desc: "Reduce time spent searching for lost context.",
        },
        {
          value: "38%",
          label: "Fewer meetings",
          desc: "Updates and checklists stay inside the channel.",
        },
        {
          value: "24/7",
          label: "Always tracked",
          desc: "Critical signals do not disappear from the workflow.",
        },
      ],
    },
    features: {
      kicker: "// FEATURES",
      title: "A workspace built for developers",
      description:
        "Designed to reduce friction in the daily information flow of development teams.",
      items: [
        {
          title: "Realtime Chat",
          description:
            "Messages, replies, pins, mentions, and online status for fast-moving teams.",
          tag: "Realtime",
        },
        {
          title: "Code & Tools",
          description:
            "Code previews, files, API notes, and checklists inside the conversation.",
          tag: "Developer",
        },
        {
          title: "GitHub Sync",
          description:
            "Connect repos, pull requests, commits, and release notes directly to channels.",
          tag: "Git",
        },
        {
          title: "Smart Notifications",
          description:
            "System alerts route to the right channel without spamming everyone.",
          tag: "Focus",
        },
        {
          title: "Task Context",
          description:
            "Turn messages into tasks, assign owners, and track progress.",
          tag: "Workflow",
        },
        {
          title: "Responsive UI",
          description:
            "A polished layout from desktop to mobile for distributed teams.",
          tag: "UX/UI",
        },
      ],
    },
    workflow: {
      kicker: "// WORKFLOW",
      title: "From messages to clear actions",
      description:
        "Every chat can become a checklist, task, document, or signal that helps the team move faster.",
      steps: [
        {
          title: "Create project channels",
          description:
            "Keep teams, topics, files, APIs, and tasks in the right workspace.",
        },
        {
          title: "Discuss and pin context",
          description:
            "Pin important decisions, checklists, or PR links so late joiners understand quickly.",
        },
        {
          title: "Sync GitHub activity",
          description:
            "Commits, pull requests, merges, and releases flow into the right channel.",
        },
        {
          title: "Track and complete",
          description:
            "Notifications, deadlines, and statuses show what needs attention.",
        },
      ],
    },
    preview: {
      kicker: "// PRODUCT PREVIEW",
      title: "A clean, modern interface with depth",
      description:
        "The landing page should help visitors imagine the real product: chat, code, tasks, notifications, and dashboard in one experience.",
      cards: [
        {
          title: "Overview dashboard",
          description:
            "See channels, recent activity, open tasks, and deployment status in one place.",
        },
        {
          title: "Focused chat",
          description:
            "Readable messages with avatars, labels, status, and attachments.",
        },
        {
          title: "Code preview",
          description:
            "Review snippets, errors, commits, or technical notes inside the chat screen.",
        },
      ],
    },
    integrations: {
      kicker: "// INTEGRATIONS",
      title: "Connect with the tools your team already uses",
      description:
        "CodeSync does not force teams to replace everything. It centralizes important signals into one place.",
      items: [
        {
          title: "GitHub",
          description:
            "Track commits, pull requests, issues, releases, and merge status.",
        },
        {
          title: "Webhook API",
          description:
            "Push events from internal business systems into channels.",
        },
        {
          title: "CI/CD",
          description:
            "Receive build, test, deployment, and failure alerts after every pipeline.",
        },
        {
          title: "Internal Tools",
          description:
            "Connect CRM, task boards, log viewers, or monitoring systems.",
        },
      ],
    },
    ai: {
      kicker: "// AI ASSISTANT",
      title: "AI assistant for engineering teams",
      description:
        "Use AI to summarize chats, explain errors, create checklists, and draft technical responses faster.",
      bullets: [
        "Summarize long threads into action items.",
        "Explain build, API, database, or Docker errors.",
        "Draft documentation, changelogs, and release notes.",
        "Suggest review checklists before merging code.",
      ],
    },
    security: {
      kicker: "// SECURITY",
      title: "Secure enough for business workflows",
      description:
        "Roles, private channels, audit logs, and access control help companies adopt the product with confidence.",
      items: [
        {
          title: "Role-based Access",
          description:
            "Control owner, admin, member, and guest permissions per workspace and channel.",
        },
        {
          title: "Private Channel",
          description:
            "Protect sensitive channels for projects, clients, or internal data.",
        },
        {
          title: "Audit Log",
          description:
            "Track important events like sign-ins, permission changes, and deleted data.",
        },
      ],
    },
    settings: {
      kicker: "// CUSTOMIZE",
      title: "Adapt it to how your team works",
      description:
        "Every team has a different process. CodeSync can scale through modules for startups, agencies, or product teams.",
      items: [
        {
          title: "Flexible modules",
          description:
            "Enable GitHub sync, tasks, notifications, AI assistant, or reports as needed.",
        },
        {
          title: "Custom branding",
          description:
            "Customize logo, brand color, workspace name, and onboarding flow.",
        },
        {
          title: "Responsive experience",
          description:
            "Optimized for mobile, tablet, and desktop so teams can reply anywhere.",
        },
      ],
    },
    testimonials: {
      kicker: "// FEEDBACK",
      title: "First impression matters",
      items: [
        {
          quote:
            "The page explains the product in seconds: chat, code, tasks, and GitHub are clearly connected.",
          name: "Minh Anh",
          role: "Frontend Developer",
        },
        {
          quote:
            "The visual blocks make it feel like a real SaaS product, not just a simple landing page.",
          name: "Hoang Phuc",
          role: "Product Designer",
        },
        {
          quote:
            "The workflow and security sections make the product more trustworthy for demos.",
          name: "Gia Huy",
          role: "Fullstack Developer",
        },
      ],
    },
    cta: {
      title: "Ready to turn your chat app into a polished product?",
      description:
        "Use this landing page to demo to recruiters, clients, or as a marketing base for your SaaS product.",
      primary: "Start demo",
      secondary: "View workflow",
    },
    footer: {
      description:
        "CodeSync Chat is a realtime workspace for engineering teams: chat, code, GitHub, tasks, and AI assistant in one modern experience.",
      columns: [
        {
          title: "Product",
          links: ["Features", "Workflow", "AI Assistant", "Integrations"],
        },
        {
          title: "Company",
          links: ["About", "Customers", "Blog", "Careers"],
        },
        {
          title: "Resources",
          links: ["Docs", "API Docs", "Security", "Status"],
        },
      ],
    },
  },
};

const featureIcons = [MessageSquare, Code2, Github, Bell, Workflow, MonitorSmartphone];
const integrationIcons = [Github, PlugZap, Server, Layers3];
const securityIcons = [ShieldCheck, LockKeyhole, Terminal];
const settingIcons = [Zap, Palette, MonitorSmartphone];

export default function Landing() {
  const [lang, setLang] = useState<Language>("vi");
  const copy = COPY[lang];
  const navigate = useNavigate()

  const onClickCTA = () => {
    navigate("/auth")
  }

  return (
    <div className="landing-page min-h-screen overflow-hidden bg-slate-50 text-slate-950 selection:bg-blue-200">
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-14px); }
          }

          @keyframes floatReverse {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(12px) rotate(1deg); }
          }

          @keyframes pulseGlow {
            0%, 100% { opacity: .45; transform: scale(1); }
            50% { opacity: .8; transform: scale(1.08); }
          }

          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }

          .float-slow {
            animation: float 5s ease-in-out infinite;
          }

          .float-reverse {
            animation: floatReverse 6s ease-in-out infinite;
          }

          .pulse-glow {
            animation: pulseGlow 4s ease-in-out infinite;
          }

          .marquee {
            animation: marquee 24s linear infinite;
          }
        `}
      </style>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a href="#home" className="flex items-center gap-2 font-bold text-blue-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <MessageCircle size={19} />
            </span>
            <span className="tracking-tight">CodeSync</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            {copy.nav.map((item) => (
              <a key={item.label} href={item.href} className="transition hover:text-blue-600">
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === "en" ? "vi" : "en")}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            >
              {lang.toUpperCase()}
            </button>

            <a
              onClick={onClickCTA}
              className="hidden rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 sm:inline-flex"
            >
              {lang === "en" ? "Get started" : "Bắt đầu"}
            </a>
          </div>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section id="home" className="relative px-5 py-20 sm:px-6 lg:px-8 lg:py-24">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:26px_26px] opacity-[0.06]" />
        <div className="absolute left-1/2 top-16 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-300/40 blur-3xl pulse-glow" />
        <div className="absolute right-0 top-52 -z-10 h-80 w-80 rounded-full bg-cyan-200/50 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
              <Sparkles size={16} />
              {copy.hero.badge}
            </div>

            <h1 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-slate-950 sm:text-6xl lg:text-7xl">
              {copy.hero.titleTop}{" "}
              <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 bg-clip-text text-transparent">
                {copy.hero.titleBottom}
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {copy.hero.subtitle}
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a
                onClick={onClickCTA}
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-4 text-sm font-bold text-white shadow-xl shadow-blue-200 transition hover:-translate-y-1 hover:bg-blue-700"
              >
                {copy.hero.primary}
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </a>

              <a
                href="#preview"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:text-blue-600"
              >
                <PlayCircle size={18} />
                {copy.hero.secondary}
              </a>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {copy.hero.stats.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-2xl font-black text-slate-950">{stat.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex -space-x-2">
                {["A", "B", "C", "D"].map((avatar, index) => (
                  <div
                    key={avatar}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-blue-100 to-cyan-100 text-xs font-black text-blue-700"
                    style={{ zIndex: 10 - index }}
                  >
                    {avatar}
                  </div>
                ))}
              </div>
              <span>{copy.hero.proof}</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-10 hidden w-48 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200 float-slow lg:block">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {copy.hero.sideCards[0].kicker}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.hero.sideCards[0].text}
              </p>
            </div>

            <div className="absolute -right-4 bottom-10 hidden w-52 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200 float-reverse lg:block">
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-600">
                {copy.hero.sideCards[1].kicker}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {copy.hero.sideCards[1].text}
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-2xl shadow-blue-100">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-100 bg-slate-950">
                <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-5 py-4">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-auto rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    Live
                  </span>
                </div>

                <div className="grid md:grid-cols-[.9fr_1.1fr]">
                  <div className="border-b border-white/10 bg-slate-900/80 p-5 md:border-b-0 md:border-r">
                    <div className="flex items-center gap-2 text-white">
                      <Hash size={18} className="text-blue-300" />
                      <span className="font-bold">{copy.chat.room}</span>
                    </div>
                    <div className="mt-2 text-xs text-emerald-300">● {copy.chat.online}</div>

                    <div className="mt-6 space-y-4">
                      <div className="flex gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-400" />
                        <div className="max-w-[82%] rounded-2xl rounded-tl-none bg-white/10 p-3 text-sm leading-6 text-slate-200">
                          {copy.chat.firstMessage}
                        </div>
                      </div>

                      <div className="flex flex-row-reverse gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300" />
                        <div className="max-w-[82%] rounded-2xl rounded-tr-none bg-blue-600 p-3 text-sm leading-6 text-white">
                          {copy.chat.secondMessage}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-200">
                          <Github size={16} />
                          {copy.chat.event}
                        </div>
                        <div className="mt-2 rounded-xl bg-slate-950/80 p-3 font-mono text-xs text-cyan-200">
                          {copy.chat.commit}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-white">auth.service.ts</div>
                        <div className="text-xs text-slate-500">updated 2 minutes ago</div>
                      </div>
                      <Code2 size={20} className="text-blue-300" />
                    </div>

                    <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-mono text-xs leading-6 text-slate-300">
                      <p><span className="text-slate-500">01</span> <span className="text-purple-300">async</span> validateUser()</p>
                      <p><span className="text-slate-500">02</span> <span className="text-blue-300">await</span> captcha.verify(token)</p>
                      <p><span className="text-slate-500">03</span> <span className="text-emerald-300">return</span> userSession</p>
                      <p><span className="text-slate-500">04</span> notify.channel(<span className="text-yellow-200">"release-room"</span>)</p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white/[0.04] p-4">
                        <div className="text-2xl font-black text-white">14</div>
                        <div className="text-xs text-slate-400">Open tasks</div>
                      </div>
                      <div className="rounded-2xl bg-white/[0.04] p-4">
                        <div className="text-2xl font-black text-emerald-300">98%</div>
                        <div className="text-xs text-slate-400">Tests passed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Proof */}
      <section className="border-y border-slate-200 bg-white px-5 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mx-auto max-w-3xl text-center text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
            {copy.proof.title}
          </p>

          <div className="relative mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 py-5">
            <div className="marquee flex w-[200%] gap-4">
              {[...copy.proof.logos, ...copy.proof.logos].map((logo, index) => (
                <div
                  key={`${logo}-${index}`}
                  className="flex min-w-48 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black tracking-widest text-slate-400"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {copy.proof.stats.map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="text-4xl font-black text-blue-600">{stat.value}</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{stat.label}</div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Features */}
      <section id="features" className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-mono text-sm font-black text-blue-600">{copy.features.kicker}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {copy.features.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.features.description}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {copy.features.items.map((item, index) => {
              const Icon = featureIcons[index % featureIcons.length];

              return (
                <div
                  key={item.title}
                  className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-100"
                >
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                      <Icon size={24} />
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Workflow */}
      <section id="workflow" className="bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="font-mono text-sm font-black text-blue-600">{copy.workflow.kicker}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {copy.workflow.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.workflow.description}</p>

            <div className="mt-10 space-y-5">
              {copy.workflow.steps.map((step, index) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200">
                      {index + 1}
                    </div>
                    {index !== copy.workflow.steps.length - 1 && (
                      <div className="mt-2 h-full w-px bg-slate-200" />
                    )}
                  </div>

                  <div className="pb-6">
                    <h3 className="font-black text-slate-950">{step.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-4 shadow-xl shadow-slate-200/70">
            <div className="rounded-[1.5rem] bg-white p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-slate-900">Sprint Board</div>
                  <div className="text-xs text-slate-500">Release v1.8 tracking</div>
                </div>
                <Workflow className="text-blue-600" size={24} />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {["Backlog", "In progress", "Done"].map((column, columnIndex) => (
                  <div key={column} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm font-black text-slate-800">{column}</span>
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-500">
                        {columnIndex + 2}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {[
                        "Auth regression test",
                        "GitHub webhook event",
                        "Mobile chat spacing",
                        "Notification routing",
                        "Release note draft",
                        "Security audit log",
                      ]
                        .slice(columnIndex * 2, columnIndex * 2 + 2)
                        .map((task, taskIndex) => (
                          <div key={task} className="rounded-2xl bg-white p-4 shadow-sm">
                            <div className="mb-3 h-2 w-16 rounded-full bg-blue-100" />
                            <div className="text-sm font-bold text-slate-800">{task}</div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex -space-x-2">
                                <span className="h-6 w-6 rounded-full border-2 border-white bg-blue-200" />
                                <span className="h-6 w-6 rounded-full border-2 border-white bg-cyan-200" />
                              </div>
                              <span className="text-xs font-bold text-slate-400">
                                #{columnIndex + 1}{taskIndex + 4}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Product Preview */}
      <section id="preview" className="relative bg-slate-950 px-5 py-20 text-white sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.08]" />
        <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <p className="font-mono text-sm font-black text-cyan-300">{copy.preview.kicker}</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
                {copy.preview.title}
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">{copy.preview.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {copy.preview.cards.map((card) => (
                <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
                  <h3 className="font-black text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{card.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl shadow-blue-950/80">
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-900">
              <div className="grid lg:grid-cols-[250px_1fr_330px]">
                <aside className="border-b border-white/10 bg-white/[0.03] p-5 lg:border-b-0 lg:border-r">
                  <div className="mb-6 flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl bg-blue-500" />
                    <div>
                      <div className="font-black">Workspace</div>
                      <div className="text-xs text-slate-400">Product Team</div>
                    </div>
                  </div>

                  {["general", "release-room", "bug-fix", "api-team"].map((channel, index) => (
                    <div
                      key={channel}
                      className={`mb-2 flex items-center gap-2 rounded-2xl px-3 py-3 text-sm ${index === 1 ? "bg-blue-500 text-white" : "text-slate-300 hover:bg-white/5"
                        }`}
                    >
                      <Hash size={16} />
                      {channel}
                    </div>
                  ))}
                </aside>

                <main className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <div className="font-black"># release-room</div>
                      <div className="text-xs text-slate-400">Deploy, QA, changelog and fixes</div>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                      8 online
                    </span>
                  </div>

                  <div className="space-y-4">
                    {[
                      ["QA", "Regression test passed on login and register flow."],
                      ["BOT", "New GitHub PR linked: improve captcha validation."],
                      ["DEV", "Please check mobile spacing before release."],
                    ].map(([name, msg], index) => (
                      <div key={msg} className="flex gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                          {name}
                        </div>
                        <div className="rounded-2xl rounded-tl-none bg-white/[0.06] p-4">
                          <div className="text-xs font-bold text-blue-300">{name}</div>
                          <div className="mt-1 text-sm leading-6 text-slate-200">{msg}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </main>

                <aside className="p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Terminal size={18} className="text-cyan-300" />
                    <span className="font-black">Code Preview</span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-6 text-slate-300">
                    <p><span className="text-slate-500">1</span> export const release = &#123;</p>
                    <p><span className="text-slate-500">2</span> &nbsp;status: <span className="text-emerald-300">"ready"</span>,</p>
                    <p><span className="text-slate-500">3</span> &nbsp;tests: <span className="text-blue-300">98</span>,</p>
                    <p><span className="text-slate-500">4</span> &nbsp;notify: <span className="text-yellow-200">true</span></p>
                    <p><span className="text-slate-500">5</span> &#125;</p>
                  </div>

                  <div className="mt-4 rounded-2xl bg-blue-500/10 p-4">
                    <div className="text-sm font-black text-blue-200">AI Summary</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      3 tasks remain before release: mobile spacing, changelog, and final QA confirmation.
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Integrations */}
      <section className="bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <p className="font-mono text-sm font-black text-blue-600">{copy.integrations.kicker}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {copy.integrations.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.integrations.description}</p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {copy.integrations.items.map((item, index) => {
                const Icon = integrationIcons[index % integrationIcons.length];

                return (
                  <div key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <Icon size={24} className="text-blue-600" />
                    <h3 className="mt-4 font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[480px] rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-xl shadow-slate-200/70">
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 shadow-2xl shadow-blue-200">
              <div className="flex h-full w-full items-center justify-center text-white">
                <MessageCircle size={46} />
              </div>
            </div>

            {[
              { label: "GitHub", top: "8%", left: "10%", icon: Github },
              { label: "CI/CD", top: "12%", right: "8%", icon: Rocket },
              { label: "Webhook", bottom: "15%", left: "8%", icon: PlugZap },
              { label: "API", bottom: "10%", right: "12%", icon: Server },
              { label: "AI", top: "42%", left: "4%", icon: Bot },
              { label: "Tasks", top: "42%", right: "4%", icon: CheckCircle2 },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="absolute rounded-3xl border border-slate-200 bg-white p-4 shadow-lg"
                  style={{
                    top: item.top,
                    left: item.left,
                    right: item.right,
                    bottom: item.bottom,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Icon size={20} />
                    </div>
                    <span className="font-black text-slate-800">{item.label}</span>
                  </div>
                </div>
              );
            })}

            <div className="absolute left-1/2 top-1/2 -z-0 h-[70%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-blue-200" />
          </div>
        </div>
      </section>

      {/* Section 7: AI Assistant */}
      <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-white">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Bot size={26} />
                  </div>
                  <div>
                    <div className="font-black">CodeSync AI</div>
                    <div className="text-sm text-blue-100">assistant is typing...</div>
                  </div>
                </div>
                <Sparkles size={24} />
              </div>

              <div className="space-y-4">
                <div className="max-w-[80%] rounded-3xl rounded-tl-none bg-white/15 p-4 text-sm leading-6">
                  Summarize this release thread and create a checklist before merge.
                </div>

                <div className="ml-auto max-w-[88%] rounded-3xl rounded-tr-none bg-white p-5 text-slate-800 shadow-xl">
                  <div className="mb-3 text-sm font-black text-blue-600">AI Checklist</div>
                  {["Run auth regression", "Confirm mobile spacing", "Generate changelog", "Notify release channel"].map(
                    (task) => (
                      <div key={task} className="mb-3 flex items-center gap-3 text-sm">
                        <CheckCircle2 size={18} className="text-emerald-500" />
                        {task}
                      </div>
                    ),
                  )}
                </div>

                <div className="rounded-3xl border border-white/20 bg-slate-950/30 p-4 font-mono text-xs leading-6 text-cyan-50">
                  npm run test:auth -- --coverage
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="font-mono text-sm font-black text-blue-600">{copy.ai.kicker}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {copy.ai.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.ai.description}</p>

            <div className="mt-8 space-y-4">
              {copy.ai.bullets.map((bullet) => (
                <div key={bullet} className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span className="text-sm font-semibold leading-6 text-slate-700">{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 8: Security */}
      <section id="security" className="bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <p className="font-mono text-sm font-black text-blue-600">{copy.security.kicker}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {copy.security.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.security.description}</p>

            <div className="mt-8 grid gap-4">
              {copy.security.items.map((item, index) => {
                const Icon = securityIcons[index % securityIcons.length];

                return (
                  <div key={item.title} className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="font-black">Security Center</div>
                <div className="text-sm text-slate-400">Workspace protection overview</div>
              </div>
              <ShieldCheck className="text-emerald-300" size={30} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Private channels", "12 locked"],
                ["Active roles", "4 groups"],
                ["Audit events", "1,284 logs"],
                ["Protected files", "98 assets"],
              ].map(([title, value]) => (
                <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
                  <div className="text-sm text-slate-400">{title}</div>
                  <div className="mt-2 text-2xl font-black">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Terminal size={18} className="text-cyan-300" />
                <span className="text-sm font-black">Audit Log</span>
              </div>

              <div className="space-y-3 font-mono text-xs leading-6 text-slate-300">
                <p><span className="text-emerald-300">[ALLOW]</span> admin updated role: release-manager</p>
                <p><span className="text-blue-300">[INFO]</span> github webhook verified successfully</p>
                <p><span className="text-yellow-200">[LOCK]</span> private channel access changed</p>
                <p><span className="text-emerald-300">[ALLOW]</span> user joined workspace by invite</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 9: Customize */}
      <section className="bg-slate-50 px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-sm font-black text-blue-600">{copy.settings.kicker}</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
              {copy.settings.title}
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">{copy.settings.description}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {copy.settings.items.map((item, index) => {
              const Icon = settingIcons[index % settingIcons.length];

              return (
                <div key={item.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Icon size={26} />
                  </div>
                  <h3 className="text-xl font-black text-slate-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 10: Testimonials */}
      <section className="bg-white px-5 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-sm font-black text-blue-600">{copy.testimonials.kicker}</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                {copy.testimonials.title}
              </h2>
            </div>
            <div className="flex gap-1 text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={22} fill="currentColor" />
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {copy.testimonials.items.map((item) => (
              <div key={item.name} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6">
                <p className="text-sm leading-7 text-slate-700">“{item.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-black text-white">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-black text-slate-950">{item.name}</div>
                    <div className="text-xs font-semibold text-slate-500">{item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="bg-slate-50 px-5 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.3rem] bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 p-8 text-white shadow-2xl shadow-blue-200 md:p-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
                {copy.cta.title}
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">{copy.cta.description}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a
                onClick={onClickCTA}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-black text-blue-600 shadow-lg transition hover:-translate-y-1"
              >
                {copy.cta.primary}
                <ArrowRight size={18} />
              </a>

              <a
                href="#workflow"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-4 text-sm font-black text-white backdrop-blur transition hover:-translate-y-1 hover:bg-white/20"
              >
                {copy.cta.secondary}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-5 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <a href="#home" className="flex items-center gap-2 font-bold text-blue-600">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                <MessageCircle size={20} />
              </span>
              <span className="text-lg tracking-tight">CodeSync</span>
            </a>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-600">
              {copy.footer.description}
            </p>

            <div className="mt-6 flex gap-3">
              {[Github, MessageCircle, Bell].map((Icon, index) => (
                <a
                  key={index}
                  href="#home"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {copy.footer.columns.map((column) => (
              <div key={column.title}>
                <h3 className="font-black text-slate-950">{column.title}</h3>
                <div className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <a
                      key={link}
                      href="#home"
                      className="block text-sm font-medium text-slate-500 transition hover:text-blue-600"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-4 border-t border-slate-200 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© 2026 CodeSync Chat. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#home" className="hover:text-blue-600">Privacy</a>
            <a href="#home" className="hover:text-blue-600">Terms</a>
            <a href="#home" className="hover:text-blue-600">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}