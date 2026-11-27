import Link from "next/link";
import { notFound } from "next/navigation";
import { sql, type Item, type FileRow } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { addItem, toggleItem, deleteItem, deleteFile, deleteTrip, aiPlan } from "@/app/actions";
import Uploader from "@/components/Uploader";
import { grad, range, when, nDays, dayDate, CATS } from "@/lib/ui";
export const dynamic = "force-dynamic";
const CI: Record<string, string> = { Itinerary: "🗺️", Hotel: "🏨", Tickets: "🎫", "ID & Visa": "🛂", Insurance: "🛡️", Other: "📄" };

export default async function TripPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const u = await requireUser(); const { id } = await params; const tab = (await searchParams).tab ?? "plan";
  const [t] = await sql`select id,name,destination,emoji,start_date::text as start_date,end_date::text as end_date from trips where id=${id} and user_id=${u.id}`;
  if (!t) notFound();
  const items = (await sql`select * from items where trip_id=${id} order by (day=0), day, time`) as Item[];
  const files = (await sql`select * from files where trip_id=${id} order by created_at`) as FileRow[];
  const docs = files.filter(f => f.kind === "doc"), photos = files.filter(f => f.kind === "photo");
  const done = items.filter(i => i.done).length, pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const days = [...new Set(items.map(i => i.day))]; const nd = nDays(t.start_date, t.end_date);
  return <>
    <div className="hero" style={{ background: grad(t.name) }}>
      <div className="row between"><Link href="/" className="back">← All trips</Link>
        <form action={deleteTrip.bind(null, id)}><button className="glass" title="Delete trip">🗑️ Delete</button></form></div>
      <div className="hero-in"><span className="big">{t.emoji}</span>
        <div><h1>{t.name}</h1><p>📍 {t.destination || "Destination TBD"} &nbsp;·&nbsp; 📅 {range(t.start_date, t.end_date)}</p></div></div>
      <div className="chips"><span>{when(t.start_date, t.end_date)}</span>{nd > 0 && <span>{nd} days</span>}<span>{done}/{items.length} done</span><span>{docs.length} docs</span><span>{photos.length} photos</span></div>
    </div>
    <nav className="tabs">{[["plan", "✅ Plan"], ["docs", "📁 Documents"], ["mem", "📸 Memories"]].map(([k, l]) =>
      <Link key={k} href={`?tab=${k}`} className={`tab ${tab === k ? "on" : ""}`}>{l}</Link>)}</nav>

    {tab === "plan" && <div className="cols">
      <div>
        {!items.length && <div className="card empty"><div className="em">🗺️</div><h3>Nothing planned yet</h3><p className="muted">Add stops by hand, import a PDF itinerary, or let AI draft a plan.</p></div>}
        {days.map(d => { const l = items.filter(i => i.day === d); return <section key={d} className="day">
          <div className="dayh"><h3>{d ? `Day ${d}` : "Anytime"}</h3><span className="muted">{dayDate(t.start_date, d)}</span><span className="pill2">{l.filter(i => i.done).length}/{l.length}</span></div>
          {l.map(i => <div key={i.id} className={`item ${i.done ? "done" : ""}`}>
            <form action={toggleItem.bind(null, id, i.id)}><button className="chk" aria-label="Toggle done">{i.done ? "✓" : ""}</button></form>
            {i.time && <span className="tm">{i.time}</span>}<span className="t">{i.title}</span>
            <form action={deleteItem.bind(null, id, i.id)}><button className="ic" aria-label="Delete">✕</button></form></div>)}
        </section>; })}
      </div>
      <aside>
        <div className="card"><b>{pct}% complete</b><div className="bar"><i style={{ width: `${pct}%` }} /></div><small className="muted">{done} of {items.length} items done</small></div>
        <form action={addItem.bind(null, id)} className="card stack"><b>➕ Add a stop</b>
          <div className="row"><input name="day" type="number" min={0} placeholder="Day" style={{ width: 80 }} /><input name="time" placeholder="Time" style={{ width: 100 }} /></div>
          <input name="title" placeholder="Visit Baga Beach…" required /><button className="btn">Add to plan</button></form>
        <form action={aiPlan.bind(null, id)} className="card stack"><b>✨ AI planner</b>
          <textarea name="prompt" rows={3} defaultValue={`${t.destination || t.name}. Mix of top sights, local food and relaxed time.`} />
          <label className="check"><input type="checkbox" name="replace" /> Replace unfinished items</label><button className="btn">Generate plan</button></form>
        <div className="card stack"><b>📄 Have a PDF itinerary?</b><p className="muted" style={{ margin: 0 }}>Upload it and it becomes a checklist.</p><Uploader tripId={id} mode="import" label="Import itinerary PDF" /></div>
      </aside>
    </div>}

    {tab === "docs" && <>
      <div className="card"><Uploader tripId={id} mode="doc" label="📎 Upload documents" /></div>
      {!docs.length && <div className="card empty"><div className="em">📁</div><h3>No documents yet</h3><p className="muted">Tickets, hotel bookings, visas — everything in one place.</p></div>}
      {CATS.map(c => { const l = docs.filter(f => f.category === c); return l.length ? <section key={c}><h3 className="cath">{CI[c]} {c}</h3>
        <div className="docgrid">{l.map(f => <div key={f.id} className="doc card"><div className="dico">{f.name.toLowerCase().endsWith(".pdf") ? "📕" : "📄"}</div>
          <b className="dname" title={f.name}>{f.name}</b><small className="muted">{Math.max(1, Math.round(f.size / 1024))} KB</small>
          <div className="row"><a className="btn sm" href={f.url} target="_blank" rel="noreferrer">Open</a>
            <form action={deleteFile.bind(null, id, f.id)}><button className="btn ghost sm">Delete</button></form></div></div>)}</div></section> : null; })}
    </>}

    {tab === "mem" && <>
      <div className="card"><Uploader tripId={id} mode="photo" label="📸 Add photos" /></div>
      {!photos.length && <div className="card empty"><div className="em">📸</div><h3>Your album is empty</h3><p className="muted">Add the first photo from this trip.</p></div>}
      <div className="photos">{photos.map(f => <div key={f.id} className="ph"><a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.name} loading="lazy" /></a>
        <form action={deleteFile.bind(null, id, f.id)}><button className="x" aria-label="Delete photo">✕</button></form></div>)}</div>
    </>}
  </>;
}
