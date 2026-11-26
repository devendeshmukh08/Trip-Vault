const G = ["linear-gradient(135deg,#0ea5e9,#6366f1)", "linear-gradient(135deg,#f97316,#ec4899)", "linear-gradient(135deg,#10b981,#0ea5e9)", "linear-gradient(135deg,#f59e0b,#ef4444)", "linear-gradient(135deg,#8b5cf6,#ec4899)", "linear-gradient(135deg,#14b8a6,#84cc16)"];
export const grad = (s: string) => G[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % G.length];
const d = (s: string) => new Date(s + "T00:00:00");
export const fmt = (s: string | null) => (s ? d(s).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");
export const range = (a: string | null, b: string | null) => (a ? fmt(a) + (b ? " – " + fmt(b) : "") : "Dates not set");
export const nDays = (a: string | null, b: string | null) => (a && b ? Math.round((+d(b) - +d(a)) / 864e5) + 1 : 0);
export function when(a: string | null, b: string | null) {
  if (!a) return "Plan ahead";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((+d(a) - +today) / 864e5);
  if (diff > 0) return `In ${diff} day${diff > 1 ? "s" : ""}`;
  if (!b || +d(b) >= +today) return "Happening now";
  return "Completed";
}
export function dayDate(a: string | null, n: number) {
  if (!a || !n) return ""; const x = d(a); x.setDate(x.getDate() + n - 1);
  return x.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
