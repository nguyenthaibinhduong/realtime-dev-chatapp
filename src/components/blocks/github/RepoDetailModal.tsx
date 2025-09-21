import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GitBranch, GitCommit, Folder, FileText, RefreshCw, ExternalLink, Play, Terminal } from "lucide-react";
import { GithubAPI } from "@/api/api";
import { Editor } from "@monaco-editor/react";

/** ---------------- Types ---------------- */
type RepoViewerProps = { repo: any | null; onClose: () => void };

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
    commit?: { message?: string; author?: { name?: string; date?: string; email?: string } };
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
const fetchJson = async (url: string) => {
    if (!url) return [];
    const res = await GithubAPI.getRepoData({ url });
    return (res as any)?.data ?? res;
};

/** ---------------- Helpers ---------------- */
const parentDir = (p: string) => (p.includes("/") ? p.split("/").slice(0, -1).join("/") : "");
const firstDirOf = (p: string) => (p.includes("/") ? p.split("/")[0] : p);
// map file path -> monaco language key
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
        default:
            return "plaintext";
    }
};

// Judge0 ids cho một số ngôn ngữ (tùy chọn chạy code)
const judge0LanguageId: Record<string, number | undefined> = {
    cpp: 54,        // C++17
    c: 50,          // C
    java: 62,       // Java
    python: 71,     // Python 3
    javascript: 63, // Node.js
    go: 60,         // Go
};

