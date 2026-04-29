from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse


def extract_youtube_id(url: str) -> str | None:
  try:
    u = urlparse(url)
    host = (u.hostname or "").replace("www.", "").lower()

    if host == "youtu.be":
      vid = (u.path or "").strip("/").split("/")[0]
      return vid or None

    if host.endswith("youtube.com"):
      q = parse_qs(u.query or "")
      if q.get("v"):
        vid = str(q["v"][0]).strip()
        return vid or None

      m = re.search(r"/embed/([^/?#]+)", u.path or "")
      if m:
        return m.group(1)

      m = re.search(r"/shorts/([^/?#]+)", u.path or "")
      if m:
        return m.group(1)
  except Exception:
    return None

  return None

