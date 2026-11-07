// The shared state of the columns: connection status, the chosen resident, the residents list,
// the waiting list, the right column (open or not, which panel) and the thread to open.
import { useSyncExternalStore } from "react";

export function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set(patch) { state = { ...state, ...patch }; listeners.forEach((f) => f()); },
    subscribe(f) { listeners.add(f); return () => listeners.delete(f); },
  };
}

export const useStore = (store) => useSyncExternalStore(store.subscribe, store.get);

export const store = createStore({
  status: null, residents: [], error: "",
  waiting: { items: [], open: 0 },
  right: { open: true, panel: "waiting" },
  focus: "", // the thread the right panel should open
});
