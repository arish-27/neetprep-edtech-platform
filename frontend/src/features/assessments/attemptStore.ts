export type AttemptSnapshot = {
  id: string;
  startedAt: number;
  finishedAt?: number;
  answers: Record<string, number>;
  score?: number;
  total?: number;
};

function key(id: string) {
  return `neet_attempt_${id}`;
}

export function saveAttempt(snapshot: AttemptSnapshot) {
  localStorage.setItem(key(snapshot.id), JSON.stringify(snapshot));
}

export function loadAttempt(id: string): AttemptSnapshot | null {
  try {
    const raw = localStorage.getItem(key(id));
    if (!raw) return null;
    return JSON.parse(raw) as AttemptSnapshot;
  } catch {
    return null;
  }
}

export function clearAttempt(id: string) {
  localStorage.removeItem(key(id));
}