/** ---------------- Code Viewer Dialog (2-pane, folder-like) ---------------- */
function CodeViewerDialog({
    open,
    onOpenChange,
    repo,
    refParam,
    initialPath,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    repo: any;
    refParam: string;
    initialPath: string;
}) {
    const [tree, setTree] = useState<TreeEntry[]>([]);
    const [dialogPath, setDialogPath] = useState<string>(""); // folder path inside dialog
    const [selPath, setSelPath] = useState<string>(initialPath);
    const [fileText, setFileText] = useState<string>("Loading…");
    const [loadingTree, setLoadingTree] = useState<boolean>(false);
    const [loadingFile, setLoadingFile] = useState<boolean>(false);
    // Monaco/Judge0
    const [code, setCode] = useState<string>("");
    const [output, setOutput] = useState<string>("");
    const [isRunning, setIsRunning] = useState<boolean>(false);


    // load full tree (recursive)
    const loadTree = useCallback(async () => {
        if (!repo) return;
        setLoadingTree(true);
        try {
            const tURL = repo.trees_url
                ? `${cleanTmpl(repo.trees_url)}/${encodeURIComponent(refParam)}?recursive=1`
                : "";
            const data = tURL ? await fetchJson(tURL) : null;
            const entries: TreeEntry[] = Array.isArray((data as any)?.tree) ? (data as any).tree : [];
            setTree(entries);
        } finally {
            setLoadingTree(false);
        }
    }, [repo, refParam]);

    // load selected file content
    const loadFile = useCallback(
        async (path: string) => {
            if (!repo) return;
            setLoadingFile(true);
            setFileText("Loading…");
            try {
                const base = repo.contents_url?.replace("{+path}", path);
                const url = base
                    ? `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(refParam)}`
                    : "";
                const meta = await fetchJson(url); // object: has download_url
                const raw = (meta as any)?.download_url;
                if (!raw) {
                    setFileText("// No raw URL");
                    return;
                }
                const res = await fetch(raw);
                const text = await res.text();
                setFileText(text);
                setCode(text);
            } catch {
                setFileText("// Failed to load file content.");
            } finally {
                setLoadingFile(false);
            }
        },
        [repo, refParam]
    );

    useEffect(() => {
        if (open) loadTree();
    }, [open, loadTree]);

    useEffect(() => {
        if (open) {
            setSelPath(initialPath);
            setDialogPath(parentDir(initialPath));
            if (initialPath) loadFile(initialPath);
        }
    }, [open, initialPath, loadFile]);

    // Build folder-like children of current dialogPath
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
            <button className="hover:underline" onClick={() => setDialogPath("")}>{/* repo root */}root</button>
            {dialogPath && dialogPath.split("/").map((seg, i, arr) => (
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-6xl h-[84vh] p-0 bg-black text-white border border-zinc-700 overflow-hidden">
                <DialogHeader className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                    <DialogTitle className="text-sm truncate">{selPath || "Code"}</DialogTitle>
                </DialogHeader>
                <div className="h-full flex overflow-y-auto">
                    {/* Left: folder-like tree (compact) */}
                    <div className="w-56 min-w-56 border-r border-zinc-800 h-full flex flex-col">
                        {breadcrumb}
                        {loadingTree ? (
                            <div className="p-3 text-xs text-zinc-400">Loading tree…</div>
                        ) : (
                            <div className="flex-1 overflow-auto text-xs">
                                {/* Dirs */}
                                {dirChildren.dirs.map((d) => (
                                    <button
                                        key={d}
                                        className="w-full text-left px-3 py-1.5 hover:bg-zinc-900 text-zinc-200"
                                        onClick={() => setDialogPath(dialogPath ? `${dialogPath}/${d}` : d)}
                                        title={dialogPath ? `${dialogPath}/${d}` : d}
                                    >
                                        <span className="inline-flex items-center gap-2"><Folder className="h-3.5 w-3.5 text-amber-400" /><span className="truncate">{d}</span></span>
                                    </button>
                                ))}
                                {/* Files */}
                                {dirChildren.files.map((f) => (
                                    <button
                                        key={f}
                                        className={`w-full text-left px-3 py-1.5 hover:bg-zinc-900 ${selPath === (dialogPath ? `${dialogPath}/${f}` : f) ? "bg-zinc-900 text-zinc-100" : "text-zinc-300"}`}
                                        onClick={() => { const full = dialogPath ? `${dialogPath}/${f}` : f; setSelPath(full); loadFile(full); }}
                                        title={dialogPath ? `${dialogPath}/${f}` : f}
                                    >
                                        <span className="inline-flex items-center gap-2"><FileText className="h-3.5 w-3.5" /><span className="truncate">{f}</span></span>
                                    </button>
                                ))}
                                {!dirChildren.dirs.length && !dirChildren.files.length && (
                                    <div className="p-3 text-zinc-500">Empty</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: code */}

                    {/* Right: code (Monaco + optional run) */}
                    <div className="flex-1 h-full flex flex-col">
                        {/* Toolbar */}
                        <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                            <div className="text-xs text-zinc-400 truncate">{selPath}</div>
                            {(() => {
                                const lang = guessMonacoLang(selPath || "");
                                const jid = judge0LanguageId[lang];
                                if (!jid) return null; // chỉ hiện nút Run nếu Judge0 hỗ trợ
                                return (
                                    <button
                                        onClick={async () => {
                                            const jid2 = judge0LanguageId[guessMonacoLang(selPath || "")];
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
                                                            "X-RapidAPI-Key": (process.env.NEXT_PUBLIC_RAPIDAPI_KEY_JUDGE0 || ""),
                                                        },
                                                        body: JSON.stringify({ source_code: code, language_id: jid2, stdin: "" }),
                                                    }
                                                );
                                                const result = await resp.json();
                                                if (result.stderr) setOutput(`❌ Runtime Error:\n${result.stderr}`);
                                                else if (result.compile_output) setOutput(`⚠️ Compilation Error:\n${result.compile_output}`);
                                                else setOutput(result.stdout || "✅ Program executed successfully (no output)");
                                            } catch {
                                                setOutput("🚨 Failed to execute.");
                                            } finally {
                                                setIsRunning(false);
                                            }
                                        }}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs"
                                        disabled={isRunning}
                                    >
                                        <Play className={`h-3.5 w-3.5 ${isRunning ? "animate-spin" : ""}`} />
                                        <span>{isRunning ? "Running..." : "Run"}</span>
                                    </button>
                                );
                            })()}
                        </div>

                        {/* Editor / Loader */}
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

                        {/* Output panel */}
                        <div className="h-40 bg-black border-t border-zinc-800">
                            <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-800 flex items-center gap-2 text-white text-xs">
                                <Terminal className="h-3.5 w-3.5 text-emerald-500" />
                                <span>Output</span>
                            </div>
                            <div className="h-[calc(100%-34px)] p-3 overflow-auto">
                                <pre className="text-xs text-emerald-400 whitespace-pre-wrap">
                                    {output || "Click Run to execute (if supported)."}
                                </pre>
                            </div>
                        </div>
                    </div>

                </div>
            </DialogContent>
        </Dialog>
    );
}

/** ---------------- Main component ---------------- */
const RepoViewer: React.FC<RepoViewerProps> = ({ repo, onClose }) => {
    const [tab, setTab] = useState<"code" | "commits">("code");

    // ref: branch | commit
    const defaultBranch = repo?.default_branch || "main";
    const [mode, setMode] = useState<"branch" | "commit">("branch");
    const [branch, setBranch] = useState<string>(defaultBranch);
    const [commitSha, setCommitSha] = useState<string>("");
    const refParam = useMemo(
        () => (mode === "branch" ? branch || defaultBranch : commitSha || ""),
        [mode, branch, commitSha, defaultBranch]
    );

    // data
    const [branches, setBranches] = useState<any[]>([]);
    const [commits, setCommits] = useState<CommitItem[]>([]);
    const [items, setItems] = useState<ContentItem[]>([]);
    const [path, setPath] = useState<string>("");

    // code dialog
    const [codeOpen, setCodeOpen] = useState(false);
    const [codePath, setCodePath] = useState<string>("");

    const [loading, setLoading] = useState<boolean>(false);

    /** Load branches + commits ngắn gọn */
    const loadSummary = useCallback(async () => {
        if (!repo) return;
        const bURL = cleanTmpl(repo.branches_url);
        const cURL = `${cleanTmpl(repo.commits_url)}?per_page=25`;
        const [b, c] = await Promise.all([bURL ? fetchJson(bURL) : [], cURL ? fetchJson(cURL) : []]);
        setBranches(Array.isArray(b) ? b : []);
        const cList = Array.isArray((c as any)?.data) ? (c as any).data : Array.isArray(c) ? c : [];
        setCommits(cList);
        if (mode === "commit" && cList[0]) setCommitSha(cList[0].sha);
    }, [repo, mode]);

    /** Load folder/file theo ref + path */
    const loadContents = useCallback(async () => {
        if (!repo) return;
        setLoading(true);
        try {
            const base = repo.contents_url?.replace("{+path}", path || "");
            const url = base ? `${base}${base.includes("?") ? "&" : "?"}ref=${encodeURIComponent(refParam)}` : "";
            const data = await fetchJson(url);
            setItems(Array.isArray(data) ? (data as ContentItem[]) : []);
        } finally {
            setLoading(false);
        }
    }, [repo, path, refParam]);

    // commits theo branch khi ở tab "commits"
    const loadCommitsForBranch = useCallback(async () => {
        if (!repo) return;
        const base = cleanTmpl(repo.commits_url);
        const url = `${base}?per_page=50&sha=${encodeURIComponent(branch)}`;
        const data = await fetchJson(url);
        const list = Array.isArray((data as any)?.data) ? (data as any).data : Array.isArray(data) ? data : [];
        setCommits(list);
    }, [repo, branch]);

    // open code dialog from file click
    const openCode = useCallback((p: string) => {
        setCodePath(p);
        setCodeOpen(true);
    }, []);

    // init + reload
    useEffect(() => { if (repo) loadSummary(); }, [repo, loadSummary]);
    useEffect(() => { if (repo) loadContents(); }, [repo, refParam, path, loadContents]);

    // Khi chuyển sang tab commits, tải commits theo branch hiện tại
    useEffect(() => {
        if (!repo) return;
        if (tab === "commits") {
            if (mode === "branch") loadCommitsForBranch();
            else loadSummary();
        }
    }, [repo, tab, mode, branch, loadCommitsForBranch, loadSummary]);

    if (!repo) return null;

    return (
        <Dialog open={!!repo} onOpenChange={onClose}>
            <DialogContent className="w-full max-w-7xl h-[92vh] p-0 bg-black text-white border border-zinc-700 overflow-hidden flex flex-col">
                <DialogHeader className="px-4 py-3 border-b border-zinc-800 bg-zinc-950">
                    <DialogTitle className="text-base flex items-center gap-3">
                        <span className="truncate">{repo.full_name}</span>
                        <span className="text-xs text-zinc-400">• default: {defaultBranch}</span>
                    </DialogTitle>
                </DialogHeader>

                <div className="h-full flex flex-col overflow-y-auto">
                    {/* Ref bar */}
                    <div className="px-4 py-2 flex items-center gap-2 border-b border-zinc-900 bg-zinc-950">
                        <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4 text-emerald-400" />
                            {/* <select
                                className="bg-black border border-zinc-700 rounded px-2 py-1 text-sm"
                                value={mode}
                                onChange={(e) => setMode(e.target.value as any)}
                            >
                                <option value="branch">Branch</option>
                                <option value="commit">Commit</option>
                            </select> */}

                            {mode === "branch" ? (
                                <select
                                    className="bg-black border border-zinc-700 rounded px-2 py-1 text-sm"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                >
                                    {[...branches].map((b: any) => (
                                        <option key={b.name} value={b.name}>{b.name ?? 'Nhánh'}</option>
                                    ))}
                                </select>
                            ) : (
                                <select
                                    className="bg-black border border-zinc-700 rounded px-2 py-1 text-sm max-w-[280px]"
                                    value={commitSha}
                                    onChange={(e) => setCommitSha(e.target.value)}
                                >
                                    {commits.map((c) => (
                                        <option key={c.sha} value={c.sha}>
                                            {c.sha.slice(0, 7) ?? ' '} — {c.commit?.message?.slice(0, 50) || "Commit"}
                                        </option>
                                    ))}
                                </select>
                            )}

                            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => loadContents()} title="Refresh">
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="flex-1 flex flex-col">
                        <TabsList className="px-4 border-b border-zinc-900 bg-zinc-950 text-zinc-200">
                            <TabsTrigger value="code">Code</TabsTrigger>
                            <TabsTrigger value="commits">Commits</TabsTrigger>
                        </TabsList>

                        {/* CODE */}
                        <TabsContent value="code" className="flex-1 p-4 overflow-hidden">
                            {/* breadcrumb */}
                            <div className="mb-2 text-sm text-zinc-400 flex items-center flex-wrap gap-1">
                                <button
                                    className="hover:underline font-medium"
                                    onClick={() => setPath("")}
                                    title={repo?.full_name}
                                >
                                    {repo?.name || repo?.full_name || "repo"}
                                </button>
                                {path && path.split("/").map((seg, i, arr) => (
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
                                    <div className="p-4 text-sm text-zinc-400">Loading…</div>
                                ) : (
                                    <ul className="divide-y divide-zinc-800">
                                        {items.map((c) => (
                                            <li key={c.path} className="flex items-center justify-between px-3 py-2 hover:bg-zinc-900">
                                                <button
                                                    className="flex items-center gap-2 text-left"
                                                    onClick={() => (c.type === "dir" ? setPath(c.path) : openCode(c.path))}
                                                    title={c.path}
                                                >
                                                    {c.type === "dir" ? <Folder className="h-4 w-4 text-amber-400" /> : <FileText className="h-4 w-4 text-zinc-400" />}
                                                    <span className="text-sm">{c.name}</span>
                                                </button>
                                                <div className="text-xs text-zinc-400 flex items-center gap-2">
                                                    {c.html_url && (
                                                        <a href={c.html_url} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                                                            <ExternalLink className="h-3.5 w-3.5" /> GitHub
                                                        </a>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                        {!items.length && <li className="px-3 py-6 text-sm text-zinc-500">Empty folder.</li>}
                                    </ul>
                                )}
                            </div>
                        </TabsContent>

                        {/* COMMITS */}
                        <TabsContent value="commits" className="flex-1 p-4 overflow-auto">
                            <ul className="border border-zinc-800 rounded divide-y divide-zinc-800">
                                {commits.map((c) => (
                                    <li key={c.sha} className="px-4 py-3 hover:bg-zinc-900">
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
                                                    <div className="font-mono text-emerald-400 text-sm">{c.sha.slice(0, 7)}</div>
                                                    <div className="text-sm truncate">{c.commit?.message}</div>
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
                                                        {/* {c.commit?.author?.name && <span className="ml-2">{c.commit.author.name}</span>} */}
                                                        {c.commit?.author?.email && <span className="ml-2 opacity-80">{c.commit.author.email}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs text-zinc-400">{fmt(c.commit?.author?.date)}</div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 border-zinc-700 text-zinc-700"
                                                onClick={() => {
                                                    setMode("commit");
                                                    setCommitSha(c.sha);
                                                    setTab("code");
                                                }}
                                            >
                                                <GitCommit className="h-4 w-4 mr-2" /> Mở Commit
                                            </Button>
                                            {c.html_url && (
                                                <a href={c.html_url} target="_blank" rel="noreferrer" className="text-xs text-sky-400 hover:underline">
                                                    Mở trên GitHub
                                                </a>
                                            )}
                                        </div>
                                    </li>
                                ))}
                                {!commits.length && <li className="px-4 py-6 text-sm text-zinc-500">Không có commit nào.</li>}
                            </ul>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>

            {/* Code Dialog 2-pane (folder-like left, code right) */}
            <CodeViewerDialog
                open={codeOpen}
                onOpenChange={setCodeOpen}
                repo={repo}
                refParam={refParam}
                initialPath={codePath}
            />
        </Dialog>
    );
};

export default RepoViewer;
