export function getYouTubeId(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.replace("/", "").trim();
      return id || null;
    }

    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const embed = u.pathname.match(/\/embed\/([^/]+)/)?.[1];
      if (embed) return embed;
      const shorts = u.pathname.match(/\/shorts\/([^/]+)/)?.[1];
      if (shorts) return shorts;
    }
  } catch {
    // ignore
  }
  return null;
}

export function getYouTubeThumbnail(url: string, quality: "hq" | "mq" | "sd" = "mq") {
  const id = getYouTubeId(url);
  if (!id) return null;
  // mqdefault.jpg (320×180) exists for every YouTube video.
  // hqdefault.jpg (480×360) only exists for videos with a custom thumbnail.
  // Always use mq as the safe default; callers can request hq but should handle 404.
  const file =
    quality === "sd" ? "sddefault.jpg" : quality === "hq" ? "hqdefault.jpg" : "mqdefault.jpg";
  return `https://img.youtube.com/vi/${id}/${file}`;
}

/** Returns the mqdefault URL which is guaranteed to exist for every video. */
export function getYouTubeThumbnailSafe(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

