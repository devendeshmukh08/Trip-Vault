import "./globals.css";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getUser } from "@/lib/auth";
import { logout } from "./actions";
const font = Plus_Jakarta_Sans({ subsets: ["latin"] });
export const metadata = { title: "Trip Vault", description: "Every ticket, booking, plan and memory — in one place." };
export default async function Root({ children }: { children: React.ReactNode }) {
  const u = await getUser();
  return (
    <html lang="en"><body className={font.className}>
      {u && <header className="nav"><div className="wrap row between">
        <Link href="/" className="brand">🧳 Trip Vault</Link>
        <div className="row"><span className="muted hide-sm">Hi, {u.name.split(" ")[0]}</span>
          <form action={logout}><button className="btn ghost sm">Log out</button></form></div></div></header>}
      <main className={u ? "wrap" : ""}>{children}</main>
    </body></html>
  );
}
