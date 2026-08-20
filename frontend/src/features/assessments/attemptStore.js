function key(id) {
    return `neet_attempt_${id}`;
}
export function saveAttempt(snapshot) {
    localStorage.setItem(key(snapshot.id), JSON.stringify(snapshot));
}
export function loadAttempt(id) {
    try {
        const raw = localStorage.getItem(key(id));
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function clearAttempt(id) {
    localStorage.removeItem(key(id));
}
