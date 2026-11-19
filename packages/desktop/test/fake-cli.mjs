// A child for the CLI runner tests: it prints the arguments, the environment and a hash of standard input.
// With --echo-input it writes the input itself to stderr, to check that the runner redacts output.
import { createHash } from "node:crypto";
const input = await new Promise((resolve) => {
  let text = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { text += chunk; });
  process.stdin.on("end", () => resolve(text));
  process.stdin.on("error", () => resolve(text));
  process.stdin.resume();
});
const sleep = Number(process.env.FAKE_CLI_SLEEP ?? 0);
if (sleep) await new Promise((resolve) => setTimeout(resolve, sleep));
const digest = createHash("sha256").update(input).digest("hex");
console.log(JSON.stringify({ args: process.argv.slice(2), env: process.env, input: digest }));
if (process.argv.includes("--echo-input")) console.error(`the input was ${input}`);
if (process.argv.includes("--fail")) {
  console.error("the fake failed");
  process.exit(3);
}
