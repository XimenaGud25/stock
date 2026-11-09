"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { reportMyPayment } from "@/app/(tienda)/seguimiento/actions";

/**
 * "Ya pagué": abre WhatsApp para mandar el comprobante y, al mismo tiempo,
 * deja el pago como "por confirmar" para que la tienda lo vea en el panel.
 */
export function ReportPaymentButton({ token, whatsappUrl }: { token: string; whatsappUrl: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        start(async () => {
          await reportMyPayment(token);
          router.refresh();
        })
      }
      className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25d366] font-bold text-white hover:brightness-95 aria-disabled:opacity-60"
      aria-disabled={pending}
    >
      <MessageCircle className="size-5" /> Ya pagué · enviar comprobante
    </a>
  );
}
