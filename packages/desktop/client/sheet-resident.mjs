// The settings sheet's first section: who the resident is. Its face, name, model and persona; the letter that packs
// the older conversation; and, for any resident but the first, deleting it (two presses). Written through /web/avatar,
// /web/config, /web/model, /web/persona, /web/letter/retry and /web/residents/remove.
import { createElement as h, useEffect, useRef, useState } from "react";
import { call, upload, web } from "./api.mjs";
import { readFace } from "./attach.mjs";
import { Face } from "./face.mjs";
import { Icon } from "./icons.mjs";
import { Explained } from "./info.mjs";
import { modelRows } from "./settings.mjs";
import { store, useStore } from "./store.mjs";
import { words } from "./strings.mjs";

function Letter({ letter, t, onRetry, busy }) {
  const d = letter?.delivery || {};
  const written = Boolean(letter?.write);
  return h("div", { className: "ad-sheet-block" },
    h(Explained, { className: "ad-sheet-subhead", text: t.letterInfo, head: h("span", { className: "ad-label" }, h(Icon, { name: "mail" }), t.letter) }),
    h("div", { className: "ad-card-row" },
      h("span", { className: `ad-pill ${written ? "ok" : "idle"}` }, h("span", { className: `ad-dot ${written ? "ok" : "idle"}` }), written ? t.letterState.written : t.letterState.none),
      d.pending > 0 && h("span", { className: "ad-mi", title: t.onItsWay }, h("span", { className: "ad-dot warn live" }), d.pending),
      d.failed > 0 && h("span", { className: "ad-mi", title: t.failedToSend }, h("span", { className: "ad-dot bad" }), d.failed),
      d.blocked > 0 && h("span", { className: "ad-mi", title: t.blocked }, h("span", { className: "ad-dot bad" }), d.blocked),
      h("span", { className: "sp" }),
      letter?.canRetry && h("button", { type: "button", className: "ad-btn quiet small", disabled: busy, onClick: onRetry }, h(Icon, { name: "refresh" }), t.retryLetter)),
    d.latest?.lastError && h("p", { className: "ad-hint" }, d.latest.lastError));
}

export function ResidentSection({ rows, reload }) {
  const t = words();
  const { status, residents } = useStore(store);
  const resident = status?.resident || "default";
  const me = residents.find((r) => r.id === resident) || { id: resident, name: t.title };
  const [name, setName] = useState(me.name || "");
  const [models, setModels] = useState(null);
  const [model, setModel] = useState({ now: "", saved: "" });
  const [persona, setPersona] = useState({ draft: "", saved: "" });
  const [letter, setLetter] = useState(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [sure, setSure] = useState(false);
  const face = useRef(null);

  useEffect(() => {
    void (async () => {
      const [m, md, p, lt] = await Promise.allSettled([web("/web/models", { resident }), web("/web/model", { resident }), web("/web/persona", { resident }), web("/web/letter", { resident })]);
      if (m.status === "fulfilled") setModels(modelRows(m.value?.models));
      if (md.status === "fulfilled") { const now = md.value?.model || md.value?.fallback || ""; setModel({ now, saved: now }); }
      if (p.status === "fulfilled") setPersona({ draft: p.value?.text || "", saved: p.value?.text || "" });
      if (lt.status === "fulfilled") setLetter(lt.value);
    })();
  }, [resident]);
  useEffect(() => setName(me.name || ""), [me.name]);

  const act = (key, job) => async () => {
    if (busy) return;
    setBusy(key); setNote("");
    try { await job(); setNote(t.saved); } catch (e) { setNote(e.message); } finally { setBusy(""); }
  };
  const residentsAgain = async () => store.set({ residents: (await web("/web/residents", { resident: "default" }))?.residents || [] });
  const saveName = act("name", async () => { await web("/web/config", { method: "POST", body: { key: "RESIDENT_NAME", text: name }, resident }); await residentsAgain(); reload(); });
  const saveModel = act("model", async () => { await web("/web/model", { method: "POST", body: { text: model.now }, resident }); setModel({ ...model, saved: model.now }); });
  const savePersona = act("persona", async () => { const saved = await web("/web/persona", { method: "POST", body: { text: persona.draft }, resident }); setPersona({ draft: saved?.text ?? persona.draft, saved: saved?.text ?? persona.draft }); });
  const pickFace = act("face", async () => { const file = face.current?.files?.[0]; if (!file) return; const pic = await readFace(file); await upload("/web/avatar", pic.data, pic.type, { resident }); await residentsAgain(); });
  const dropFace = act("drop", async () => { await upload("/web/avatar/remove", "", "application/json", { resident }); await residentsAgain(); });
  const remove = act("remove", async () => {
    if (!sure) { setSure(true); return; }
    await web("/web/residents/remove", { method: "POST", body: { id: resident }, resident: "default" });
    store.set({ sheet: "", status: await call("select", { resident: "default" }) });
    await residentsAgain();
  });

  return h("div", { className: "ad-sheet-sections" },
    h("div", { className: "ad-sheet-me" },
      h(Face, { resident: me, base: status?.url }),
      h("div", null, h("b", null, me.name || me.id), h("span", null, me.id)),
      h("input", { ref: face, type: "file", accept: "image/*", hidden: true, onChange: () => pickFace() }),
      h("button", { type: "button", className: "ad-btn quiet small", onClick: () => face.current?.click() }, h(Icon, { name: "pencil" }), t.setFace),
      me.avatar && h("button", { type: "button", className: "ad-icon-btn sm danger", title: t.dropFace, "aria-label": t.dropFace, onClick: dropFace }, h(Icon, { name: "trash" }))),
    h("div", { className: "ad-sheet-block" },
      h("div", { className: "ad-field-row" }, h("label", null, t.name),
        h("div", { className: "ad-set-line" }, h("input", { value: name, "aria-label": t.name, onChange: (e) => setName(e.target.value) }),
          h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy) || name === (me.name || ""), onClick: saveName }, t.save))),
      h("div", { className: "ad-field-row" }, h("label", null, t.model),
        h("div", { className: "ad-set-line" },
          models?.length
            ? h("select", { value: model.now, "aria-label": t.model, onChange: (e) => setModel({ ...model, now: e.target.value }) }, models.map((m) => h("option", { key: m.id, value: m.id }, m.name)))
            : h("input", { value: model.now, "aria-label": t.model, onChange: (e) => setModel({ ...model, now: e.target.value }) }),
          h("button", { type: "button", className: "ad-btn quiet small", disabled: Boolean(busy) || model.now === model.saved, onClick: saveModel }, t.save))),
      h("div", { className: "ad-field-row" }, h("label", { htmlFor: "ad-persona" }, t.persona),
        h("textarea", { id: "ad-persona", className: "ad-persona", rows: 6, value: persona.draft, onChange: (e) => setPersona({ ...persona, draft: e.target.value }) }),
        h("div", { className: "ad-card-row" }, h("span", { className: "sp" }),
          h("button", { type: "button", className: "ad-btn small", disabled: Boolean(busy) || persona.draft === persona.saved, onClick: savePersona }, t.save)))),
    h(Letter, { letter, t, busy: Boolean(busy), onRetry: act("letter", async () => setLetter(await web("/web/letter/retry", { method: "POST", body: {}, resident }))) }),
    note && h("p", { className: "ad-hint" }, note),
    resident !== "default" && h("div", { className: "ad-card-row" }, h("span", { className: "sp" }),
      h("button", { type: "button", className: "ad-btn quiet small danger", onClick: remove }, h(Icon, { name: "trash" }), sure ? t.sureDelete : t.removeResident)));
}
