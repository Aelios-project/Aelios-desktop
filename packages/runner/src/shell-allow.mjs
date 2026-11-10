// One regex for Kiro's `allowedCommands` that matches every shell command except those containing an "ask" word.
// Kiro's `deniedCommands` refuses a command (the model sees a failure and nothing reaches the owner), and its regex has
// no look-ahead, so "everything except these words" is built here as a regex that cannot match them.
// A command is cut into words ([A-Za-z0-9_] runs) and separators; every word must differ from every ask word, in any case.
// shortcut: this catches the word as typed. `r""m`, `$(printf rm)` or a script that deletes files get past it, and a
// word inside a quoted message (`git commit -m "fix push"`) is held too. Upgrade with a sandbox, not a longer list.
const WORD_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_";
const WORD = "A-Za-z0-9_";
const NON_WORD = `[^${WORD}]`;
const both = char => char + char.toUpperCase();

/** Words that stay held for the owner: publishing, deleting files, running as another user, and changing git config. */
export const ASK_WORDS = ["push", "rm", "rmdir", "unlink", "shred", "trash", "delete", "clean", "sudo", "doas", "config"];

function trieOf(words) {
  const root = { kids: new Map(), end: false };
  for (const word of words) {
    let node = root;
    for (const char of word) {
      if (!node.kids.has(char)) node.kids.set(char, { kids: new Map(), end: false });
      node = node.kids.get(char);
    }
    node.end = true;
  }
  return root;
}

/** A character list as class contents with ranges, in code order: "abcx" is "a-cx". */
function ranges(chars) {
  const codes = chars.map(char => char.charCodeAt(0)).sort((a, b) => a - b);
  let text = "";
  for (let i = 0; i < codes.length;) {
    let j = i;
    while (codes[j + 1] === codes[j] + 1) j++;
    text += j - i >= 2 ? `${String.fromCharCode(codes[i])}-${String.fromCharCode(codes[j])}` : String.fromCharCode(...codes.slice(i, j + 1));
    i = j + 1;
  }
  return text;
}

/** Regex source for a word, or the rest of one, that is not an ask word. `root` may not be empty. */
function okWord(node, root = false) {
  const used = [...node.kids.keys()].map(both).join("");
  const other = ranges([...WORD_CHARS].filter(char => !used.includes(char)));
  const parts = [`[${other}][${WORD}]*`];
  for (const [char, kid] of node.kids) parts.push(`[${both(char)}](?:${okWord(kid)})`);
  if (!node.end && !root) parts.push(""); // the word may stop here
  return parts.join("|");
}

/** Regex source (Rust and JavaScript syntax, no anchors) for any command with none of `words` in it. */
export function allowAllBut(words = ASK_WORDS) {
  const word = `(?:${okWord(trieOf(words), true)})`;
  return `${NON_WORD}*(?:${word}${NON_WORD}+)*${word}?`;
}
