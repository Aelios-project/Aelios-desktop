// Read something now and again every `ms` while the window is visible; stop when the component goes.
import { useEffect } from "react";

export function usePoll(load, ms, deps) {
  useEffect(() => {
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, ms);
    return () => clearInterval(timer);
  }, deps);
}
