// Render a real message component with a minimal React stub, then inspect its image/video URL.
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

const built = await build({ entryPoints: [new URL("../client/message.mjs", import.meta.url).pathname], bundle: true, platform: "node", format: "cjs", external: ["react"], write: false, logLevel: "silent" });
const react = {
  createElement: (type, props, ...children) => typeof type === "function" ? type({ ...props, children }) : { type, props: props || {}, children },
  useState: (value) => [value, () => {}], useEffect: () => {}, useRef: (value) => ({ current: value }),
};
const module = { exports: {} };
vm.runInNewContext(built.outputFiles[0].text, { module, exports: module.exports, require: (name) => { if (name === "react") return react; throw Error(name); }, URL, console });
const { Message } = module.exports;
function elements(node, type) {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child, type));
  if (!node || typeof node !== "object") return [];
  return [...(node.type === type ? [node] : []), ...elements(node.children, type)];
}

test("sticker-only user message requests the image from the resident, not the desktop origin", () => {
  const row = Message({ resident: "default", base: "https://resident.example", line: { role: "user", text: "", stickers: [{ url: "/stickers/abcdef", video: false }] } });
  assert.equal(elements(row, "img")[0].props.src, "https://resident.example/stickers/abcdef");
});

test("video and other-resident sticker paths keep their prefix", () => {
  const row = Message({ resident: "luna", base: "https://resident.example/", line: { role: "assistant", text: "", stickers: [{ url: "/r/luna/stickers/abcdef", video: true }] } });
  assert.equal(elements(row, "video")[0].props.src, "https://resident.example/r/luna/stickers/abcdef");
});
