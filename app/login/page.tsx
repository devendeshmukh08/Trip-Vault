import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";
import { login } from "../actions";
export default function Login() { return <AuthShell><AuthForm mode="login" action={login} /></AuthShell>; }
