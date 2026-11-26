"use client";
import { useActionState } from "react";
import Link from "next/link";
type State = { error?: string } | null;
export default function AuthForm({ mode, action }: { mode: "login" | "signup"; action: (p: State, fd: FormData) => Promise<State> }) {
  const [st, run, pending] = useActionState(action, null as State);
  const signup = mode === "signup";
  return (
    <form action={run} className="authform">
      <h2>{signup ? "Create your account" : "Welcome back"}</h2>
      <p className="muted">{signup ? "Start collecting your trips in one place." : "Sign in to open your trips."}</p>
      {signup && <label>Name<input name="name" autoComplete="name" required /></label>}
      <label>Email<input name="email" type="email" autoComplete="email" required /></label>
      <label>Password<input name="password" type="password" minLength={signup ? 8 : undefined} autoComplete={signup ? "new-password" : "current-password"} required />
        {signup && <small className="muted">At least 8 characters</small>}</label>
      {st?.error && <div className="err" role="alert">{st.error}</div>}
      <button className="btn big" disabled={pending}>{pending ? "Please wait…" : signup ? "Sign up" : "Log in"}</button>
      <p className="muted center">{signup ? <>Already have an account? <Link href="/login">Log in</Link></> : <>New here? <Link href="/signup">Create an account</Link></>}</p>
    </form>
  );
}
