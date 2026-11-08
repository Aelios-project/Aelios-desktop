// A time as short as it can be and still be clear: the clock for today, "Yesterday", a weekday this week, else a
// short date. Pure, so test/look.test.mjs covers it.
export function shortWhen(at, now = new Date(), words = { yesterday: "Yesterday" }) {
  if (!at) return "";
  const d = new Date(at);
  if (Number.isNaN(d.getTime())) return "";
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 864e5);
  if (days <= 0) return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return words.yesterday;
  if (days < 7) return d.toLocaleDateString("en", { weekday: "short" });
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}
