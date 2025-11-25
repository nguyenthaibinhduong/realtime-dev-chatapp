import React, { useMemo, useRef, useState } from "react";
import MasterLayout from "./MasterLayout";
import MenubarLayout from "./MenubarLayout";
import SidebarLayout from "./SidebarLayout";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProfileLayout from "./ProfileLayout";
import GithubRegisterLayout from "./GithubRegisterLayout";
import { TestLayout, EditorLayout } from "./SandBoxLayout";
import CodeEditorJudge0 from "./MonacoEditorLayout";
import TestNotiLayout from "./TestLayout";
import ApiTool from "./blocks/tools/api-tool/ApiTool";
import AILayout from "./AILayout";

type SettingItem = {
  id: string;
  label: string;
  to?: string;
  component?: React.ReactNode;
};
type SettingSection = { title?: string; items: SettingItem[] };

export default function SettingLayout() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>("profile");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const sections: SettingSection[] = [
    {
      title: "CÀI ĐẶT NGƯỜI DÙNG",
      items: [
        {
          id: "profile",
          label: "Hồ sơ",
          component: <ProfileLayout />,
        },
      ],
    },

    {
      title: "CÀI ĐẶT ỨNG DỤNG",
      items: [
        {
          id: "github-allowed-apps",
          label: "Liên kết với Github",
          component: <GithubRegisterLayout />,
        },
      ],
    },
    {
      title: "Sandbox",
      items: [
        {
          id: "test-sandbox",
          label: "Test SandBox",
          component: <TestLayout />,
        },
        {
          id: "editor-sandbox",
          label: "Editor SandBox",
          component: <EditorLayout />,
        },
        {
          id: "monaco-judge0",
          label: "Monaco + Judge0",
          component: <CodeEditorJudge0 />,
        },
        {
          id: "TestLayout",
          label: "TestLayout",
          component: <ApiTool />,
        },
        {
          id: "ai-tool",
          label: "AI Tool",
          component: <AILayout />,
        },
      ],
    },
  ];

  const onSelect = (it: SettingItem) => {
    setSelected(it.id);
    // Nếu có component, hiển thị nội dung trong MasterLayout.
    if (it.component) return;
    // Ngược lại nếu có to, chuyển trang như trước
    // if (it.to) navigate(it.to);
  };

  // Flatten sections for search
  const flatItems = useMemo(
    () => sections.flatMap((s) => s.items.map((it) => ({ ...it }))),
    [sections]
  );

  // Filtered results based on query
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return flatItems.filter((it) => it.label.toLowerCase().includes(q));
  }, [flatItems, query]);

  const clearQuery = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const SidebarChildren = (
    <div className="flex flex-col h-full">
      <div className="px-3 py-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-sidebar-foreground/60" />
          </div>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Tìm kiếm"
            placeholder="Tìm kiếm"
            className="w-full bg-[#111] text-sm text-sidebar-foreground/90 placeholder:opacity-60 rounded-md py-2 pl-10 pr-9 outline-none border border-sidebar-border"
          />
          {query && (
            <button
              aria-label="Clear search"
              onClick={clearQuery}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[rgba(255,255,255,0.03)]"
            >
              <X className="h-4 w-4 text-sidebar-foreground/60" />
            </button>
          )}
        </div>
      </div>

      <div className="px-3 pb-3 overflow-auto h-[calc(100vh-220px)]">
        {query.trim() ? (
          <>
            <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase mb-2 px-1">
              KẾT QUẢ TÌM KIẾM
            </div>
            <div className="flex flex-col space-y-1">
              {results.length === 0 && (
                <div className="text-sm text-sidebar-foreground/70 px-2 py-3">
                  Không tìm thấy
                </div>
              )}
              {results.map((it) => (
                <button
                  key={it.id}
                  onClick={() => onSelect(it)}
                  className={
                    "text-left w-full rounded-md px-3 py-2 text-sidebar-foreground hover:bg-[#222] transition flex items-center " +
                    (selected === it.id
                      ? "bg-[#2b2b2f] font-medium"
                      : "font-normal")
                  }
                >
                  <span className="truncate">{it.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          // Default grouped sections when no query
          sections.map((sec, idx) => (
            <div key={idx} className="mb-4">
              {sec.title && (
                <div className="text-xs font-semibold text-sidebar-foreground/60 uppercase mb-2 px-1">
                  {sec.title}
                </div>
              )}
              <div className="flex flex-col space-y-1">
                {sec.items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => onSelect(it)}
                    className={
                      "text-left w-full rounded-md px-3 py-2 text-sidebar-foreground hover:bg-[#222] transition flex items-center " +
                      (selected === it.id
                        ? "bg-[#2b2b2f] font-medium"
                        : "font-normal")
                    }
                  >
                    <span className="truncate">{it.label}</span>
                    {it.id === "nitro" && (
                      <span className="ml-auto text-primary text-xs">•</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Lấy item đang được chọn để render content (nếu có)
  const selectedItem = flatItems.find((f) => f.id === selected);

  return (
    <MasterLayout
      menu={<MenubarLayout />}
      sidebar={<SidebarLayout>{SidebarChildren}</SidebarLayout>}
    >
      <div
        className="flex-1 overflow-hidden"
        style={{ height: "100vh", minHeight: "100vh", maxHeight: "100vh" }}
      >
        <div className="h-full overflow-auto p-6">
          {selectedItem?.component ? (
            // Render component của setting được chọn
            <>{selectedItem.component}</>
          ) : (
            // Default content when no component assigned
            <>
              <h2 className="text-black dark:text-white text-xl font-semibold mb-4">Cài đặt</h2>
              <p className="text-sidebar-foreground/80">
                Chưa có Layout cho mục này.
              </p>
            </>
          )}
        </div>
      </div>
    </MasterLayout>
  );
}
