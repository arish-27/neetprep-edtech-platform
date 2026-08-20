import { useEffect, useMemo, useState } from "react";
import { getYouTubeId } from "@/lib/video";
const CACHE_KEY = "neet_youtube_meta_v1";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12h
function parseIsoDurationSeconds(iso) {
    const m = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!m)
        return undefined;
    const h = Number(m[1] ?? 0);
    const min = Number(m[2] ?? 0);
    const s = Number(m[3] ?? 0);
    const total = h * 3600 + min * 60 + s;
    return Number.isFinite(total) ? total : undefined;
}
function loadCache() {
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw)
            return { updatedAt: 0, items: {} };
        const parsed = JSON.parse(raw);
        return {
            updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
            items: parsed.items && typeof parsed.items === "object" ? parsed.items : {},
        };
    }
    catch {
        return { updatedAt: 0, items: {} };
    }
}
function saveCache(cache) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    }
    catch {
        // ignore
    }
}
async function fetchMeta(ids, apiKey) {
    if (!ids.length)
        return {};
    const url = new URL("https://www.googleapis.com/youtube/v3/videos");
    url.searchParams.set("part", "snippet,contentDetails");
    url.searchParams.set("id", ids.join(","));
    url.searchParams.set("key", apiKey);
    const resp = await fetch(url.toString());
    if (!resp.ok)
        throw new Error(`YouTube API error (${resp.status})`);
    const data = (await resp.json());
    const items = Array.isArray(data?.items) ? data.items : [];
    const out = {};
    for (const it of items) {
        const id = String(it?.id ?? "");
        if (!id)
            continue;
        const snippet = it?.snippet ?? {};
        const details = it?.contentDetails ?? {};
        const thumbs = snippet?.thumbnails ?? {};
        const thumb = thumbs?.maxres?.url ?? thumbs?.standard?.url ?? thumbs?.high?.url ?? thumbs?.medium?.url ?? thumbs?.default?.url;
        out[id] = {
            title: String(snippet?.title ?? ""),
            description: String(snippet?.description ?? ""),
            channelTitle: String(snippet?.channelTitle ?? ""),
            durationSeconds: typeof details?.duration === "string" ? parseIsoDurationSeconds(details.duration) : undefined,
            thumbnailUrl: typeof thumb === "string" ? thumb : undefined,
        };
    }
    return out;
}
export function useYouTubeVideoMeta(urls) {
    const apiKey = import.meta.env?.VITE_YOUTUBE_API_KEY;
    const videoIds = useMemo(() => {
        const ids = urls
            .map((u) => getYouTubeId(u))
            .filter(Boolean);
        return Array.from(new Set(ids));
    }, [urls]);
    const [loading, setLoading] = useState(false);
    const [metaById, setMetaById] = useState(() => loadCache().items);
    useEffect(() => {
        if (!apiKey)
            return;
        if (!videoIds.length)
            return;
        const cache = loadCache();
        const expired = Date.now() - cache.updatedAt > CACHE_TTL_MS;
        const base = expired ? {} : cache.items;
        const missing = videoIds.filter((id) => !base[id]);
        if (missing.length === 0) {
            setMetaById(base);
            return;
        }
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const chunks = [];
                for (let i = 0; i < missing.length; i += 50)
                    chunks.push(missing.slice(i, i + 50));
                const results = await Promise.all(chunks.map((c) => fetchMeta(c, apiKey)));
                const merged = results.reduce((acc, cur) => ({ ...acc, ...cur }), {});
                const next = { ...base, ...merged };
                if (cancelled)
                    return;
                setMetaById(next);
                saveCache({ updatedAt: Date.now(), items: next });
            }
            catch {
                // ignore network / quota errors
            }
            finally {
                if (!cancelled)
                    setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [apiKey, videoIds]);
    return { loading, metaById, hasApiKey: Boolean(apiKey) };
}
