"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Logo } from "./Logo";

export function StaffLogin() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/staff/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) router.refresh();
    else setError("الرمز غير صحيح");
  };

  return (
    <main className="min-h-dvh flex items-center justify-center bg-surface p-6">
      <form onSubmit={submit} className="card w-full max-w-sm p-6 text-center space-y-4">
        <Logo />
        <p className="font-bold flex items-center justify-center gap-2"><Lock size={18} /> دخول الموظفين</p>
        <input
          className="input text-center text-2xl tracking-[0.5em]" dir="ltr" type="password" inputMode="numeric"
          autoFocus value={pin} onChange={(e) => setPin(e.target.value)} placeholder="PIN"
        />
        {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        <button className="btn-brand w-full">دخول</button>
      </form>
    </main>
  );
}
