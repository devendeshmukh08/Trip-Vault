import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { signup } from "../actions";
export default function Signup() { return <AuthShell><AuthForm mode="signup" action={signup} /></AuthShell>; }
