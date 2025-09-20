import React, { useEffect, useMemo, useRef, useState } from "react";
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
    ChevronRight,
    ChevronLeft,
    ExternalLink,
    Download,
    Info,
    TreePine,
    Search,
    X,
} from "lucide-react";
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
} from "@codesandbox/sandpack-react";
import { GithubAPI } from "@/api/api";

/** ------------ Types ------------ */
type RepoDetailModalProps = {
    repo: any | null; // object repo từ /installation/repositories
    onClose: () => void;
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
    commit?: { message?: string; author?: { name?: string; date?: string } };
    author?: { login?: string; avatar_url?: string };
};

type TreeEntry = {
    path: string;
    type: "blob" | "tree";
    sha: string;
    mode: string;
    size?: number;
    url: string;
};

/** ------------ Utils ------------ */
const cleanTmpl = (url: string) => url.replace(/\{.*\}/, "");
const formatDate = (d?: string) =>
    d
        ? new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(d))
        : "—";
const isWebCode = (name: string) => /\.(js|jsx|ts|tsx|html|css)$/i.test(name);
const guessSandpackTemplate = (name: string): "react" | "vanilla" => {
    if (/\.(tsx|jsx)$/i.test(name)) return "react";
    if (/\.(ts|js)$/i.test(name)) return "react";
    if (/\.(html|css)$/i.test(name)) return "vanilla";
    return "react";
};
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

/** ------------ In-memory cache theo URL ------------ */
const urlCache = new Map<string, any>();
async function fetchJson(url: string) {
    if (urlCache.has(url)) return urlCache.get(url);
    // Gọi qua backend của bạn để kèm token/cors
    const res = await GithubAPI.getRepoData({ url });
    const data = res?.data ?? res;
    urlCache.set(url, data);
    return data;
}

/** ------------ Debounce hook ------------ */
function useDebounced<T>(value: T, delay = 300) {
    const [v, setV] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setV(value), delay);
        return () => clearTimeout(t);
    }, [value, delay]);
    return v;
}

