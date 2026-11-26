import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";
import { sql } from "./db";

export type User = { id: string; name: string; email: string };
export const hashPassword = (pw: string) => { const s = randomBytes(16).toString("hex"); return `${s}:${scryptSync(pw, s, 64).toString("hex")}`; };
export const verifyPassword = (pw: string, stored: string) => {
  const [s, h] = stored.split(":"); const a = Buffer.from(h, "hex"), b = scryptSync(pw, s, 64);
  return a.length === b.length && timingSafeEqual(a, b);
};
const th = (t: string) => createHash("sha256").update(t).digest("hex"); // only the hash is stored in the DB

export async function startSession(userId: string) {
  const t = randomBytes(32).toString("hex");
  await sql`insert into sessions (token_hash,user_id,expires_at) values (${th(t)}, ${userId}, now() + interval '30 days')`;
  (await cookies()).set("tv_session", t, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
export async function getUser(): Promise<User | null> {
  const t = (await cookies()).get("tv_session")?.value; if (!t) return null;
  const [u] = await sql`select u.id,u.name,u.email from sessions s join users u on u.id=s.user_id where s.token_hash=${th(t)} and s.expires_at > now()`;
  return (u as User) ?? null;
}
export async function requireUser() { const u = await getUser(); if (!u) redirect("/login"); return u; }
export async function endSession() {
  const c = await cookies(); const t = c.get("tv_session")?.value;
  if (t) await sql`delete from sessions where token_hash=${th(t)}`; c.delete("tv_session");
}
