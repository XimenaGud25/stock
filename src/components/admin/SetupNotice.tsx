import { Database } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

/** Se muestra en /admin mientras no exista la conexión a Supabase en .env.local. */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl space-y-8 px-6 py-20">
      <Logo />
      <section className="space-y-5 rounded-[28px] border border-line bg-white p-8">
        <span className="grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Database className="size-7" />
        </span>
        <h1 className="font-display text-3xl font-bold text-navy">Falta conectar la base de datos</h1>
        <p className="text-muted">
          El panel necesita Supabase para guardar productos, fotos y pedidos. Mientras tanto, la tienda funciona con los datos de
          ejemplo.
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-[15px]">
          <li>Crea un proyecto en supabase.com.</li>
          <li>
            En <b>SQL Editor</b> pega y corre el archivo <code className="rounded bg-surface px-1.5">supabase/schema.sql</code>.
          </li>
          <li>
            Copia <code className="rounded bg-surface px-1.5">.env.example</code> como{" "}
            <code className="rounded bg-surface px-1.5">.env.local</code> y llena las llaves (Project Settings → API).
          </li>
          <li>
            En <b>Authentication → Users</b> crea el usuario del administrador con el mismo correo de{" "}
            <code className="rounded bg-surface px-1.5">ADMIN_EMAILS</code>.
          </li>
          <li>Reinicia <code className="rounded bg-surface px-1.5">npm run dev</code>.</li>
        </ol>
      </section>
    </div>
  );
}