/** ------------ Component ------------ */
const RepoDetailModal: React.FC<RepoDetailModalProps> = ({ repo, onClose }) => {
    const [activeTab, setActiveTab] = useState<"code" | "commits" | "issues" | "pulls">("code");

    // ref (branch/commit)
    const defaultBranch = repo?.default_branch || "main";
    const [refType, setRefType] = useState<"branch" | "commit">("branch");
    const [branch, setBranch] = useState<string>(defaultBranch);
    const [commitSha, setCommitSha] = useState<string>("");

    const refParam = useMemo(
        () => (refType === "branch" ? branch || defaultBranch : commitSha || ""),
        [refType, branch, commitSha, defaultBranch]
    );

    // Summary data
    const [branches, setBranches] = useState<any[]>([]);
    const [languages, setLanguages] = useState<Record<string, number>>({});
    const [commits, setCommits] = useState<CommitItem[]>([]);
    const [issues, setIssues] = useState<any[]>([]);
    const [pulls, setPulls] = useState<any[]>([]);
    const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

    // Explorer (full-screen)
    const [currentPath, setCurrentPath] = useState<string>("");
    const [treeMode, setTreeMode] = useState<boolean>(true); // bật mặc định để duyệt nhanh
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [treeEntries, setTreeEntries] = useState<TreeEntry[]>([]);
    const [loadingExplorer, setLoadingExplorer] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const debouncedSearch = useDebounced(search, 250);

    // File preview (slide-over panel)
    const [selectedFile, setSelectedFile] = useState<ContentItem | null>(null);
    const [fileContent, setFileContent] = useState<string>("");
    const [loadingFile, setLoadingFile] = useState<boolean>(false);
    const fileAbort = useRef<AbortController | null>(null);

    /** ----------- Load summary song song ----------- */
    useEffect(() => {
        if (!repo) return;
        let mounted = true;
        setLoadingSummary(true);

        const load = async () => {
            try {
                const bURL = repo.branches_url ? cleanTmpl(repo.branches_url) : "";
                const lURL = repo.languages_url ?? "";
                const cURL = repo.commits_url ? `${cleanTmpl(repo.commits_url)}?per_page=20` : "";
                const iURL = repo.issues_url ? `${cleanTmpl(repo.issues_url)}?state=open&per_page=20` : "";
                const pURL = repo.pulls_url ? `${cleanTmpl(repo.pulls_url)}?state=open&per_page=20` : "";

                const [b, l, c, i, p] = await Promise.all([
                    bURL ? fetchJson(bURL) : [],
                    lURL ? fetchJson(lURL) : {},
                    cURL ? fetchJson(cURL) : [],
                    iURL ? fetchJson(iURL) : [],
                    pURL ? fetchJson(pURL) : [],
                ]);

                if (!mounted) return;
                setBranches(Array.isArray(b) ? b : []);
                setLanguages(l || {});
                // Sửa ở đây: nếu c là object có .data thì lấy c.data, còn không thì lấy c
                setCommits(Array.isArray(c?.data) ? c.data : Array.isArray(c) ? c : []);
                setIssues(Array.isArray(i) ? i : []);
                setPulls(Array.isArray(p) ? p : []);
            } catch {
                if (!mounted) return;
                setBranches([]);
                setLanguages({});
                setCommits([]);
                setIssues([]);
                setPulls([]);
            } finally {
                if (!mounted) return;
                setLoadingSummary(false);
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, [repo]);

    /** ----------- Load Explorer theo ref/path/mode ----------- */
    useEffect(() => {
        if (!repo) return;
        let mounted = true;
        setLoadingExplorer(true);
        setSelectedFile(null);
        setFileContent("");

        const loadExplorer = async () => {
            try {
                if (treeMode) {
                    // /git/trees/:ref?recursive=1
                    const tURL = repo.trees_url
                        ? `${cleanTmpl(repo.trees_url)}/${encodeURIComponent(refParam || defaultBranch)}?recursive=1`
                        : "";
                    const tree = tURL ? await fetchJson(tURL) : null;
                    if (!mounted) return;
                    const entries: TreeEntry[] = Array.isArray(tree?.tree) ? tree.tree : [];
                    setTreeEntries(entries);
                    setContents([]); // không dùng contents khi treeMode
                } else {
                    // /contents/{+path}?ref=...
                    const base = repo.contents_url?.replace("{+path}", currentPath || "");
                    const url = base
                        ? `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(refParam)}`
                        : "";
                    const data = url ? await fetchJson(url) : [];
                    if (!mounted) return;
                    setContents(Array.isArray(data) ? (data as ContentItem[]) : []);
                    setTreeEntries([]);
                }
            } catch {
                if (!mounted) return;
                setTreeEntries([]);
                setContents([]);
            } finally {
                if (!mounted) return;
                setLoadingExplorer(false);
            }
        };

        loadExplorer();
        return () => {
            mounted = false;
        };
    }, [repo, currentPath, refParam, treeMode, defaultBranch]);

    /** ----------- Open path via contents (khi đang ở tree mode click blob) ----------- */
    const openPathViaContents = async (path: string) => {
        const base = repo.contents_url.replace("{+path}", path);
        const url = `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(refParam)}`;
        const detail = await fetchJson(url);
        if (Array.isArray(detail)) {
            setCurrentPath(path);
            setSelectedFile(null);
        } else {
            setSelectedFile(detail as ContentItem);
        }
    };

    /** ----------- Load file content khi chọn file ----------- */
    useEffect(() => {
        if (!selectedFile || !selectedFile.download_url) return;
        let mounted = true;

        (async () => {
            setLoadingFile(true);
            fileAbort.current?.abort();
            fileAbort.current = new AbortController();
            try {
                const res = await fetch(selectedFile.download_url, { signal: fileAbort.current.signal });
                const text = await res.text();
                if (!mounted) return;
                setFileContent(text);
            } catch {
                if (!mounted) return;
                setFileContent("// Failed to load file content.");
            } finally {
                if (!mounted) return;
                setLoadingFile(false);
            }
        })();

        return () => {
            mounted = false;
            fileAbort.current?.abort();
        };
    }, [selectedFile]);

    if (!repo) return null;

    /** ------------ Language bar ------------ */
    const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0);
    const langsSorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
    const topLangs = langsSorted.slice(0, 5).map(([k, bytes]) => ({ name: k, pct: totalBytes ? (bytes / totalBytes) * 100 : 0 }));
    const otherPct = clamp(100 - topLangs.reduce((s, l) => s + l.pct, 0));

    /** ------------ UI helpers ------------ */
    const breadcrumb = (
        <div className="mb-3 text-sm text-gray-400 flex items-center gap-1 whitespace-nowrap">
            <span className="text-gray-500">Path:</span>
            <button
                className="px-1 rounded text-blue-400 hover:underline"
                onClick={() => {
                    setCurrentPath("");
                    setSelectedFile(null);
                }}
            >
                /
            </button>
            {currentPath &&
                currentPath.split("/").map((seg: string, i: number, arr: string[]) => {
                    const pathUpTo = arr.slice(0, i + 1).join("/");
                    return (
                        <span key={i} className="flex items-center gap-1">
                            <ChevronRight className="h-3 w-3 text-gray-600" />
                            <button
                                className="px-1 rounded text-blue-400 hover:underline"
                                onClick={() => {
                                    setCurrentPath(pathUpTo);
                                    setSelectedFile(null);
                                }}
                            >
                                {seg}
                            </button>
                        </span>
                    );
                })}
        </div>
    );

    const refBar = (
        <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-3 py-1.5">
                <GitBranch className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Ref:</span>
                <select
                    value={refType}
                    onChange={(e) => {
                        const next = e.target.value as "branch" | "commit";
                        setRefType(next);
                        if (next === "branch") setCommitSha("");
                        else if (next === "commit" && commits.length > 0) setCommitSha(commits[0].sha);
                    }}
                    className="bg-transparent outline-none text-gray-100"
                >
                    <option value="branch">Branch</option>
                    <option value="commit">Commit</option>
                </select>

                {refType === "branch" ? (
                    <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100 outline-none"
                    >
                        {[...branches]
                            .map((b: any) => b.name)
                            .sort((a: string, b: string) => (a === defaultBranch ? -1 : b === defaultBranch ? 1 : a.localeCompare(b)))
                            .map((name: string) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                    </select>
                ) : (
                    <select
                        value={commitSha}
                        onChange={(e) => setCommitSha(e.target.value)}
                        className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-100 outline-none max-w-[260px]"
                    >
                        {commits.map((c) => (
                            <option key={c.sha} value={c.sha}>
                                {c.sha.substring(0, 7)} — {c.commit?.message?.slice(0, 48) || ""}
                            </option>
                        ))}
                    </select>
                )}

                <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-gray-300 hover:bg-gray-700"
                    onClick={() => {
                        // chạm state để reload (vì cache đã có, tải rất nhanh)
                        setCurrentPath((p) => p);
                    }}
                    title="Refresh view"
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-gray-400">
                <Info className="h-3.5 w-3.5" />
                <span>
                    Chọn <b>Branch</b> hoặc <b>Commit</b> để duyệt file theo phiên bản tương ứng. Bật <b>Tree mode</b> để tải toàn cây 1 lần.
                </span>
            </div>
        </div>
    );

    /** ------------ Explorer (full màn hình trong tab Code) ------------ */
    const renderExplorerList = () => {
        const items = treeMode
            ? treeEntries.filter((e) => e.path.toLowerCase().includes(debouncedSearch.toLowerCase()))
            : contents.filter((c) => (currentPath ? c.path : c.name).toLowerCase().includes(debouncedSearch.toLowerCase()));

        return (
            <div className="border border-gray-700 rounded p-3 h-[calc(100vh-260px)] overflow-auto">
                {breadcrumb}

                {/* search + toggle */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={treeMode ? "Tìm theo đường dẫn trong toàn repo…" : "Tìm theo tên file/thư mục…"}
                            className="w-full pl-8 pr-3 py-2 rounded-md border border-gray-700 bg-gray-900 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <Button
                        variant={treeMode ? "default" : "outline"}
                        size="sm"
                        className="shrink-0"
                        onClick={() => {
                            setTreeMode((v) => !v);
                            setSelectedFile(null);
                            setSearch("");
                        }}
                        title="Bật/tắt Tree mode (git/trees/:ref?recursive=1)"
                    >
                        <TreePine className="h-4 w-4 mr-2" />
                        {treeMode ? "Tree mode" : "List mode"}
                    </Button>
                </div>

                <ul className="rounded-md border border-gray-700 divide-y divide-gray-700">
                    {loadingExplorer
                        ? Array.from({ length: 12 }).map((_, i) => (
                            <li key={`sk-${i}`} className="px-3 py-2">
                                <div className="h-4 w-56 bg-gray-800 animate-pulse rounded" />
                            </li>
                        ))
                        : items.map((item) => {
                            if (treeMode) {
                                const entry = item as unknown as TreeEntry;
                                const isDir = entry.type === "tree";
                                return (
                                    <li key={entry.path} className="flex items-center justify-between px-3 py-2 hover:bg-gray-800/70">
                                        <button
                                            className="flex items-center gap-2 text-left w-full"
                                            onClick={() => (isDir ? setCurrentPath(entry.path) : openPathViaContents(entry.path))}
                                            title={entry.path}
                                        >
                                            {isDir ? (
                                                <Folder className="h-4 w-4 text-yellow-400" />
                                            ) : (
                                                <FileText className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="text-sm text-gray-100 truncate">{entry.path}</span>
                                        </button>
                                    </li>
                                );
                            }
                            const c = item as ContentItem;
                            return (
                                <li key={c.path} className="flex items-center justify-between px-3 py-2 hover:bg-gray-800/70">
                                    <button
                                        className="flex items-center gap-2 text-left"
                                        onClick={() => (c.type === "dir" ? (setCurrentPath(c.path), setSelectedFile(null)) : setSelectedFile(c))}
                                        aria-label={c.type === "dir" ? `Open folder ${c.name}` : `Open file ${c.name}`}
                                        title={c.name}
                                    >
                                        {c.type === "dir" ? (
                                            <Folder className="h-4 w-4 text-yellow-400" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-gray-400" />
                                        )}
                                        <span className="text-sm text-gray-100">{c.name}</span>
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {c.type === "file" && c.html_url && (
                                            <a
                                                href={c.html_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs inline-flex items-center gap-1 text-blue-400 hover:underline"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <ExternalLink className="h-3.5 w-3.5" />
                                                GitHub
                                            </a>
                                        )}
                                        {c.type === "file" && c.download_url && (
                                            <a
                                                href={c.download_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs inline-flex items-center gap-1 text-gray-300 hover:text-gray-100"
                                                onClick={(e) => e.stopPropagation()}
                                                download
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                Raw
                                            </a>
                                        )}
                                    </div>
                                </li>
                            );
                        })}

                    {!loadingExplorer && items.length === 0 && (
                        <li className="px-3 py-8 text-center text-sm text-gray-500">Không tìm thấy mục nào.</li>
                    )}
                </ul>
            </div>
        );
    };

    /** ------------ Slide-over Viewer (không phá fullscreen explorer) ------------ */
    const renderViewer = () => {
        if (!selectedFile) return null;

        return (
            <div className="absolute top-0 right-0 h-full w-[56%] min-w-[520px] bg-gray-900 border-l border-gray-700 shadow-xl">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-800">
                    <div className="flex items-center gap-2 min-w-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-300 hover:bg-gray-700"
                            onClick={() => setSelectedFile(null)}
                            title="Đóng viewer"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <h3 className="font-semibold text-gray-100 truncate" title={selectedFile.path}>
                            {selectedFile.path}
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                            Ref: <code className="text-green-400">{refType === "branch" ? branch : commitSha.substring(0, 7)}</code>
                        </span>
                        {selectedFile?.html_url && (
                            <a
                                href={selectedFile.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs inline-flex items-center gap-1 text-blue-400 hover:underline whitespace-nowrap"
                                title="Mở trên GitHub"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                GitHub
                            </a>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedFile(null)}>
                            <X className="h-4 w-4 text-gray-300" />
                        </Button>
                    </div>
                </div>

                <div className="p-3 h-[calc(100%-44px)] overflow-auto">
                    {loadingFile ? (
                        <div className="mt-2 space-y-2">
                            <div className="h-4 w-64 bg-gray-800 animate-pulse rounded" />
                            <div className="h-[360px] bg-gray-800 animate-pulse rounded" />
                        </div>
                    ) : isWebCode(selectedFile.name) ? (
                        <SandpackProvider
                            template={guessSandpackTemplate(selectedFile.name)}
                            files={{
                                ["/" + selectedFile.name]: {
                                    code: fileContent,
                                    active: true,
                                },
                            }}
                        >
                            <SandpackLayout className="h-[calc(100vh-140px)]">
                                <SandpackCodeEditor showLineNumbers />
                                <SandpackPreview />
                            </SandpackLayout>
                        </SandpackProvider>
                    ) : (
                        <pre className="bg-gray-800 text-gray-100 text-sm rounded p-4 overflow-auto h-[calc(100vh-140px)]">
                            {fileContent}
                        </pre>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={!!repo} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-6xl h-[90vh] overflow-hidden p-0 bg-gray-900 text-gray-100 border border-gray-700 flex flex-col justify-center items-center">
                <DialogHeader className="border-b border-gray-700 p-4 bg-gray-800">
                    <DialogTitle className="text-lg font-semibold text-gray-100 flex items-center gap-3">
                        <span className="truncate">{repo.full_name}</span>
                        <span className="text-xs text-gray-400 font-normal whitespace-nowrap">
                            • Default: <code className="text-green-400">{repo.default_branch || "main"}</code>
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="h-full">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
                        <TabsList className="border-b border-gray-700 px-4 bg-gray-800 text-gray-200">
                            <TabsTrigger value="code">Code</TabsTrigger>
                            <TabsTrigger value="commits">Commits</TabsTrigger>
                            <TabsTrigger value="issues">Issues</TabsTrigger>
                            <TabsTrigger value="pulls">Pull Requests</TabsTrigger>
                        </TabsList>

                        {/* CODE (Explorer full màn hình) */}
                        <TabsContent value="code" className="relative flex-1 overflow-hidden p-4">
                            {/* thanh ref */}
                            <div className="mb-4 flex items-center justify-between">
                                {refBar}
                                {/* Language bar gọn bên phải */}
                                <div className="hidden md:block w-64">
                                    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">Languages</div>
                                    <div className="w-full h-2 rounded bg-gray-800 overflow-hidden flex">
                                        {topLangs.map((l, idx) => (
                                            <div
                                                key={l.name + idx}
                                                style={{ width: `${clamp(l.pct)}%` }}
                                                className={["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-yellow-500", "bg-pink-500"][idx % 5]}
                                            />
                                        ))}
                                        {otherPct > 0 && <div style={{ width: `${clamp(otherPct)}%` }} className="bg-gray-600" />}
                                    </div>
                                </div>
                            </div>

                            {/* Explorer full width */}
                            {renderExplorerList()}

                            {/* Slide-over viewer (xuất hiện khi chọn file) */}
                            {renderViewer()}
                        </TabsContent>

                        {/* COMMITS */}
                        <TabsContent value="commits" className="flex-1 overflow-auto p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-semibold text-gray-100 flex items-center gap-2 whitespace-nowrap">
                                    <GitCommit className="h-4 w-4 text-purple-400" />
                                    Commits
                                </h2>
                                <div className="text-xs text-gray-500">
                                    Click commit để xem code tại thời điểm đó (tab Code).
                                </div>
                            </div>

                            <ul className="rounded border border-gray-700 divide-y divide-gray-700">
                                {loadingSummary && commits.length === 0
                                    ? Array.from({ length: 6 }).map((_, i) => (
                                        <li key={`csk-${i}`} className="px-4 py-3">
                                            <div className="h-4 w-64 bg-gray-800 animate-pulse rounded mb-2" />
                                            <div className="h-3 w-40 bg-gray-800 animate-pulse rounded" />
                                        </li>
                                    ))
                                    : commits.map((c) => (
                                        <li key={c.sha} className="px-4 py-3 hover:bg-gray-800/70">
                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {c.html_url && (
                                                        <a
                                                            href={c.html_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-green-400 font-mono hover:underline flex-shrink-0"
                                                            title="Xem trên GitHub"
                                                        >
                                                            {c.sha.substring(0, 7)}
                                                        </a>
                                                    )}
                                                    <span className="text-sm text-gray-100 truncate max-w-[260px]" title={c.commit?.message}>
                                                        {c.commit?.message}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 whitespace-nowrap">
                                                    {c.author?.avatar_url && (
                                                        <img
                                                            src={c.author.avatar_url}
                                                            alt={c.author.login}
                                                            className="h-5 w-5 rounded-full border border-gray-700"
                                                        />
                                                    )}
                                                    <span>{c.commit?.author?.name || c.author?.login}</span>
                                                    <span>• {formatDate(c.commit?.author?.date)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 flex gap-2 flex-wrap">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-gray-200 border-gray-700 hover:bg-gray-800"
                                                    onClick={() => {
                                                        setRefType("commit");
                                                        setCommitSha(c.sha);
                                                        setActiveTab("code");
                                                    }}
                                                >
                                                    Xem code tại commit này
                                                </Button>
                                                {c.html_url && (
                                                    <a
                                                        href={c.html_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        GitHub
                                                    </a>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                            </ul>
                        </TabsContent>

                        {/* ISSUES */}
                        <TabsContent value="issues" className="flex-1 overflow-auto p-4">
                            <h2 className="font-semibold text-gray-100 mb-3 whitespace-nowrap">Open Issues</h2>
                            <ul className="rounded border border-gray-700 divide-y divide-gray-700">
                                {loadingSummary && issues.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <li key={`isk-${i}`} className="px-4 py-3">
                                            <div className="h-4 w-72 bg-gray-800 animate-pulse rounded mb-2" />
                                            <div className="h-3 w-40 bg-gray-800 animate-pulse rounded" />
                                        </li>
                                    ))
                                ) : (
                                    issues.map((it) => (
                                        <li key={it.id} className="px-4 py-3 hover:bg-gray-800/70">
                                            <div className="text-sm text-gray-100 truncate" title={it.title}>
                                                #{it.number} — {it.title}
                                            </div>
                                            <div className="text-xs text-gray-500 whitespace-nowrap">
                                                {it.user?.login} • {formatDate(it.created_at)}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </TabsContent>

                        {/* PULLS */}
                        <TabsContent value="pulls" className="flex-1 overflow-auto p-4">
                            <h2 className="font-semibold text-gray-100 mb-3 whitespace-nowrap">Open Pull Requests</h2>
                            <ul className="rounded border border-gray-700 divide-y divide-gray-700">
                                {loadingSummary && pulls.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <li key={`psk-${i}`} className="px-4 py-3">
                                            <div className="h-4 w-72 bg-gray-800 animate-pulse rounded mb-2" />
                                            <div className="h-3 w-40 bg-gray-800 animate-pulse rounded" />
                                        </li>
                                    ))
                                ) : (
                                    pulls.map((p) => (
                                        <li key={p.id} className="px-4 py-3 hover:bg-gray-800/70">
                                            <div className="text-sm text-gray-100 truncate" title={p.title}>
                                                #{p.number} — {p.title}
                                            </div>
                                            <div className="text-xs text-gray-500 whitespace-nowrap">
                                                {p.user?.login} • {formatDate(p.created_at)}
                                            </div>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RepoDetailModal;

/** ------------ Small helper component ------------ */
export const StatBox: React.FC<{ label: string; value: number | string }> = ({ label, value }) => {
    return (
        <div className="rounded border border-gray-700 bg-gray-900 p-3 text-center">
            <div className="text-xs text-gray-500 whitespace-nowrap">{label}</div>
            <div className="text-lg font-semibold text-gray-100 whitespace-nowrap">{value}</div>
        </div>
    );
};
