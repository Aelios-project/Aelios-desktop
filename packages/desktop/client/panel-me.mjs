// The "Me" panel: who this resident is, its model, its persona (read and written through /web/persona), and the
// helper on this machine with the reason it stands the way it does. The runner states are the supervisor's.
import { createElement as h, useEffect, useState } from "react";
import { call, web } from "./api.mjs";
import { Face } from "./face.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 15000;

export function MePanel() {
  const t = words();
  const { status, residents } = useStore(store);
  const resident = status?.resident || "default";
  const me = residents.find((r) => r.id === resident) || { id: resident, name: t.title };
  const runner = status?.runner || { state: "unpaired", error: "" };
  const [model, setModel] = useState(null);
  const [persona, setPersona] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [m, p] = await Promise.all([web("/web/model", { resident }), web("/web/persona", { resident })]);
        setModel(m);
        setPersona(p?.text || "");
        setDraft((was) => (was || p?.text || ""));
      } catch (e) { setError(e.message); }
    };
    void load();
    const timer = setInterval(() => { if (!document.hidden) void load(); }, POLL_MS);
    return () => clearInterval(timer);
  }, [resident]);

  const act = (key, job) => async () => {
    if (busy) return;
    setBusy(key);
    setError("");
    setNote("");
    try { await job(); setNote(t.personaSaved); } catch (e) { setError(e.message); } finally { setBusy(""); }
  };
  const savePersona = act("persona", async () => {
    const saved = await web("/web/persona", { method: "POST", body: { text: draft }, resident });
    setPersona(saved?.text ?? draft);
  });
  const pair = act("pair", async () => store.set({ status: await call("repair") }));
  const start = act("start", async () => store.set({ status: await call("start") }));
  const off = act("off", async () => store.set({ status: await call("disconnect") }));

  return h("div", { className: "ad-panel" },
    h("div", { className: "ad-me-head" },
      h(Face, { resident: me, base: status?.url }),
      h("div", null, h("b", null, me.name || me.id), h("span", { className: "ad-sub" }, me.id))),
    h("p", { className: "ad-me-line" }, h("span", null, t.model), h("code", null, model?.model || model?.fallback || "—")),
    h("div", { className: "ad-me-block" },
      h("label", { className: "ad-me-label", htmlFor: "ad-persona" }, t.persona),
      h("textarea", { id: "ad-persona", className: "ad-me-text", rows: 6, value: draft, placeholder: persona || "…", onChange: (e) => setDraft(e.target.value) }),
      h("div", { className: "ad-links" },
        h("button", { type: "button", className: "ad-btn small", disabled: Boolean(busy) || draft === persona, onClick: savePersona }, t.savePersona))),
    h("div", { className: "ad-me-block" },
      h("p", { className: "ad-me-label" }, t.runnerTitle),
      h("p", { className: `ad-me-state s-${runner.state}` }, t.runner[runner.state] || runner.state, runner.error ? ` · ${runner.error}` : ""),
      h("p", { className: "ad-hint" }, t.whyRunner),
      h("div", { className: "ad-links" },
        h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: pair }, t.pair),
        runner.state !== "running" && h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: start }, t.start),
        h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: off }, t.disconnect))),
    note && h("p", { className: "ad-hint" }, note),
    error && h("div", { className: "ad-error", role: "alert" }, error));
}