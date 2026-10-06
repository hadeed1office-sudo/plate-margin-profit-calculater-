"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Field } from "@/components/ui";
import { useApp } from "@/lib/store";

export default function ForgotPage() {
  const { requestReset } = useApp();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter the email on the kitchen account.");
      return;
    }
    setPending(true);
    const result = await requestReset(email);
    setPending(false);
    if (result.error) setError(result.error);
    else setCode(result.code);
  }

  return (
    <AuthFrame
      title="Reset the password"
      lede="We'll print a short-lived slip. This kitchen runs on your device, so the slip appears here instead of an inbox."
      footer={
        <Link href="/login" className="font-semibold text-copper">
          Back to login
        </Link>
      }
    >
      {code ? (
        <div className="card p-5">
          <p className="eyebrow">Reset slip</p>
          <p className="num mt-3 text-4xl tracking-[0.2em]">{code}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Valid for 15 minutes. Take it to the reset page with {email.trim().toLowerCase()}.
          </p>
          <Link href={`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`} className="btn-primary mt-4 w-full">
            Enter a new password
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Email">
            <input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          {error ? <p className="text-sm text-chili" role="alert">{error}</p> : null}
          <button className="btn-primary w-full" disabled={pending}>
            {pending ? "Printing the slip…" : "Print a reset slip"}
          </button>
        </form>
      )}
    </AuthFrame>
  );
}
