import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  GitCommit,
  Folder,
  FileText,
  RefreshCw,
  ExternalLink,
  Play,
  Lock,
  Shield,
  Share2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { GithubAPI } from "@/api/api";
import { Editor } from "@monaco-editor/react";
import { ChannelSearch } from "@/components/blocks/channels/ChannelSearch";
import { chatSocketService } from "@/services/chatSocketService";
import { toast } from "@/hooks/useToast";
import CommitAnalysisComponent from "../tools/gen-ai/CommitAnalysis";

/** ---------------- Types ---------------- */
type RepoViewerProps = {
  repo: any | null;
  onClose: () => void;
  installation_id?: string;
};

type ContentItem = {
  name: string;
  path: string;
  type: "dir" | "file" | "symlink" | "submodule";
  html_url: string;
  download_url: string | null;
};

type CommitItem = {
  sha: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: { name?: string; date?: string; email?: string };
  };
  author?: { login?: string; avatar_url?: string };
};

type TreeEntry = {
  path: string;
  type: "blob" | "tree";
  sha: string;
};

/** ---------------- Utils ---------------- */
const cleanTmpl = (url: string) => url?.replace(/\{.*\}/, "") ?? "";
const fmt = (d?: string) => (d ? new Date(d).toLocaleString() : "—");
const fetchJson = async (url: string, installation_id?: string) => {
  if (!url) return [];
  const res = await GithubAPI.getRepoData({ url, installation_id });
  return (res as any)?.data ?? res;
};

/** ---------------- Helpers ---------------- */
const parentDir = (p: string) =>
  p.includes("/") ? p.split("/").slice(0, -1).join("/") : "";
const firstDirOf = (p: string) => (p.includes("/") ? p.split("/")[0] : p);
const guessMonacoLang = (p: string) => {
  const ext = (p.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "html":
      return "html";
    case "py":
      return "python";
    case "java":
      return "java";
    case "c":
      return "c";
    case "cc":
    case "cpp":
    case "cxx":
      return "cpp";
    case "go":
      return "go";
    case "rs":
      return "rust";
    case "md":
      return "markdown";
    case "yml":
    case "yaml":
      return "yaml";
    case "sh":
      return "shell";
    case "php":
      return "php";
    default:
      return "plaintext";
  }
};

// Judge0 ids cho một số ngôn ngữ
const judge0LanguageId: Record<string, number | undefined> = {
  cpp: 54,
  c: 50,
  java: 62,
  python: 71,
  javascript: 63,
  go: 60,
};

