import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SetupNotice } from "@/components/admin/SetupNotice";

// El panel siempre se genera al momento (sesión y datos en vivo)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel · Stock Herramienta Pro" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-surface">{isSupabaseConfigured ? children : <SetupNotice />}</div>;
}
