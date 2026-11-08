// The Settings panel: the resident's face and name, its model, its persona, every setting it keeps behind the web
// door, and the helper on this machine. Written through /web/avatar, /web/config, /web/model and /web/persona.
import { createElement as h, useEffect, useRef, useState } from "react";
import { call, upload, web } from "./api.mjs";
import { readFace } from "./attach.mjs";
import { Face } from "./face.mjs";
import { mcpRows } from "./mcp.mjs";
import { modelRows, settingRows } from "./settings.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

const POLL_MS = 20000;

/** One line about the letter that packs the older conversation. */
function letterNote(letter, t) {
  if (!letter) return "";
  const d = letter.delivery || {};
  const wrote = letter.write ? `${t.written}${letter.write.state ? ` (${letter.write.state})` : ""}` : t.noLetter;
  const parts = [wrote];
  if (d.pending) parts.push(`${d.pending} ${t.onItsWay}`);
  if (d.failed) parts.push(`${d.failed} ${t.failedToSend}`);
  if (d.blocked) parts.push(`${d.blocked} ${t.blocked}`);
  if (d.latest?.lastError) parts.push(d.latest.lastError);
  return parts.join(" · ");
}

function Row({ row, resident }) {
  const t = words();
  const [draft, setDraft] = useState(row.value);
  const [state, setState] = useState("");
  useEffect(() => setDraft(row.value), [row.value]);
  const changed = draft !== row.value;
  const save = async () => {
    setState("…");
    try {
      await web("/web/config", { method: "POST", body: { key: row.key, text: draft === row.value ? "" : draft }, resident });
      setState(t.personaSaved);
    } catch (e) { setState(e.message); }
  };
  const field = row.choices.length
    ? h("select", { value: draft, onChange: (e) => setDraft(e.target.value) }, ["", ...row.choices].map((c) => h("option", { key: c, value: c }, c || "—")))
    : h("input", { type: row.secret ? "password" : "text", value: draft, placeholder: row.secret ? "saved on the resident" : "", onChange: (e) => setDraft(e.target.value) });
  return h("div", { className: "ad-set-row" },
    h("label", { className: "ad-me-label" }, row.label),
    h("div", { className: "ad-set-line" }, field,
      h("button", { type: "button", className: "ad-btn quiet small", disabled: !changed, onClick: save }, t.save)),
    state && h("span", { className: "ad-hint" }, state));
}

