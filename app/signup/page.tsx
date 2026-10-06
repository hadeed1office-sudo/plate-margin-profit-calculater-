"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthFrame } from "@/components/auth-frame";
import { Field } from "@/components/ui";
import { ROLES } from "@/lib/labels";
import { useApp } from "@/lib/store";
import type { Role } from "@/lib/types";

export default function SignupPage() {
  const { user, kitchen, signup } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("owner");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!user) return;
    router.replace(kitchen?.profile.onboarded ? "/dashboard" : "/onboarding");
  }, [user, kitchen, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("Add the name you use on the pass.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("That email doesn't look complete.");
    if (password.length < 8) return setError("Use at least 8 characters.");
    setPending(true);
    const message = await signup({ name, email, password, role });
    setPending(false);
    if (message) setError(message);
    else router.push("/onboarding");
  }

  return (
    <AuthFrame
      title="Open a kitchen"
      lede="A few details, then the pantry, the cards, and the menu."
      footer={
        <>
          Already cooking?{" "}
          <Link href="/login" className="font-semibold text-copper">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Your name">
          <input className="field" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Email">
          <input className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password" hint="At least 8 characters. Stored only on this device.">
          <input className="field" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Field label="Role">
          <select className="field" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            {ROLES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        {error ? <p className="text-sm text-chili" role="alert">{error}</p> : null}
        <button className="btn-primary w-full" disabled={pending}>
          {pending ? "Setting a station…" : "Continue to kitchen setup"}
        </button>
      </form>
    </AuthFrame>
  );
}
