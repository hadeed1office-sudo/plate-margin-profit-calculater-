"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Field } from "@/components/ui";
import { useApp } from "@/lib/store";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { resetPassword } = useApp();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (!code.trim()) return setError("Enter the code from the reset slip.");
    setPending(true);
    const message = await resetPassword(email, code, password);
    setPending(false);
    if (message) setError(message);
    else router.push("/login");
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Email">
        <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
      </Field>
      <Field label="Reset code">
        <input className="field num tracking-[0.2em]" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} />
      </Field>
      <Field label="New password">
        <input className="field" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </Field>
      {error ? <p className="text-sm text-chili" role="alert">{error}</p> : null}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <AuthFrame
      title="New password"
      lede="Use the code from the reset slip."
      footer={
        <Link href="/forgot-password" className="font-semibold text-copper">
          Need a new slip?
        </Link>
      }
    >
      <Suspense fallback={<p className="text-sm text-ink-soft">Loading the slip…</p>}>
        <ResetForm />
      </Suspense>
    </AuthFrame>
  );
}
