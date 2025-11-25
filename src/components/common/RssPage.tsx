import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * <RssPage rssUrl="https://vnexpress.net/rss/so-hoa.rss" />
 * - Dark, polished, image-rich tech news reader (VN friendly).
 * - Auto CORS fallbacks (r.jina.ai -> AllOrigins -> optional proxy).
 * - Parses RSS/Atom/JSON Feed; extracts images & categories.
 * - Featured hero + category sections + latest list.
 */

export type RssPageProps = {
    rssUrl: string;
    refreshMs?: number;       // default 10 phút
    corsProxy?: string;       // ví dụ: "https://api.allorigins.win/raw?url="
    limit?: number;           // default: 60 (để có đủ cho các mục)
    compact?: boolean;        // không dùng nhiều, nhưng để tương thích
};

type FeedItem = {
    id: string;
    title: string;
    link: string;
    author?: string;
    published?: Date;
    summary?: string;
    sourceTitle?: string;
    image?: string;
    categories?: string[];
};

export default function RssPage({
    rssUrl,
    refreshMs = 10 * 60 * 1000,
    corsProxy,
    limit = 60,
}: RssPageProps) {
    const [items, setItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const mounted = useRef(true);

    const fetchFeed = async () => {
        if (!rssUrl) return;
        setLoading(true);
        setError(null);
        try {
            const text = await fetchTextWithFallbacks(rssUrl, corsProxy);

            // JSON Feed?
            if (looksLikeJson(text)) {
                const parsed = parseJsonFeed(text, rssUrl);
                safeSetItems(parsed);
                return;
            }

            // XML (RSS/Atom)
            const xml = new DOMParser().parseFromString(text, "application/xml");
            const parserError = xml.getElementsByTagName("parsererror")[0];
            if (parserError) throw new Error("Unable to parse XML");

            const base = tryMakeBaseURL(rssUrl);
            const channelTitle =
                getTxt(xml.querySelector("channel > title")) ||
                getTxt(xml.querySelector("feed > title"));

            let parsed: FeedItem[] = [];
            const rssItems = Array.from(xml.querySelectorAll("channel > item"));

            if (rssItems.length) {
                // RSS 2.0
                parsed = rssItems.map((it, i) => {
                    const link =
                        getTxt(it.querySelector("link")) ||
                        it.querySelector("link")?.getAttribute?.("href") ||
                        "";
                    const guid =
                        getTxt(it.querySelector("guid")) || link || `${i}-${Math.random()}`;
                    const title = getTxt(it.querySelector("title")) || "(no title)";
                    const author =
                        getTxt(it.querySelector("author")) ||
                        getTxt(it.querySelector("dc\\:creator")) ||
                        getTxt(it.querySelector("creator"));
                    const pub =
                        parseDateSafe(
                            getTxt(it.querySelector("pubDate")) ||
                            getTxt(it.querySelector("dc\\:date"))
                        ) || undefined;

                    // content & image
                    const contentEncoded = getHtml(it, "content\\:encoded");
                    const descHtml =
                        contentEncoded ||
                        getHtml(it, "description") ||
                        getHtml(it, "summary") ||
                        "";

                    const img =
                        getRssImage(it) || // media:content / media:thumbnail / enclosure
                        findFirstImgSrc(descHtml);

                    const cats = getRssCategories(it);

                    return {
                        id: guid,
                        title,
                        link: absolutizeUrl(link, base),
                        author,
                        published: pub,
                        summary: stripHtml(descHtml),
                        sourceTitle: channelTitle,
                        image: absolutizeUrl(img || "", base),
                        categories: cats,
                    };
                });
            } else {
                // Atom
                const entries = Array.from(xml.querySelectorAll("feed > entry"));
                parsed = entries.map((en, i) => {
                    const linkEl =
                        en.querySelector("link[rel='alternate']") || en.querySelector("link");
                    const link =
                        (linkEl && (linkEl.getAttribute("href") || getTxt(linkEl))) || "";
                    const id = getTxt(en.querySelector("id")) || link || `${i}`;
                    const title = getTxt(en.querySelector("title")) || "(no title)";
                    const author =
                        getTxt(en.querySelector("author > name")) ||
                        getTxt(en.querySelector("author"));
                    const pub =
                        parseDateSafe(
                            getTxt(en.querySelector("published")) ||
                            getTxt(en.querySelector("updated"))
                        ) || undefined;

                    const sumHtml =
                        getHtml(en, "summary") ||
                        getHtml(en, "content") ||
                        getTxt(en.querySelector("summary")) ||
                        getTxt(en.querySelector("content")) ||
                        "";

                    const img =
                        getAtomImage(en) ||
                        findFirstImgSrc(sumHtml);

                    const cats = getAtomCategories(en);

                    return {
                        id,
                        title,
                        link: absolutizeUrl(link, base),
                        author,
                        published: pub,
                        summary: stripHtml(sumHtml),
                        sourceTitle: channelTitle,
                        image: absolutizeUrl(img || "", base),
                        categories: cats,
                    };
                });
            }

            // sort by time desc
            parsed.sort(
                (a, b) => (b.published?.getTime() || 0) - (a.published?.getTime() || 0)
            );
            safeSetItems(parsed);
        } catch (e: any) {
            console.error(e);
            if (!mounted.current) return;
            setError(e?.message || "Failed to load feed");
        } finally {
            if (mounted.current) setLoading(false);
        }

        function safeSetItems(parsed: FeedItem[]) {
            if (!mounted.current) return;
            setItems(parsed.slice(0, limit));
        }
    };

    useEffect(() => {
        mounted.current = true;
        fetchFeed();
        return () => {
            mounted.current = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rssUrl, corsProxy, limit]);

    useEffect(() => {
        if (!refreshMs) return;
        const id = setInterval(fetchFeed, refreshMs);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rssUrl, refreshMs, corsProxy, limit]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((it) =>
            [it.title, it.summary, it.author, it.sourceTitle, ...(it.categories || [])]
                .filter(Boolean)
                .some((s) => s!.toLowerCase().includes(q))
        );
    }, [items, query]);

    // Featured = 1 hero + 3 cards kế bên (nếu đủ)
    const featured = filtered.slice(0, 4);
    const rest = filtered.slice(4);

    // Nhóm theo danh mục (lấy top 3 danh mục phổ biến)
    const categoryMap = useMemo(() => {
        const map = new Map<string, FeedItem[]>();
        for (const it of rest) {
            (it.categories || ["Khác"]).forEach((c) => {
                const key = (c || "Khác").trim();
                if (!key) return;
                if (!map.has(key)) map.set(key, []);
                map.get(key)!.push(it);
            });
        }
        // sort từng nhóm theo thời gian
        for (const [k, arr] of map) {
            arr.sort((a, b) => (b.published?.getTime() || 0) - (a.published?.getTime() || 0));
            map.set(k, arr.slice(0, 8)); // mỗi mục hiển thị tối đa 8 bài
        }
        return map;
    }, [rest]);

    const topCategories = useMemo(() => {
        const entries = Array.from(categoryMap.entries());
        entries.sort((a, b) => b[1].length - a[1].length);
        return entries.slice(0, 3);
    }, [categoryMap]);

    return (
        <div className="h-screen bg-[#0A0A0B] text-gray-800 dark:text-gray-100 antialiased overflow-y-auto">
            <header className="sticky top-0 z-20 bg-[#0A0A0B]/70 backdrop-blur border-b border-white/10">
                <div className="mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
                    <div className="flex-1">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Tin tức Công nghệ
                            <span className="ml-2 text-sm text-gray-400 font-normal align-middle">
                                {hostnameFromUrl(rssUrl)}
                            </span>
                        </h1>
                    </div>
                    {/* <div className="hidden md:flex gap-2">
                        {Array.from(new Set((filtered.flatMap(i => i.categories || [])).slice(0, 6))).map((c) => (
                            <span key={c} className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10">
                                {c}
                            </span>
                        ))}
                    </div> */}
                    <div className="relative w-64">
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Tìm bài, tác giả, danh mục…"
                            className="w-full rounded-2xl bg-white/10 focus:bg-white/15 outline-none px-4 py-2 placeholder:text-gray-400"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-1 top-1 rounded-xl px-2 py-1 text-xs bg-white/10 hover:bg-white/20"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        )}
                    </div>
                    <button
                        onClick={fetchFeed}
                        className="rounded-2xl bg-white/10 hover:bg-white/20 px-4 py-2 text-sm"
                    >
                        {loading ? "Loading…" : "Refresh"}
                    </button>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-4 py-6 space-y-10">

                {/* Error */}
                {error && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4">
                        <div className="font-medium">Lỗi nạp feed</div>
                        <div className="text-sm text-red-200">{error}</div>
                        <div className="mt-2 text-xs text-red-300/80">
                            Đã thử nhiều fallback CORS. Bạn có thể truyền <code>corsProxy</code> (vd: <code>https://api.allorigins.win/raw?url=</code>).
                        </div>
                    </div>
                )}

                {/* Featured */}
                {loading && !items.length ? (
                    <SkeletonHero />
                ) : featured.length > 0 ? (
                    <section aria-label="Nổi bật" className="grid gap-4 md:grid-cols-3">
                        {/* Hero big card */}
                        <a
                            href={featured[0].link}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="group md:col-span-2 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-white/0 hover:from-white/10 transition"
                        >
                            <div className="relative aspect-[16/9] bg-white/5">
                                {featured[0].image ? (
                                    <img
                                        src={featured[0].image}
                                        alt=""
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full grid place-items-center text-gray-500">No image</div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent/50 to-transparent" />
                            </div>
                            <div className="p-5 md:p-6">
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    {featured[0].sourceTitle && <span>{featured[0].sourceTitle}</span>}
                                    {featured[0].author && <span>• {featured[0].author}</span>}
                                    {featured[0].published && (
                                        <time dateTime={featured[0].published.toISOString()} className="ml-auto">
                                            {timeAgo(featured[0].published)}
                                        </time>
                                    )}
                                </div>
                                <h2 className="mt-2 text-xl md:text-2xl font-semibold leading-tight hover:text-blue-500">
                                    {featured[0].title}
                                </h2>
                                {featured[0].summary && (
                                    <p className="mt-2 text-sm md:text-base text-gray-300 line-clamp-3">
                                        {featured[0].summary}
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {(featured[0].categories || []).slice(0, 4).map((c) => (
                                        <span key={c} className="px-2.5 py-1 text-[11px] rounded-full bg-white/5 border border-white/10">{c}</span>
                                    ))}
                                </div>
                            </div>
                        </a>

                        {/* 3 compact cards */}
                        <div className="grid gap-4">
                            {featured.slice(1).map((it) => (
                                <a
                                    key={it.id}
                                    href={it.link}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className="group rounded-3xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition"
                                >
                                    <div className="grid grid-cols-3">
                                        <div className="col-span-1 aspect-square bg-white/5">
                                            {it.image ? (
                                                <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                            ) : <div className="h-full w-full grid place-items-center text-gray-500">No image</div>}
                                        </div>
                                        <div className="col-span-2 p-4">
                                            <div className="text-xs text-gray-400 flex items-center gap-2">
                                                {it.sourceTitle && <span className="truncate">{it.sourceTitle}</span>}
                                                {it.published && (
                                                    <time dateTime={it.published.toISOString()} className="ml-auto">
                                                        {timeAgo(it.published)}
                                                    </time>
                                                )}
                                            </div>
                                            <h3 className="mt-1 text-sm md:text-base font-semibold leading-snug hover:text-blue-500">
                                                {it.title}
                                            </h3>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </section>
                ) : null}

                {/* Category sections */}
                {topCategories.map(([cat, arr]) => (
                    <section key={cat} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{cat}</h3>
                            <span className="text-xs text-gray-400">{arr.length} bài</span>
                        </div>
                        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {arr.map((it) => (
                                <li key={it.id} className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition">
                                    <a href={it.link} target="_blank" rel="noreferrer noopener" className="block">
                                        <div className="aspect-[16/9] bg-white/5">
                                            {it.image ? (
                                                <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                            ) : <div className="h-full w-full grid place-items-center text-gray-500">No image</div>}
                                        </div>
                                        <div className="p-4">
                                            <div className="text-[11px] text-gray-400 flex items-center gap-2">
                                                {it.sourceTitle && <span className="truncate">{it.sourceTitle}</span>}
                                                {it.author && <span>• {it.author}</span>}
                                                {it.published && (
                                                    <time dateTime={it.published.toISOString()} className="ml-auto">
                                                        {timeAgo(it.published)}
                                                    </time>
                                                )}
                                            </div>
                                            <h4 className="mt-1 text-sm font-semibold leading-snug hover:text-blue-500">
                                                {it.title}
                                            </h4>
                                            {it.summary && (
                                                <p className="mt-2 text-sm text-gray-300 line-clamp-2">{it.summary}</p>
                                            )}
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}

                {/* Latest (fallback if không có category) */}
                {topCategories.length === 0 && rest.length > 0 && (
                    <section className="space-y-3">
                        <h3 className="text-lg font-semibold">Mới nhất</h3>
                        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {rest.map((it) => (
                                <li key={it.id} className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/10 transition">
                                    <a href={it.link} target="_blank" rel="noreferrer noopener" className="block">
                                        <div className="aspect-[16/9] bg-white/5">
                                            {it.image ? (
                                                <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                                            ) : <div className="h-full w-full grid place-items-center text-gray-500">No image</div>}
                                        </div>
                                        <div className="p-4">
                                            <div className="text-[11px] text-gray-400 flex items-center gap-2">
                                                {it.sourceTitle && <span className="truncate">{it.sourceTitle}</span>}
                                                {it.author && <span>• {it.author}</span>}
                                                {it.published && (
                                                    <time dateTime={it.published.toISOString()} className="ml-auto">
                                                        {timeAgo(it.published)}
                                                    </time>
                                                )}
                                            </div>
                                            <h4 className="mt-1 text-sm font-semibold leading-snug hover:text-blue-500">
                                                {it.title}
                                            </h4>
                                            {it.summary && (
                                                <p className="mt-2 text-sm text-gray-300 line-clamp-2">{it.summary}</p>
                                            )}
                                        </div>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* Empty state */}
                {!loading && !error && filtered.length === 0 && (
                    <div className="text-center text-gray-400 py-16">Không có bài phù hợp.</div>
                )}
            </main>

            <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-xs text-gray-500">
                Dark-first • Ảnh tự bắt từ feed • Danh mục tự động
            </footer>
        </div>
    );
}

/* ================= Helpers ================= */

function getTxt(n: Node | null) {
    return (n?.textContent || "").trim();
}

function getHtml(scope: ParentNode, selector: string): string {
    const element = scope.querySelector(selector);
    return element?.innerHTML || "";
}

function parseDateSafe(s?: string | null) {
    if (!s) return undefined;
    const d = new Date(s);
    return isNaN(d.getTime()) ? undefined : d;
}

function timeAgo(d?: Date) {
    if (!d) return "";
    const diff = Date.now() - d.getTime();
    const sec = Math.round(diff / 1000);
    const mins = Math.round(sec / 60);
    const hrs = Math.round(mins / 60);
    const days = Math.round(hrs / 24);
    if (sec < 60) return `${sec}s ago`;
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
}

function stripHtml(html?: string) {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    tmp.querySelectorAll("script, style, iframe, noscript").forEach((n) => n.remove());
    return (tmp.textContent || "").trim();
}

function hostnameFromUrl(u: string) {
    try {
        const { hostname } = new URL(u);
        return hostname.replace(/^www\./, "");
    } catch {
        return u;
    }
}

function looksLikeJson(text: string) {
    const t = text.trim();
    return t.startsWith("{") || t.startsWith("[");
}

function tryMakeBaseURL(u: string) {
    try {
        return new URL(u);
    } catch {
        return undefined;
    }
}

function absolutizeUrl(link: string, base?: URL) {
    if (!link) return link;
    try {
        return new URL(link, base).toString();
    } catch {
        return link;
    }
}

/* ===== Image & Category extraction ===== */

function getRssImage(scope: ParentNode): string | null {
    // <media:content url="..." /> / <media:thumbnail url="..." />
    const mediaContent = scope.querySelector("media\\:content, content");
    const mediaThumb = scope.querySelector("media\\:thumbnail, thumbnail");
    const enclosure = scope.querySelector("enclosure[type^='image/']");
    const ogImage = scope.querySelector("image > url"); // some RSS
    const url =
        mediaContent?.getAttribute?.("url") ||
        mediaThumb?.getAttribute?.("url") ||
        enclosure?.getAttribute?.("url") ||
        (ogImage ? getTxt(ogImage) : "");
    return url || null;
}

function getAtomImage(scope: ParentNode): string | null {
    // Atom có thể dùng <link rel="enclosure" type="image/*" href="..." />
    const linkImg = scope.querySelector("link[rel='enclosure'][type^='image/']");
    return linkImg?.getAttribute("href") || null;
}

function findFirstImgSrc(html: string): string | null {
    if (!html) return null;
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    const img = tmp.querySelector("img");
    return img?.getAttribute("src") || null;
}

function getRssCategories(scope: ParentNode): string[] {
    const cats = Array.from(scope.querySelectorAll("category")).map((c) => getTxt(c)).filter(Boolean);
    // dc:subject sometimes
    const dc = Array.from(scope.querySelectorAll("dc\\:subject")).map((c) => getTxt(c)).filter(Boolean);
    return Array.from(new Set([...cats, ...dc])).slice(0, 6);
}

function getAtomCategories(scope: ParentNode): string[] {
    const cats = Array.from(scope.querySelectorAll("category")).map((c) => c.getAttribute("term") || getTxt(c)).filter(Boolean);
    return Array.from(new Set(cats)).slice(0, 6);
}

/* ===== JSON Feed parser ===== */

function parseJsonFeed(text: string, baseUrl: string): FeedItem[] {
    const data = JSON.parse(text);
    const title = data.title as string | undefined;
    const base = tryMakeBaseURL(baseUrl);

    const items: FeedItem[] = (data.items || []).map((it: any, i: number) => {
        const link = it.url || it.external_url || "";
        const id = it.id || link || `${i}`;
        const author =
            (it.author && (it.author.name || it.author.url)) ||
            (Array.isArray(it.authors) && it.authors[0] && (it.authors[0].name || it.authors[0].url)) ||
            undefined;
        const pub = parseDateSafe(it.date_published || it.date_modified) || undefined;
        const sumHtml = it.content_html || it.summary || it.content_text || "";
        const img =
            it.image ||
            (Array.isArray(it.attachments)
                ? (it.attachments.find((a: any) => (a.mime_type || "").startsWith("image/"))?.url || "")
                : "") ||
            findFirstImgSrc(sumHtml);

        const tags: string[] = Array.isArray(it.tags) ? it.tags.slice(0, 6) : [];

        return {
            id: String(id),
            title: it.title || "(no title)",
            link: absolutizeUrl(link, base),
            author,
            published: pub,
            summary: stripHtml(sumHtml),
            sourceTitle: title,
            image: absolutizeUrl(img || "", base),
            categories: tags,
        };
    });

    items.sort((a, b) => (b.published?.getTime() || 0) - (a.published?.getTime() || 0));
    return items;
}

/* ===== Fallback fetch with CORS bypass ===== */

async function fetchTextWithFallbacks(url: string, corsProxy?: string) {
    const candidates: string[] = [];

    if (corsProxy) candidates.push(`${corsProxy}${encodeURIComponent(url)}`);

    // r.jina.ai: dạng /https://domain/path?query
    let u: URL;
    try { u = new URL(url); }
    catch { u = new URL(url, window.location.href); }

    if (u.protocol === "https:") {
        candidates.push(`https://r.jina.ai/https://${u.hostname}${u.pathname}${u.search}`);
    } else {
        candidates.push(`https://r.jina.ai/http://${u.hostname}${u.pathname}${u.search}`);
    }

    // AllOrigins
    candidates.push(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);

    let lastErr: any = null;
    for (const c of candidates) {
        try {
            const res = await fetch(c, {
                headers: {
                    Accept: "application/xml, text/xml, application/feed+json, application/json; q=0.9, text/plain; q=0.8, */*; q=0.1",
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            const low = text.toLowerCase();
            if (!text || low.includes("<title>just a moment</title>") || low.includes("cloudflare")) {
                throw new Error("Blocked by upstream (anti-bot)");
            }
            return text;
        } catch (e) {
            lastErr = e;
            continue;
        }
    }
    throw lastErr || new Error("Unable to fetch feed");
}

/* ===== Skeletons ===== */

function SkeletonHero() {
    return (
        <section className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                <div className="aspect-[16/9] bg-white/10 animate-pulse" />
                <div className="p-6 space-y-3">
                    <div className="h-4 w-1/3 bg-white/10 rounded" />
                    <div className="h-6 w-3/4 bg-white/10 rounded" />
                    <div className="h-4 w-full bg-white/10 rounded" />
                </div>
            </div>
            <div className="grid gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
                        <div className="aspect-square bg-white/10 animate-pulse" />
                        <div className="p-4 space-y-2">
                            <div className="h-4 w-2/3 bg-white/10 rounded" />
                            <div className="h-3 w-1/2 bg-white/10 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
