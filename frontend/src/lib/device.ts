const KEY = "neet_device_v1";

function fallbackId() {
  return `dev_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(KEY);
    if (existing && existing.length >= 8) return existing;

    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : fallbackId();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return fallbackId();
  }
}

