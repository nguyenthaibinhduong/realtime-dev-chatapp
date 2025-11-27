import React, { useEffect, useState } from "react";

// Normalized metadata for consistent rendering
interface MetaData {
    title?: string;
    description?: string;
    imageUrl?: string;
    logoUrl?: string;
    publisher?: string;
    author?: string;
    date?: string;
    url?: string;
}

export default function LinkPreview({ url }: { url: string }) {
    const [meta, setMeta] = useState<MetaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        setMeta(null);

        fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
            .then((res) => res.json())
            .then((data) => {
                const raw = data?.data || data || {};

                // Normalize various possible API shapes
                const imageUrl =
                    (typeof raw.image === "string" && raw.image) ||
                    (raw.image && raw.image.url) ||
                    (raw.image && raw.image.logo) ||
                    (raw.logo && raw.logo.url) ||
                    undefined;

                const logoUrl =
                    (typeof raw.logo === "string" && raw.logo) ||
                    (raw.logo && raw.logo.url) ||
                    undefined;

                const normalized: MetaData = {
                    title: raw.title || raw.publisher || raw.siteName || undefined,
                    description: raw.description || raw.text || undefined,
                    imageUrl: imageUrl,
                    logoUrl: logoUrl,
                    publisher: raw.publisher || raw.siteName || undefined,
                    author: raw.author || undefined,
                    date: raw.date || undefined,
                    url: raw.url || undefined,
                };

                setMeta(normalized);
                setLoading(false);
            })
            .catch((err) => {
                setError("Không thể lấy thông tin link");
                setLoading(false);
            });
    }, [url]);

    if (loading) return null;
    if (error || !meta) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block border w-[20vw] rounded-lg bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-gray-700 p-3 mt-2 hover:bg-gray-100 dark:hover:bg-zinc-800 transition"
            style={{ textDecoration: "none" }}
        >
            <div className="flex gap-3 items-center">
                {meta.imageUrl || meta.logoUrl ? (
                    <img
                        src={meta.imageUrl || meta.logoUrl || ""}
                        alt={meta.title || url}
                        className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-700 flex-shrink-0"
                    />
                ) : null}
                <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 dark:text-white truncate">
                        {meta.title || url}
                    </div>
                    {meta.publisher && (
                        <div className="text-xs text-blue-500 dark:text-blue-400 font-medium truncate">
                            {meta.publisher}
                        </div>
                    )}
                    {meta.date && (
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(meta.date).toLocaleString()}
                        </div>
                    )}
                    {meta.description && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {meta.description}
                        </div>
                    )}
                </div>
            </div>
        </a>
    );
}
