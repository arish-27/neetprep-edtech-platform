/**
 * Returns true once the Zustand persist store has finished rehydrating
 * from localStorage.
 *
 * localStorage is synchronous, so Zustand's persist middleware rehydrates
 * synchronously on the first render. `hasHydrated()` is true immediately
 * after the store is created — before any React component renders.
 *
 * The `onFinishHydration` subscription handles the rare async case.
 */
import { useEffect, useState } from "react";
import { useAppStore } from "@/state/useAppStore";
export function useHydrated() {
    const [hydrated, setHydrated] = useState(
    // localStorage is sync — this is true on first call in 99% of cases
    () => useAppStore.persist.hasHydrated());
    useEffect(() => {
        // Already hydrated — nothing to do
        if (hydrated)
            return;
        // Subscribe in case hydration finishes after this effect runs
        const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
        // Double-check: may have finished between render and this effect
        if (useAppStore.persist.hasHydrated())
            setHydrated(true);
        return unsub;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return hydrated;
}
