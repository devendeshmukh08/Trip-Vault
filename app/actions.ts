"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import { extractText, getDocumentProxy } from "unpdf";
import { del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireUser, startSession, endSession, hashPassword, verifyPassword } from "@/lib/auth";

type AuthState = { error?: string } | null;
export async function signup(_: AuthState, fd: FormData): Promise<AuthState> {
  const name = String(fd.get("name") || "").trim(), email = String(fd.get("email") || "").trim().toLowerCase(), pw = String(fd.get("password") || "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return { error: "Enter your name and a valid email." };
  if (pw.length < 8) return { error: "Password must be at least 8 characters." };
  if ((await sql`select 1 from users where email=${email}`).length) return { error: "An account with this email already exists." };
  const [u] = await sql`insert into users (email,name,password_hash) values (${email}, ${name}, ${hashPassword(pw)}) returning id`;
  await startSession(u.id); redirect("/");
}
export async function login(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = String(fd.get("email") || "").trim().toLowerCase(), pw = String(fd.get("password") || "");
  const [u] = await sql`select id,password_hash from users where email=${email}`;
  if (!u || !verifyPassword(pw, u.password_hash)) return { error: "Incorrect email or password." };
  await startSession(u.id); redirect("/");
}
export async function logout() { await endSession(); redirect("/login"); }

/** Every trip-scoped action calls this: the trip must belong to the signed-in user. */
async function own(tripId: string) {
  const u = await requireUser();
  if (!(await sql`select 1 from trips where id=${tripId} and user_id=${u.id}`).length) redirect("/");
  return u;
}
export async function createTrip(fd: FormData) {
  const u = await requireUser();
  const [t] = await sql`insert into trips (user_id,name,destination,start_date,end_date,emoji)
    values (${u.id}, ${fd.get("name")}, ${fd.get("destination") ?? ""}, ${fd.get("start") || null}, ${fd.get("end") || null}, ${fd.get("emoji") || "✈️"}) returning id`;
  redirect(`/trips/${t.id}`);
}
export async function deleteTrip(id: string) {
  await own(id);
  const files = await sql`select url from files where trip_id=${id}`;
  if (files.length) await del(files.map(f => f.url));
  await sql`delete from trips where id=${id}`; redirect("/");
}
export async function addItem(tripId: string, fd: FormData) {
  await own(tripId);
  await sql`insert into items (trip_id,day,time,title) values (${tripId}, ${Number(fd.get("day")) || 0}, ${fd.get("time") ?? ""}, ${fd.get("title")})`;
  revalidatePath(`/trips/${tripId}`);
}
export async function toggleItem(tripId: string, id: string) {
  await own(tripId); await sql`update items set done = not done where id=${id} and trip_id=${tripId}`; revalidatePath(`/trips/${tripId}`);
}
export async function deleteItem(tripId: string, id: string) {
  await own(tripId); await sql`delete from items where id=${id} and trip_id=${tripId}`; revalidatePath(`/trips/${tripId}`);
}
export async function addFile(tripId: string, kind: "doc" | "photo", category: string, b: { url: string; name: string; type: string; size: number }) {
  await own(tripId);
  if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(b.url)) throw new Error("Invalid file URL");
  await sql`insert into files (trip_id,kind,category,name,mime,size,url) values (${tripId},${kind},${category},${b.name},${b.type},${b.size},${b.url})`;
  revalidatePath(`/trips/${tripId}`);
}
export async function deleteFile(tripId: string, id: string) {
  await own(tripId);
  const [f] = await sql`select url from files where id=${id} and trip_id=${tripId}`;
  if (f) { await del(f.url); await sql`delete from files where id=${id}`; }
  revalidatePath(`/trips/${tripId}`);
}

/* ---------- AI ---------- */
const ai = new Anthropic();
async function askItems(prompt: string): Promise<{ day: number; time: string; title: string }[]> {
  const r = await ai.messages.create({ model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5", max_tokens: 3000, messages: [{ role: "user", content: prompt }] });
  const text = r.content.map(b => (b.type === "text" ? b.text : "")).join("");
  try { return JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1)); } catch { return []; }
}
const FORMAT = `Return ONLY a JSON array of objects: {"day": number starting at 1 (0 if unknown), "time": "HH:MM" or "", "title": "short activity"}.`;
async function insertItems(tripId: string, list: { day: number; time: string; title: string }[]) {
  for (const i of list.slice(0, 60)) if (i?.title) await sql`insert into items (trip_id,day,time,title) values (${tripId}, ${Number(i.day) || 0}, ${String(i.time ?? "").slice(0, 10)}, ${String(i.title).slice(0, 140)})`;
}
export async function aiPlan(tripId: string, fd: FormData) {
  await own(tripId);
  const [t] = await sql`select name,destination from trips where id=${tripId}`;
  const cur = await sql`select day,title from items where trip_id=${tripId} and not done`;
  const list = await askItems(`You are a travel planner. Trip: ${t.name} (${t.destination}). Request: ${fd.get("prompt")}.
${cur.length ? "Current plan to adapt, avoid duplicates: " + cur.map(c => `Day ${c.day}: ${c.title}`).join("; ") : ""}\nCreate 8-24 items. ${FORMAT}`);
  if (fd.get("replace")) await sql`delete from items where trip_id=${tripId} and not done`;
  await insertItems(tripId, list); revalidatePath(`/trips/${tripId}`);
}
export async function importFromPdf(tripId: string, url: string) {
  await own(tripId);
  if (!(await sql`select 1 from files where trip_id=${tripId} and url=${url}`).length) throw new Error("Unknown file");
  const pdf = await getDocumentProxy(new Uint8Array(await (await fetch(url)).arrayBuffer()));
  const { text } = await extractText(pdf, { mergePages: true });
  await insertItems(tripId, await askItems(`Extract the travel itinerary from this text.\n${FORMAT}\n\n${text.slice(0, 14000)}`));
  revalidatePath(`/trips/${tripId}`);
}
