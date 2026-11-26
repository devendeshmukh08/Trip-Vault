import Link from "next/link";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createTrip } from "./actions";
import { grad, range, when } from "@/lib/ui";
export const dynamic = "force-dynamic";
type Row = { id: string; name: string; destination: string; emoji: string; start_date: string | null; end_date: string | null; total: number; done: number };
export default async function Home() {
  const u = await requireUser();
  const trips = (await sql`select t.id,t.name,t.destination,t.emoji,t.start_date::text as start_date,t.end_date::text as end_date,
      count(i.id)::int as total, count(i.id) filter (where i.done)::int as done
    from trips t left join items i on i.trip_id=t.id where t.user_id=${u.id} group by t.id order by t.created_at desc`) as Row[];
  return <>
    <section className="intro"><h1>Where to next, {u.name.split(" ")[0]}?</h1><p className="muted">Your trips, documents and memories — all in one place.</p></section>
    <details className="card newtrip" open={!trips.length}>
      <summary className="btn">+ New trip</summary>
      <form action={createTrip} className="tripform">
        <label>Icon<input name="emoji" defaultValue="✈️" maxLength={4} /></label>
        <label className="grow">Trip name<input name="name" placeholder="Goa with friends" required /></label>
        <label className="grow">Destination<input name="destination" placeholder="Goa, India" /></label>
        <label>Start<input name="start" type="date" /></label><label>End<input name="end" type="date" /></label>
        <button className="btn">Create trip</button>
      </form>
    </details>
    <div className="tripgrid">{trips.map(t => {
      const pct = t.total ? Math.round((t.done / t.total) * 100) : 0;
      return <Link key={t.id} href={`/trips/${t.id}`} className="tcard">
        <div className="cover" style={{ background: grad(t.name) }}><span className="emoji">{t.emoji}</span><span className="pill">{when(t.start_date, t.end_date)}</span></div>
        <div className="tbody"><h3>{t.name}</h3><p className="muted">📍 {t.destination || "Destination TBD"}<br />📅 {range(t.start_date, t.end_date)}</p>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div><small className="muted">{t.done}/{t.total} planned items done</small></div>
      </Link>; })}</div>
    {!trips.length && <p className="muted center" style={{ marginTop: 28 }}>No trips yet — create your first one above ✨</p>}
  </>;
}
