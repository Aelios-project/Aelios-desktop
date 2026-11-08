// The shared state of the columns: connection status, the chosen resident, the residents and groups, the waiting
// list, the right column (open or not, which panel), the settings sheet and the thread to open.
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
  status: null, residents: [], error: "", alarms: { on: true, alarms: [] },
  search: { q: "", results: [], busy: false, done: false },
  around: null, // { lines, id } while the chat shows one search result
  groups: [], // the group chats, listed under the residents
  group: "", // the group open in the middle column, instead of the resident chat
  rail: true, // ours covers DSH's whole left column; false hands it back to DSH
  shown: false, // whether our own panel is the one DSH is drawing
  waiting: { items: [], open: 0, unread: {} },
  threads: { open: 0 }, // how many threads are at work or wait for the person: the Threads tab's number
  right: { open: true, panel: "waiting", overlay: false, width: 0 }, // width 0: the default; dragged or widened, a number
  view: "chat", // what the middle column shows: "chat" (the resident or a group) or "machine" (this machine)
  // What only this machine knows (client/local-api.mjs). wired is false until the host answers these calls.
  local: { wired: null, machine: null, sessions: [] },
  sheet: "", // the settings section open in the sheet; "" when the sheet is closed
  groupSheet: null, // { id } to edit a group, { id: "" } for a new one, null when closed
  lang: "", // bumped when the reader picks a language, so everything draws again
  focus: "", // the thread the right panel should open
});
