// Moving a thread off its open helper session (a changed helper setup, or a tier change that needs a fresh process).
// The old turn is already settled here: the machine queue runs one turn at a time, and a switch happens inside the next
// turn's slot. This closes the old session and waits for that close before anything new is opened, so there is never
// more than one helper writing in the folder.

/** Close the open session for `key` / `name`, if acpx knows one. Resolves once acpx has closed it. */
export async function closeOld(engine, key, name, reason) {
  const { runtime, modes } = engine;
  const known = await runtime.findSession({ sessionKey: key, agent: name }).catch(() => undefined);
  if (!known) return;
  await runtime.close({ handle: known, reason }).catch(() => {});
  modes.delete(known.backendSessionId);
}
