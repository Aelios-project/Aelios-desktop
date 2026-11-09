import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_MODEL, identityBody } from "../host/onboarding/aelios.mjs";
import { matchGlob, matchesMainModel } from "../host/onboarding/models.mjs";

test("models: Aelios's matcher, including the basename after the last slash", () => {
  assert.equal(matchGlob("glm-4.7-flash", "glm-4.7-flash"), true);
  assert.equal(matchGlob("glm-4.7-flash", "@cf/zai-org/glm-4.7-flash"), false, "the full name needs its own match");
  assert.equal(matchesMainModel(["glm-4.7-flash"], "@cf/zai-org/glm-4.7-flash"), true, "the basename matches");
  assert.equal(matchesMainModel(["deepseek/*"], "deepseek/deepseek-v4-pro"), true);
  assert.equal(matchesMainModel(["deepseek/*"], "openai/gpt-5"), false);
  assert.equal(matchesMainModel([], "anything"), false);
});

test("models: the first identity uses the default small model and one key", () => {
  const body = identityBody({ name: "  Aelios  ", model: DEFAULT_MODEL, pattern: "" });
  assert.deepEqual(body, {
    slug: "main", assistantName: "Aelios", namespace: "main",
    keys: ["CHATBOX_API_KEY"], models: [DEFAULT_MODEL],
  });
  assert.equal(DEFAULT_MODEL, "glm-4.7-flash");
});
