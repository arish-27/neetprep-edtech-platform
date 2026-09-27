import { useEffect, useState } from "react";
export function useLocalStorageState(key, initial) {
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null)
                return initial; // key never set → use initial
            const parsed = JSON.parse(raw);
            // If stored value is an empty array and initial is non-empty, use initial
            if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(initial) && initial.length > 0) {
                return initial;
            }
            return parsed;
        }
        catch {
            return initial;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        }
        catch {
            // ignore
        }
    }, [key, value]);
    return [value, setValue];
}