export function SettingsPanel() {
  const t = words();
  const { status, residents } = useStore(store);
  const resident = status?.resident || "default";
  const me = residents.find((r) => r.id === resident) || { id: resident, name: t.title };
  const [name, setName] = useState("");
  const [models, setModels] = useState(null);
  const [model, setModel] = useState("");
  const [savedModel, setSavedModel] = useState("");
  const [rows, setRows] = useState([]);
  const [letter, setLetter] = useState(null);
  const [mcp, setMcp] = useState(null);
  const [newMcp, setNewMcp] = useState({ name: "", url: "", key: "" });
  const [persona, setPersona] = useState("");
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const face = useRef(null);

  const load = async () => {
    const [c, m, p, md, lt] = await Promise.allSettled([
      web("/web/config", { resident }), web("/web/models", { resident }),
      web("/web/persona", { resident }), web("/web/model", { resident }),
      web("/web/letter", { resident }),
    ]);
    if (lt.status === "fulfilled") setLetter(lt.value);
    try { setMcp(mcpRows((await web("/web/mcp", { resident }))?.servers)); } catch { /* keep the last list */ }
    if (c.status === "fulfilled") {
      const list = settingRows(c.value);
      setRows(list);
      setName(list.find((r) => r.key === "RESIDENT_NAME")?.value || "");
    }
    if (m.status === "fulfilled") setModels(modelRows(m.value?.models));
    if (p.status === "fulfilled") { setPersona(p.value?.text || ""); setDraft((was) => was || p.value?.text || ""); }
    if (md.status === "fulfilled") { const now = md.value?.model || md.value?.fallback || ""; setModel((was) => was || now); setSavedModel(now); }
  };
  useEffect(() => {
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
  const saveName = act("name", async () => { await web("/web/config", { method: "POST", body: { key: "RESIDENT_NAME", text: name }, resident }); await load(); });
  const saveModel = act("model", async () => { await web("/web/model", { method: "POST", body: { text: model }, resident }); });
  const savePersona = act("persona", async () => { const saved = await web("/web/persona", { method: "POST", body: { text: draft }, resident }); setPersona(saved?.text ?? draft); });
  const pickFace = act("face", async () => {
    const file = face.current?.files?.[0];
    if (!file) return;
    const picture = await readFace(file);
    await upload("/web/avatar", picture.data, picture.type, { resident });
    store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] });
  });
  const dropFace = act("drop", async () => { await upload("/web/avatar/remove", "", "application/json", { resident }); });
  const runner = status?.runner || { state: "unpaired", error: "" };

  return h("div", { className: "ad-panel" },
    h("div", { className: "ad-me-head" },
      h(Face, { resident: me, base: status?.url }),
      h("div", null, h("b", null, me.name || me.id), h("span", { className: "ad-sub" }, me.id)),
      h("input", { ref: face, type: "file", accept: "image/*", hidden: true, onChange: () => pickFace() }),
      h("button", { type: "button", className: "ad-icon-btn sm", title: t.setFace, "aria-label": t.setFace, onClick: () => face.current?.click() }, h("span", { className: "ad-plus" }, "+")),
      me.avatar && h("button", { type: "button", className: "ad-icon-btn sm", title: t.dropFace, "aria-label": t.dropFace, onClick: dropFace }, "×")),
    h("div", { className: "ad-set-row" },
      h("label", { className: "ad-me-label" }, t.name),
      h("div", { className: "ad-set-line" }, h("input", { type: "text", value: name, onChange: (e) => setName(e.target.value) }),
        h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy) || name === (me.name || ""), onClick: saveName }, t.save))),
    h("div", { className: "ad-set-row" },
      h("label", { className: "ad-me-label" }, t.model),
      h("div", { className: "ad-set-line" },
        models && models.length
          ? h("select", { value: model, onChange: (e) => setModel(e.target.value) }, models.map((m) => h("option", { key: m.id, value: m.id }, m.name)))
          : h("input", { type: "text", value: model, onChange: (e) => setModel(e.target.value) }),
        h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy) || model === savedModel, onClick: saveModel }, t.save))),
    h("div", { className: "ad-me-block" },
      h("label", { className: "ad-me-label", htmlFor: "ad-persona" }, t.persona),
      h("textarea", { id: "ad-persona", className: "ad-me-text", rows: 5, value: draft, onChange: (e) => setDraft(e.target.value) }),
      h("div", { className: "ad-links" }, h("button", { type: "button", className: "ad-btn small", disabled: Boolean(busy) || draft === persona, onClick: savePersona }, t.savePersona))),
    h("button", { type: "button", className: "ad-set-fold", "aria-expanded": open, onClick: () => setOpen((v) => !v) }, `${t.moreSettings} · ${rows.length}`, h("span", null, open ? "▾" : "▸")),
    open && rows.filter((row) => row.key !== "RESIDENT_NAME").map((row) => h(Row, { key: row.key, row, resident })),
    h("div", { className: "ad-me-block" },
      h("p", { className: "ad-me-label" }, t.mcp),
      mcp === null ? h("p", { className: "ad-hint" }, "…")
        : mcp.length === 0 ? h("p", { className: "ad-hint" }, t.noMcp)
          : mcp.map((server) => h("div", { key: server.id, className: "ad-mcp" },
            h("div", { className: "ad-set-line" },
              h("span", { className: "ad-mcp-name", title: server.host }, server.name),
              h("span", { className: `ad-pill${server.state === "ready" ? " ok" : server.error ? " bad" : ""}` }, server.state === "ready" ? `${server.tools} ${t.tools}` : server.word)),
            server.error && h("span", { className: "ad-hint" }, server.error),
            h("div", { className: "ad-links" },
              server.authUrl && h("a", { className: "ad-btn quiet small", href: server.authUrl, target: "_blank", rel: "noopener noreferrer" }, t.signIn),
              h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy),
                onClick: act(`mcp-${server.id}`, async () => setMcp(mcpRows((await web("/web/mcp/retry", { method: "POST", body: { id: server.id }, resident }))?.servers))) }, t.retryIt),
              h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy),
                onClick: act(`drop-${server.id}`, async () => setMcp(mcpRows((await web("/web/mcp/remove", { method: "POST", body: { id: server.id }, resident }))?.servers))) }, t.drop)))),
      h("div", { className: "ad-set-row" },
        h("label", { className: "ad-me-label" }, t.addMcp),
        h("div", { className: "ad-set-line" }, h("input", { type: "text", placeholder: t.mcpName, value: newMcp.name, onChange: (e) => setNewMcp({ ...newMcp, name: e.target.value }) })),
        h("div", { className: "ad-set-line" }, h("input", { type: "text", placeholder: "https://…", value: newMcp.url, onChange: (e) => setNewMcp({ ...newMcp, url: e.target.value }) })),
        h("div", { className: "ad-set-line" }, h("input", { type: "password", placeholder: t.mcpKey, value: newMcp.key, onChange: (e) => setNewMcp({ ...newMcp, key: e.target.value }) }),
          h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy) || !newMcp.url,
            onClick: act("add-mcp", async () => { const saved = await web("/web/mcp", { method: "POST", body: { name: newMcp.name, url: newMcp.url, key: newMcp.key }, resident }); setMcp(mcpRows(saved?.servers)); setNewMcp({ name: "", url: "", key: "" }); }) }, t.save)))),
    h("div", { className: "ad-me-block" },
      h("p", { className: "ad-me-label" }, t.letter),
      h("p", { className: "ad-hint" }, letterNote(letter, t)),
      letter?.canRetry && h("div", { className: "ad-links" },
        h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy),
          onClick: act("letter", async () => setLetter(await web("/web/letter/retry", { method: "POST", body: {}, resident }))) }, t.retryLetter))),
    h("div", { className: "ad-me-block" },
      h("p", { className: "ad-me-label" }, t.runnerTitle),
      h("p", { className: `ad-me-state s-${runner.state}` }, t.runner[runner.state] || runner.state, runner.error ? ` · ${runner.error}` : ""),
      h("p", { className: "ad-hint" }, t.whyRunner),
      h("div", { className: "ad-links" },
        h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: act("pair", async () => store.set({ status: await call("repair") })) }, t.pair),
        runner.state !== "running" && h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: act("start", async () => store.set({ status: await call("start") })) }, t.start),
        h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy), onClick: act("off", async () => store.set({ status: await call("disconnect") })) }, t.disconnect))),
    note && h("p", { className: "ad-hint" }, note),
    error && h("div", { className: "ad-error", role: "alert" }, error));
}
