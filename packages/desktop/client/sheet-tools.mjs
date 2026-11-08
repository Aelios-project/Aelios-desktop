// The settings sheet's Web & tools extras: the MCP servers the resident can call (state, tool count, sign in,
// retry, remove, connect one) and the site keys it sends when it reads a site (/web/mcp*, /web/sites*).
import { createElement as h, useEffect, useState } from "react";
import { web } from "./api.mjs";
import { Icon } from "./icons.mjs";
import { Explained } from "./info.mjs";
import { mcpRows } from "./mcp.mjs";
import { words } from "./strings.mjs";

function useList(path, resident, pick) {
  const [list, setList] = useState(null);
  useEffect(() => { void web(path, { resident }).then((d) => setList(pick(d))).catch(() => setList([])); }, [resident]);
  return [list, setList];
}

export function McpBlock({ resident }) {
  const t = words();
  const [servers, setServers] = useList("/web/mcp", resident, (d) => mcpRows(d?.servers));
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const post = (path, body) => async () => {
    try { const d = await web(path, { method: "POST", body, resident }); if (d?.error) throw new Error(d.error); setServers(mcpRows(d?.servers)); setError(""); return true; } catch (e) { setError(e.message); return false; }
  };
  const add = async (e) => { e.preventDefault(); if (await post("/web/mcp", form)()) setForm(null); };
  return h("div", { className: "ad-sheet-block" },
    h(Explained, { className: "ad-sheet-subhead", text: t.mcpInfo, head: [h("span", { key: "l", className: "ad-label" }, h(Icon, { name: "plug" }), t.mcp), h("span", { key: "s", className: "sp" }),
      h("button", { key: "a", type: "button", className: "ad-btn quiet small", "aria-expanded": Boolean(form), onClick: () => setForm(form ? null : { name: "", url: "", key: "" }) }, h(Icon, { name: "plus" }), t.addMcp)] }),
    form && h("form", { className: "ad-sheet-form", onSubmit: add },
      h("input", { autoFocus: true, placeholder: t.mcpName, "aria-label": t.mcpName, value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }) }),
      h("input", { placeholder: "https://…", "aria-label": "URL", value: form.url, onChange: (e) => setForm({ ...form, url: e.target.value }) }),
      h("input", { type: "password", placeholder: t.mcpKey, "aria-label": t.mcpKey, value: form.key, onChange: (e) => setForm({ ...form, key: e.target.value }) }),
      h("button", { type: "submit", className: "ad-btn small", disabled: !form.url }, t.save)),
    servers === null ? h("p", { className: "ad-hint" }, "…") : servers.length === 0 ? h("p", { className: "ad-hint" }, t.noMcp)
      : servers.map((s) => {
        const tone = s.state === "ready" ? "ok" : s.state === "authenticating" ? "hot" : "bad";
        return h("div", { key: s.id, className: "ad-list-row" },
          h("span", { className: "n", title: s.host }, s.name, h("small", null, s.host)),
          h("span", { className: `ad-pill ${tone}` }, h("span", { className: `ad-dot ${tone}` }), t.mcpState[s.state] || t.mcpState.off),
          s.state === "ready" && h("span", { className: "ad-mi", title: `${s.tools} ${t.tools}` }, h(Icon, { name: "wrench" }), s.tools),
          s.authUrl && h("a", { className: "ad-btn small", href: s.authUrl, target: "_blank", rel: "noopener noreferrer" }, t.signIn),
          h("button", { type: "button", className: "ad-icon-btn sm", title: t.retryIt, "aria-label": t.retryIt, onClick: post("/web/mcp/retry", { id: s.id }) }, h(Icon, { name: "refresh" })),
          h("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: post("/web/mcp/remove", { id: s.id }) }, h(Icon, { name: "trash" })),
          s.error && h("p", { className: "ad-error full" }, s.error));
      }),
    error && h("p", { className: "ad-error" }, error));
}

export function SitesBlock({ resident }) {
  const t = words();
  const [sites, setSites] = useList("/web/sites", resident, (d) => d?.sites || []);
  const [form, setForm] = useState({ site: "", key: "" });
  const [error, setError] = useState("");
  const post = async (path, body) => {
    try { const d = await web(path, { method: "POST", body, resident }); if (d?.error) throw new Error(d.error); setSites(d?.sites || []); setError(""); return true; } catch (e) { setError(e.message); return false; }
  };
  const add = async (e) => { e.preventDefault(); if (await post("/web/sites", form)) setForm({ site: "", key: "" }); };
  return h("div", { className: "ad-sheet-block" },
    h(Explained, { className: "ad-sheet-subhead", text: t.sitesInfo, head: h("span", { className: "ad-label" }, h(Icon, { name: "globe" }), t.sites) }),
    (sites || []).map((s) => h("div", { key: s.host, className: "ad-list-row" },
      h("span", { className: "n" }, s.host, h("small", null, (s.names || []).join(" · "))),
      h("button", { type: "button", className: "ad-icon-btn sm danger", title: t.drop, "aria-label": t.drop, onClick: () => post("/web/sites/remove", { host: s.host }) }, h(Icon, { name: "trash" })))),
    h("form", { className: "ad-sheet-form row", onSubmit: add },
      h("input", { placeholder: t.siteHost, "aria-label": t.siteHost, value: form.site, onChange: (e) => setForm({ ...form, site: e.target.value }) }),
      h("input", { type: "password", placeholder: t.siteKey, "aria-label": t.siteKey, value: form.key, onChange: (e) => setForm({ ...form, key: e.target.value }) }),
      h("button", { type: "submit", className: "ad-btn quiet small", disabled: !form.site || !form.key }, h(Icon, { name: "plus" }), t.addSite)),
    error && h("p", { className: "ad-error" }, error));
}
