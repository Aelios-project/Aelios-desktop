// The wizard's own frame: a narrow column of cards in the middle of the window, above the shell's background.
export const ONBOARDING = `
.ad-wizard { margin: auto; width: min(460px, 92%); display: flex; flex-direction: column; gap: 10px; padding: 18px 0; }
.ad-wizard .ad-form { width: 100%; margin: 0; }
.ad-wizard-step { text-align: center; color: var(--text-3); font-size: 12px; letter-spacing: .02em; }
.ad-wizard-reset { align-self: center; border: 0; background: none; color: var(--text-3); font-size: 12px; text-decoration: underline; text-underline-offset: 3px; }
.ad-wizard-reset:hover { color: var(--text-1); }
.ad-wizard-tail { max-height: 160px; margin: 0; padding: 10px 12px; overflow: auto; border-radius: 10px; border: 1px solid var(--line); background: var(--input-bg); color: var(--text-2); font-family: var(--mono, ui-monospace, monospace); font-size: 11px; line-height: 1.5; white-space: pre-wrap; }
`;
