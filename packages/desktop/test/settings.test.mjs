// Reading the resident's settings list into rows, and a model list into a picker.
import assert from "node:assert/strict";
import { test } from "node:test";
import { humanKey, labelOf, modelRows, settingRows, shownValue } from "../client/settings.mjs";

test("settings: a key without a label is shown as words", () => {
  assert.equal(humanKey("RESIDENT_TZ"), "Resident tz");
  assert.equal(labelOf("RESIDENT_TZ"), "Time zone");
  assert.equal(labelOf("SOMETHING_NEW"), "Something new");
});

test("settings: a saved value wins over the Worker's, and a secret only says whether it is there", () => {
  assert.equal(shownValue({ kind: "text", value: "web", fromWorker: "worker" }), "web");
  assert.equal(shownValue({ kind: "text", value: "", fromWorker: "worker" }), "worker");
  assert.equal(shownValue({ kind: "secret", saved: true }), "saved");
  assert.equal(shownValue({ kind: "secret", saved: false, workerHas: true }), "from the Worker");
  assert.equal(shownValue({ kind: "secret" }), "");
});

test("settings: rows keep the resident's order and carry choices", () => {
  const rows = settingRows({ fields: [
    { key: "MODEL", kind: "text", value: "x" },
    { key: "WEB_PUSH", kind: "choice", choices: ["on", "off"], value: "on" },
  ] });
  assert.deepEqual(rows.map((r) => [r.key, r.label, r.kind, r.choices]), [["MODEL", "Model", "text", []], ["WEB_PUSH", "What to push", "choice", ["on", "off"]]]);
  assert.deepEqual(settingRows({}), []);
});

test("settings: models keep their id and name", () => {
  assert.deepEqual(modelRows([{ id: "a/b", name: "A · B" }, { name: "plain" }, null]), [{ id: "a/b", name: "A · B", note: "" }, { id: "plain", name: "plain", note: "" }]);
  assert.deepEqual(modelRows(), []);
});
