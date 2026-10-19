"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { signIn, type FormState } from "../actions";
import { Logo } from "@/components/layout/Logo";
import { adminInput } from "@/components/admin/ui";

export default function LoginPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <form action={action} className="w-full max-w-md space-y-6 rounded-[28px] border border-line bg-white p-8">
        <Logo />
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-navy">
            <Lock className="size-5" /> Panel de administrador
          </h1>
          <p className="text-muted">Entra con tu correo y contraseña.</p>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Correo</span>
          <input name="email" type="email" required autoComplete="email" className={adminInput} />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Contraseña</span>
          <input name="password" type="password" required autoComplete="current-password" className={adminInput} />
        </label>
        {state.error && <p className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">{state.error}</p>}
        <button disabled={pending} className="h-14 w-full rounded-2xl bg-brand font-bold text-white hover:bg-brand/90 disabled:opacity-60">
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
