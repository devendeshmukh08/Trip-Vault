"use client";
import { upload } from "@vercel/blob/client";
import { useRef, useState, useTransition } from "react";
import { addFile, importFromPdf } from "@/app/actions";

import { CATS } from "@/lib/ui";
type Props = { tripId: string; mode: "doc" | "photo" | "import"; label: string };

export default function Uploader({ tripId, mode, label }: Props) {
  const [cat, setCat] = useState("Other");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    start(async () => {
      try {
        for (const f of Array.from(files)) {
          setMsg(`Uploading ${f.name}…`);
          const b = await upload(f.name, f, { access: "public", handleUploadUrl: "/api/blob" });
          const kind = mode === "photo" ? "photo" : "doc";
          await addFile(tripId, kind, mode === "import" ? "Itinerary" : cat, { url: b.url, name: f.name, type: f.type, size: f.size });
          if (mode === "import") { setMsg("Building your to-do list with AI…"); await importFromPdf(tripId, b.url); }
        }
        setMsg("Done ✔");
      } catch { setMsg("Something went wrong — please try again."); }
      if (ref.current) ref.current.value = "";
    });
  }
  return (
    <div className="row" style={{ margin: "8px 0" }}>
      {mode === "doc" && <select value={cat} onChange={e => setCat(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>}
      <label className="btn ghost" style={{ opacity: pending ? .6 : 1 }}>
        {label}
        <input ref={ref} type="file" hidden multiple={mode !== "import"} disabled={pending}
          accept={mode === "photo" ? "image/*" : mode === "import" ? "application/pdf" : undefined}
          onChange={e => onFiles(e.target.files)} />
      </label>
      <span className="sub" style={{ margin: 0 }}>{msg}</span>
    </div>
  );
}
