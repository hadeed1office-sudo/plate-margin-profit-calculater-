"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Field } from "@/components/ui";
import { useApp } from "@/lib/store";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/seed";

export default function LoginPage() {
  const { user, kitchen, login } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    router.replace(kitchen?.profile.onboarded ? "/dashboard" : "/onboarding");
  }, [user, kitchen, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter the email and password for this kitchen.");
      return;
    }
    setPending(true);
    const message = await login(email, password);
    setPending(false);
    if (message) setError(message);
    else router.push("/dashboard");
  }

  return (
    <AuthFrame
      title="Log in"
      lede="Pick up the kitchen where you left it."
      footer={
        <>
          New kitchen?{" "}
          <Link href="/signup" className="font-semibold text-copper">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email">
          <input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password">
          <input className="field" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        {error ? <p className="text-sm text-chili" role="alert">{error}</p> : null}
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Checking…" : "Enter the kitchen"}
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-ink-soft underline-offset-2 hover:underline">
            Forgot password
          </Link>
          <button
            type="button"
            className="font-semibold text-copper"
            onClick={() => {
              setEmail(DEMO_EMAIL);
              setPassword(DEMO_PASSWORD);
            }}
          >
            Use the demo kitchen
          </button>
        </div>
      </form>
    </AuthFrame>
  );
}