/** ---------------- Code Viewer Dialog ---------------- */
export function CodeViewerDialog({
  open,
  onOpenChange,
  repo,
  refParam,
  initialPath,
  installation_id,
  isShare = false,
  json_data_code,
  viewBranchOfCommit, // 👈 hiển thị branch gốc khi xem commit
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  repo: any;
  refParam: string;
  initialPath: string;
  installation_id?: string;
  isShare?: boolean;
  json_data_code?: string; // nếu là share code thì có thêm param này
  viewBranchOfCommit?: string | null;
}) {
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [dialogPath, setDialogPath] = useState<string>("");
  const [selPath, setSelPath] = useState<string>(initialPath);
  const [fileText, setFileText] = useState<string>("Loading…");
  const [loadingTree, setLoadingTree] = useState<boolean>(false);
  const [loadingFile, setLoadingFile] = useState<boolean>(false);
  const [code, setCode] = useState<string>("");
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareChannelId, setShareChannelId] = useState<string | null>(null);
  const [treeLoaded, setTreeLoaded] = useState(false);
  const [fileLoaded, setFileLoaded] = useState(false);

  useEffect(() => {
    if (!open) {
      console.log("RepoDetailModal closed", { refParam, initialPath, isShare });
    }
  }, [open, refParam, initialPath, isShare]);

  const loadTree = useCallback(async () => {
    if (!repo) return;
    setLoadingTree(true);
    try {
      const tURL = repo.trees_url
        ? `${cleanTmpl(repo.trees_url)}/${encodeURIComponent(refParam)}?recursive=1`
        : "";
      const data = tURL ? await fetchJson(tURL, installation_id) : null;
      const entries: TreeEntry[] = Array.isArray((data as any)?.tree)
        ? (data as any).tree
        : [];
      setTree(entries);
      setTreeLoaded(true);
    } finally {
      setLoadingTree(false);
    }
  }, [repo, refParam, installation_id]);

  const loadFile = useCallback(
    async (path: string) => {
      if (!repo) return;
      setLoadingFile(true);
      setFileText("Loading…");
      try {
        let text = "";
        if (isShare) {
          console.log("Using shared code from json_data_code", {
            json_data_code,
          });
          text = json_data_code;
        } else {
          const base = repo.contents_url?.replace("{+path}", path);
          const url = base
            ? `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(refParam)}`
            : "";
          const meta = await fetchJson(url, installation_id);
          const raw = (meta as any)?.download_url;
          if (!raw) {
            setFileText("// No raw URL");
            return;
          }
          const res = await fetch(raw);
          text = await res.text();
        }

        console.log("Filetext", text);

        setFileText(text);
        setCode(text);
        setFileLoaded(true);
      } catch {
        setFileText("// Failed to load file content.");
      } finally {
        setLoadingFile(false);
      }
    },
    [repo, refParam, installation_id]
  );

  useEffect(() => {
    if (open) {
      if (!isShare) {
        loadTree();
      }
    }
    // eslint-disable-next-line
  }, [open, loadTree, isShare]);

  useEffect(() => {
    if (open) {
      setSelPath(initialPath);
      setDialogPath(parentDir(initialPath));
      if (initialPath) {
        if (isShare) {
          if (!fileLoaded) loadFile(initialPath);
        } else {
          loadFile(initialPath);
        }
      }
    }
    // eslint-disable-next-line
  }, [open, initialPath, loadFile, isShare]);

  const handleSelectFile = (full: string) => {
    setSelPath(full);
    if (isShare) {
      if (!fileLoaded) loadFile(full);
    } else {
      loadFile(full);
    }
  };

  const dirChildren = useMemo(() => {
    const prefix = dialogPath ? dialogPath + "/" : "";
    const seen = new Set<string>();
    const dirs: string[] = [];
    const files: string[] = [];

    for (const e of tree) {
      if (!e.path.startsWith(prefix)) continue;
      const rest = e.path.slice(prefix.length);
      if (!rest) continue;
      const next = firstDirOf(rest);
      if (rest.includes("/")) {
        if (!seen.has(next)) {
          seen.add(next);
          dirs.push(next);
        }
      } else if (e.type === "blob") {
        files.push(rest);
      }
    }
    return { dirs, files };
  }, [tree, dialogPath]);

  const breadcrumb = (
    <div className="px-3 py-2 text-xs text-zinc-400 border-b border-zinc-800">
      <button className="hover:underline" onClick={() => setDialogPath("")}>
        root
      </button>
      {dialogPath &&
        dialogPath.split("/").map((seg, i, arr) => (
          <span key={i}>
            <span className="opacity-60"> / </span>
            <button
              className="hover:underline"
              onClick={() => setDialogPath(arr.slice(0, i + 1).join("/"))}
            >
              {seg}
            </button>
          </span>
        ))}
    </div>
  );

  // Share
  const handleShare = () => setShowShareModal(true);
  const handleSelectChannel = (channel: any) =>
    setShareChannelId(String(channel.id));
  const handleDoShare = (type: "current" | "other") => {
    let channel_id = "";
    if (type === "current")
      channel_id = localStorage.getItem("selectedChannelId") || "";
    else channel_id = shareChannelId || "";

    const params = {
      repo,
      refParam,
      initialPath: selPath,
      installation_id,
      isShare: true,
      channel_id,
    };
    chatSocketService.sendMessage({
      channelId: channel_id,
      text: `File  ${params.refParam} đã được chia sẻ từ repo ${params.repo.full_name}`,
      type: "code-share",
      json_data: JSON.stringify({
        ...params,
        code_text: fileText,
        timeshared: new Date().toISOString(),
      }),
    });
    toast({
      title: "Đã chia sẻ file vào kênh chat.",
      description: `File ${params.refParam} từ repo ${params.repo.full_name} đã được chia sẻ vào kênh chat.`,
    });
    setShowShareModal(false);
  };

  console.log("repo", repo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[92vw] h-[92vh] p-0 bg-white dark:bg-black text-black dark:text-white border border-zinc-700 overflow-hidden">
        <DialogHeader className="px-4 py-3 border-b border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10 w-10 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-800">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7 text-black dark:text-white"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.012c0 4.425 2.867 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.37-1.342-3.37-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.646.35-1.088.636-1.34-2.221-.253-4.555-1.113-4.951 0-1.093.39-1.988 1.029-2.688-.103-.254-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.025 2.747-1.025.546 1.378.202 2.396.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.135 20.19 22 16.437 22 12.012 22 6.484 17.523 2 12 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base flex items-center gap-2 font-semibold text-black dark:text-white truncate">
                <span className="truncate">{repo.full_name}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                  {repo.private ? (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Public
                    </span>
                  )}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />{" "}
                    {repo.default_branch || "main"}
                  </span>
                </span>
              </DialogTitle>
              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-zinc-300"
                >
                  {repo.html_url}
                </a>
                <span className="ml-2">
                  Lần cập nhật gần nhất:{" "}
                  {repo.updated_at ? fmt(repo.updated_at) : "—"}
                </span>
              </div>
            </div>

            {/* Share */}
            <Button
              variant="outline"
              size="icon"
              className="mr-10 bg-white text-black border-gray-300 hover:bg-gray-100"
              title="Chia sẻ code này cho kênh"
              onClick={handleShare}
            >
              <Share2 className="h-5 w-5" />
            </Button>

            <Dialog
              open={showShareModal}
              onOpenChange={(v) => {
                setShowShareModal(v);
                if (!v) setShareChannelId(null);
              }}
            >
              <DialogContent
                className="bg-white dark:bg-black rounded-xl shadow-lg p-6 w-[40vw] min-h-[60vh] relative flex flex-col items-center justify-center"
                style={{
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  position: "fixed",
                }}
              >
                <button
                  className="absolute top-3 right-3 text-zinc-400 hover:text-black dark:text-white text-xl"
                  onClick={() => {
                    setShowShareModal(false);
                    setShareChannelId(null);
                  }}
                  aria-label="Đóng"
                  type="button"
                >
                  ×
                </button>
                <div className="text-lg font-semibold text-black dark:text-white mb-2 flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-blue-500" />
                  Chia sẻ code cho kênh
                </div>
                <div className="mb-4 w-full">
                  <div className="text-xs text-gray-600 mb-2 text-center">
                    Chọn kênh để chia sẻ
                  </div>
                  <ChannelSearch
                    onSelectChannel={handleSelectChannel}
                    isShare={true}
                  />
                  <Button
                    className="w-full mt-4 bg-blue-600 text-white"
                    onClick={() => handleDoShare("current")}
                  >
                    Chia sẻ cho kênh hiện tại
                  </Button>
                  {shareChannelId && (
                    <Button
                      className="w-full mt-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white"
                      onClick={() => handleDoShare("other")}
                    >
                      Chia sẻ cho kênh này
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </DialogHeader>

        <div className="h-full flex overflow-y-auto">
          {/* Left: tree */}
          {!isShare && (
            <div className="w-56 min-w-56 border-r border-zinc-800 h-full flex flex-col">
              {breadcrumb}
              {loadingTree ? (
                <div className="p-3 text-xs text-zinc-400">Loading tree…</div>
              ) : (
                <div className="flex-1 overflow-auto text-xs">
                  {dirChildren.dirs.map((d) => (
                    <button
                      key={d}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 text-gray-700 dark:text-zinc-200"
                      onClick={() =>
                        setDialogPath(dialogPath ? `${dialogPath}/${d}` : d)
                      }
                      title={dialogPath ? `${dialogPath}/${d}` : d}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Folder className="h-3.5 w-3.5 text-amber-400" />
                        <span className="truncate">{d}</span>
                      </span>
                    </button>
                  ))}
                  {dirChildren.files.map((f) => (
                    <button
                      key={f}
                      className={`w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 ${selPath === (dialogPath ? `${dialogPath}/${f}` : f)
                        ? "bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-zinc-100"
                        : "text-gray-700 dark:text-zinc-300"
                        }`}
                      onClick={() =>
                        handleSelectFile(dialogPath ? `${dialogPath}/${f}` : f)
                      }
                      title={dialogPath ? `${dialogPath}/${f}` : f}
                    >
                      <span className="inline-flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="truncate">{f}</span>
                      </span>
                    </button>
                  ))}
                  {!dirChildren.dirs.length && !dirChildren.files.length && (
                    <div className="p-3 text-zinc-500">Empty</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Right: code */}
          <div className="flex-1 h-full flex flex-col">
            {/* Toolbar (hiển thị ref + branch gốc nếu là commit) */}
            <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
              <div className="text-xs text-zinc-400 truncate">
                {selPath}
                {viewBranchOfCommit ? (
                  <span className="ml-2 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-700 text-zinc-300">
                    from branch: <b>{viewBranchOfCommit}</b>
                  </span>
                ) : null}
              </div>

              {(() => {
                const lang = guessMonacoLang(selPath || "");
                const jid = judge0LanguageId[lang];
                if (!jid) return null;
                return (
                  <button
                    onClick={async () => {
                      const jid2 =
                        judge0LanguageId[guessMonacoLang(selPath || "")];
                      if (!jid2) return;
                      setIsRunning(true);
                      setOutput("🔄 Executing code...");
                      try {
                        const resp = await fetch(
                          "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true",
                          {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
                              "X-RapidAPI-Key":
                                process.env.NEXT_PUBLIC_RAPIDAPI_KEY_JUDGE0 ||
                                "",
                            },
                            body: JSON.stringify({
                              source_code: code,
                              language_id: jid2,
                              stdin: "",
                            }),
                          }
                        );
                        const result = await resp.json();
                        if (result.stderr)
                          setOutput(`❌ Runtime Error:\n${result.stderr}`);
                        else if (result.compile_output)
                          setOutput(
                            `⚠️ Compilation Error:\n${result.compile_output}`
                          );
                        else
                          setOutput(
                            result.stdout ||
                            "✅ Program executed successfully (no output)"
                          );
                      } catch {
                        setOutput("🚨 Failed to execute.");
                      } finally {
                        setIsRunning(false);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs"
                    disabled={isRunning}
                  >
                    <Play
                      className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`}
                    />
                    <span>{isRunning ? "Running..." : "Run"}</span>
                  </button>
                );
              })()}
            </div>

            <div className="flex-1 border-b border-zinc-800">
              {loadingFile ? (
                <div className="p-4 text-xs text-zinc-400">Loading…</div>
              ) : (
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={guessMonacoLang(selPath || "")}
                  value={code}
                  onChange={(v) => setCode(v || "")}
                  options={{
                    fontSize: 14,
                    lineHeight: 20,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    insertSpaces: true,
                    wordWrap: "on",
                    renderLineHighlight: "all",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Skeleton
const SkeletonLine = ({ width = "100%", height = "1rem", className = "" }) => (
  <div
    className={`bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded ${className}`}
    style={{ width, height }}
  />
);

/** ---------------- Main ---------------- */
const RepoViewer: React.FC<RepoViewerProps> = ({
  repo,
  onClose,
  installation_id,
}) => {
  const [tab, setTab] = useState<"code" | "commits">("code");
  const [commitSearch, setCommitSearch] = useState<string>("");
  const [commitPage, setCommitPage] = useState<number>(1);
  const [commitLoading, setCommitLoading] = useState<boolean>(false);
  const [hasNextPage, setHasNextPage] = useState<boolean>(true);
  const [hasPrevPage, setHasPrevPage] = useState<boolean>(false);

  const defaultBranch = repo?.default_branch || "main";
  const [mode, setMode] = useState<"branch" | "commit">("branch");
  const [branch, setBranch] = useState<string>(defaultBranch);
  const [commitSha, setCommitSha] = useState<string>("");
  const [viewBranchOfCommit, setViewBranchOfCommit] = useState<string | null>(
    null
  ); // 👈 branch khi mở commit

  const refParam = useMemo(
    () => (mode === "branch" ? branch || defaultBranch : commitSha || ""),
    [mode, branch, commitSha, defaultBranch]
  );

  const [branches, setBranches] = useState<any[]>([]);
  const [commits, setCommits] = useState<CommitItem[]>([]);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [path, setPath] = useState<string>("");

  const [codeOpen, setCodeOpen] = useState(false);
  const [codePath, setCodePath] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const commitListRef = useRef<HTMLUListElement>(null);

  /** Load branches + commits tóm tắt lần đầu */
  const loadSummary = useCallback(async () => {
    if (!repo) return;
    const bURL = cleanTmpl(repo.branches_url);
    const cURL = `${cleanTmpl(repo.commits_url)}?per_page=100`;
    const [b, c] = await Promise.all([
      bURL ? fetchJson(bURL, installation_id) : [],
      cURL ? fetchJson(cURL, installation_id) : [],
    ]);
    setBranches(Array.isArray(b) ? b : []);
    const cList = Array.isArray((c as any)?.data)
      ? (c as any).data
      : Array.isArray(c)
        ? c
        : [];
    setCommits(cList);
    if (mode === "commit" && cList[0]) setCommitSha(cList[0].sha);
  }, [repo, mode, installation_id]);

  /** Load folder/file theo ref + path */
  const loadContents = useCallback(async () => {
    if (!repo) return;
    setLoading(true);
    try {
      const base = repo.contents_url?.replace("{+path}", path || "");
      const url = base
        ? `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(refParam)}`
        : "";
      const data = await fetchJson(url, installation_id);
      setItems(Array.isArray(data) ? (data as ContentItem[]) : []);
    } finally {
      setLoading(false);
    }
  }, [repo, path, refParam, installation_id]);

  /** Load commits theo branch; khi search -> lọc client trên 1 mẻ lớn */
  const loadCommitsForBranch = useCallback(
    async (page = 1, search = "") => {
      if (!repo) return;
      setCommitLoading(true);
      const base = cleanTmpl(repo.commits_url);
      const searching = !!search?.trim();
      const per = 100; // Giảm số lượng mỗi trang để dễ test pagination
      const url = `${base}?per_page=${per}&page=${page}&sha=${encodeURIComponent(branch)}`;

      const data = await fetchJson(url, installation_id);
      let list: CommitItem[] = Array.isArray((data as any)?.data)
        ? (data as any).data
        : Array.isArray(data)
          ? (data as any)
          : [];

      // Kiểm tra có trang tiếp theo không (nếu trả về đủ per item thì có thể có trang tiếp)
      setHasNextPage(list.length === per);
      setHasPrevPage(page > 1);

      if (searching) {
        const s = search.toLowerCase();
        list = list.filter((c: any) => {
          const sha = c.sha?.toLowerCase() || "";
          const msg = c.commit?.message?.toLowerCase() || "";
          const login = c.author?.login?.toLowerCase() || "";
          const name = c.commit?.author?.name?.toLowerCase() || "";
          const email = c.commit?.author?.email?.toLowerCase() || "";
          return (
            sha.includes(s) ||
            msg.includes(s) ||
            login.includes(s) ||
            name.includes(s) ||
            email.includes(s)
          );
        });
        // Khi search, không có pagination
        setHasNextPage(false);
        setHasPrevPage(false);
      }

      setCommits(list);
      setCommitLoading(false);

      // Scroll to top sau mỗi lần load trang mới
      if (commitListRef.current) {
        commitListRef.current.scrollTop = 0;
      }
    },
    [repo, branch, installation_id]
  );

  /** Reset về trang 1 khi đổi branch/search */
  useEffect(() => {
    setCommitPage(1);
  }, [branch, commitSearch]);

  /** Fetch commits theo tab/branch/search/page */
  useEffect(() => {
    if (tab !== "commits") return;
    loadCommitsForBranch(commitPage, commitSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, branch, commitSearch, commitPage]);

  /** Scroll về đầu khi mở tab Commits / đổi branch / đổi filter */
  useEffect(() => {
    if (tab === "commits" && commitListRef.current) {
      commitListRef.current.scrollTop = 0;
    }
  }, [tab, branch, commitSearch]);

  /** Search box: chỉ set state; fetch do useEffect lo */
  const handleCommitSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCommitSearch(e.target.value);
    setCommitPage(1);
  };

  /** Refresh: reset bộ lọc & reload theo branch nếu đang ở tab Commits; còn lại refresh contents */
  const handleRefreshAll = useCallback(() => {
    if (tab === "commits") {
      setCommitSearch("");
      setCommitPage(1);
      loadCommitsForBranch(1, "");
      // scroll top
      setTimeout(() => {
        if (commitListRef.current) commitListRef.current.scrollTop = 0;
      }, 0);
    } else {
      loadContents();
    }
  }, [tab, loadContents, loadCommitsForBranch]);

  /** open code dialog from file click */
  const openCode = useCallback((p: string) => {
    setCodePath(p);
    setCodeOpen(true);
  }, []);

  /** init + reload */
  useEffect(() => {
    if (repo) loadSummary();
  }, [repo, loadSummary]);
  useEffect(() => {
    if (repo) loadContents();
  }, [repo, refParam, path, loadContents]);

  /** Khi chuyển sang tab commits -> đảm bảo page=1 để effect fetch */
  useEffect(() => {
    if (repo && tab === "commits") setCommitPage(1);
  }, [repo, tab]);

  if (!repo) return null;

  const handlePreviousPage = () => {
    if (hasPrevPage && commitPage > 1) {
      setCommitPage(commitPage - 1);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      setCommitPage(commitPage + 1);
    }
  };

  return (
    <Dialog open={!!repo} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[92vw] h-[92vh] p-0 bg-white dark:bg-black text-black dark:text-white border border-zinc-700 overflow-hidden flex flex-col">
        <DialogHeader className="px-4 py-3 border-b border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-10 w-10 rounded bg-zinc-50 dark:bg-zinc-900 border border-zinc-800">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-7 w-7 text-black dark:text-white"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.012c0 4.425 2.867 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.37-1.342-3.37-1.342-.454-1.155-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.646.35-1.088.636-1.34-2.221-.253-4.555-1.113-4.951 0-1.093.39-1.988 1.029-2.688-.103-.254-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.747-1.025 2.747-1.025.546 1.378.202 2.396.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.579.688.481C19.135 20.19 22 16.437 22 12.012 22 6.484 17.523 2 12 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-base flex items-center gap-2 font-semibold text-black dark:text-white truncate">
                <span className="truncate">{repo.full_name}</span>
                <span className="ml-2 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                  {repo.private ? (
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Private
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Public
                    </span>
                  )}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                  <span className="inline-flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />{" "}
                    {repo.default_branch || "main"}
                  </span>
                </span>
              </DialogTitle>
              <div className="text-xs text-zinc-400 mt-1 flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5" />
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-zinc-300"
                >
                  {repo.html_url}
                </a>
                <span className="ml-2">
                  • Lần cập nhật gần nhất:{" "}
                  {repo.updated_at ? fmt(repo.updated_at) : "—"}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="h-full flex flex-col overflow-y-auto">
          {/* Ref bar */}
          <div className="px-4 py-2 flex items-center gap-2 border-b border-zinc-900 bg-zinc-50 dark:bg-zinc-950">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-emerald-400" />
              {mode === "branch" ? (
                <select
                  className="bg-white dark:bg-black border border-zinc-700 rounded px-2 py-1 text-sm"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  disabled={loading}
                >
                  {loading ? (
                    <option>Đang tải…</option>
                  ) : (
                    [...branches].map((b: any) => (
                      <option key={b.name} value={b.name}>
                        {b.name ?? "Nhánh"}
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <div className="text-xs text-zinc-300 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-700">
                    Commit:{" "}
                    <span className="font-mono">{commitSha.slice(0, 7)}</span>
                  </span>
                  {viewBranchOfCommit && (
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-700">
                      from branch <b>{viewBranchOfCommit}</b>
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-black"
                    onClick={() => {
                      setMode("branch");
                      setPath(""); // về root
                    }}
                  >
                    Quay về
                  </Button>
                </div>
              )}

              {/* Refresh: reset filter ở tab commits; code -> reload contents */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={handleRefreshAll}
                title="Refresh"
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as any)}
            className="flex-1 flex flex-col"
          >
            <TabsList className="px-4 border-b border-zinc-900 bg-zinc-50 dark:bg-zinc-950 text-zinc-200">
              <TabsTrigger value="code">Source Code</TabsTrigger>
              <TabsTrigger value="commits">Commits</TabsTrigger>
            </TabsList>

            {/* CODE */}
            <TabsContent value="code" className="flex-1 p-4 overflow-hidden">
              <div className="mb-2 text-sm text-zinc-400 flex items-center flex-wrap gap-1">
                <button
                  className="hover:underline font-medium"
                  onClick={() => setPath("")}
                  title={repo?.full_name}
                >
                  {repo?.name || repo?.full_name || "repo"}
                </button>
                {path &&
                  path.split("/").map((seg, i, arr) => (
                    <React.Fragment key={i}>
                      <span className="opacity-60">/</span>
                      <button
                        className="hover:underline"
                        onClick={() => setPath(arr.slice(0, i + 1).join("/"))}
                        title={arr.slice(0, i + 1).join("/")}
                      >
                        {seg}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <div className="h-[calc(100%-28px)] overflow-auto border border-zinc-800 rounded">
                {loading ? (
                  <ul className="divide-y divide-zinc-800 p-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center gap-2">
                          <SkeletonLine
                            width="24px"
                            height="24px"
                            className="mr-2"
                          />
                          <SkeletonLine width="120px" height="16px" />
                        </div>
                        <SkeletonLine width="60px" height="14px" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <ul className="divide-y divide-zinc-800">
                    {items.map((c) => (
                      <li
                        key={c.path}
                        className="flex items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-900"
                      >
                        <button
                          className="flex items-center gap-2 text-left"
                          onClick={() =>
                            c.type === "dir"
                              ? setPath(c.path)
                              : openCode(c.path)
                          }
                          title={c.path}
                        >
                          {c.type === "dir" ? (
                            <Folder className="h-4 w-4 text-amber-400" />
                          ) : (
                            <FileText className="h-4 w-4 text-zinc-400" />
                          )}
                          <span className="text-sm">{c.name}</span>
                        </button>
                        <div className="text-xs text-zinc-400 flex items-center gap-2">
                          {c.html_url && (
                            <a
                              href={c.html_url}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> GitHub
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                    {!items.length && (
                      <li className="px-3 py-6 text-sm text-zinc-500">
                        Empty folder.
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </TabsContent>

            {/* COMMITS */}
            <TabsContent value="commits" className="flex-1 p-4 overflow-auto">
              <div className="mb-3 flex items-center gap-2">
                <input
                  value={commitSearch}
                  onChange={handleCommitSearch}
                  placeholder="Tìm commit theo message, SHA, tác giả…"
                  className="w-full px-3 py-2 rounded-md border border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-gray-900  dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Pagination Info & Controls */}
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs text-zinc-400">
                  {commitSearch.trim()
                    ? `Tìm thấy ${commits.length} commit${commits.length !== 1 ? "s" : ""}`
                    : `Trang ${commitPage}`}
                </div>

                {!commitSearch.trim() && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={!hasPrevPage || commitLoading}
                      className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trang trước
                    </Button>

                    <span className="text-sm text-zinc-400 px-4">
                      Trang {commitPage}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={!hasNextPage || commitLoading}
                      className="border-zinc-700 text-black hover:bg-zinc-100 dark:bg-zinc-800"
                    >
                      Trang sau
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>

              <ul
                ref={commitListRef}
                className="border border-zinc-800 rounded divide-y divide-zinc-800 max-h-[calc(80vh-120px)] overflow-auto"
                style={{ minHeight: 300 }}
              >
                {commitLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="px-4 py-3 flex items-center gap-3">
                      <SkeletonLine
                        width="24px"
                        height="24px"
                        className="rounded-full mr-3"
                      />
                      <div className="flex-1 space-y-1">
                        <SkeletonLine width="80px" height="14px" />
                        <SkeletonLine width="180px" height="14px" />
                        <SkeletonLine width="120px" height="12px" />
                      </div>
                      <SkeletonLine width="60px" height="14px" />
                    </li>
                  ))
                  : commits.map((c) => (
                    <li key={c.sha} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-zinc-900">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="min-w-0 flex items-center gap-3">
                          {c.author?.avatar_url && (
                            <img
                              src={c.author.avatar_url}
                              alt={c.author?.login || "avatar"}
                              className="h-6 w-6 rounded-full border border-zinc-700"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-mono text-emerald-400 text-sm">
                              {c.sha.slice(0, 7)}
                            </div>
                            <div className="text-sm truncate">
                              {c.commit?.message}
                            </div>
                            <div className="text-xs text-zinc-400 truncate">
                              {c.author?.login && (
                                <a
                                  href={`https://github.com/${c.author.login}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:underline text-zinc-300"
                                >
                                  @{c.commit?.author?.name || c.author.login}
                                </a>
                              )}
                              {c.commit?.author?.email && (
                                <span className="ml-2 opacity-80">
                                  {c.commit.author.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-zinc-400">
                          {fmt(c.commit?.author?.date)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-zinc-700 text-gray-900 dark:text-white bg-white  hover:bg-gray-100 dark:hover:bg-zinc-100 dark:bg-zinc-800"
                            onClick={() => {
                              // 👇 mở commit view: nhớ branch hiện tại + reset path về root
                              setMode("commit");
                              setCommitSha(c.sha);
                              setViewBranchOfCommit(branch);
                              setPath("");
                              setTab("code");
                            }}
                          >
                            <GitCommit className="h-4 w-4 mr-2" /> Mở Commit
                          </Button>

                          <CommitAnalysisComponent
                            owner={repo?.owner?.login}
                            repo={repo?.name}
                            sha={c.sha}
                          />
                        </div>

                        {c.html_url && (
                          <a
                            href={c.html_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            GitHub
                          </a>
                        )}
                      </div>
                    </li>
                  ))}

                {!commitLoading && !commits.length && (
                  <li className="px-4 py-6 text-sm text-zinc-500">
                    Không có commit nào.
                  </li>
                )}
              </ul>

              {/* Bottom Pagination - chỉ hiển thị khi không search */}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Code Dialog */}
      <CodeViewerDialog
        open={codeOpen}
        onOpenChange={setCodeOpen}
        repo={repo}
        refParam={refParam}
        initialPath={codePath}
        installation_id={installation_id ?? ""}
        viewBranchOfCommit={viewBranchOfCommit}
      />
    </Dialog>
  );
};

export default RepoViewer;
