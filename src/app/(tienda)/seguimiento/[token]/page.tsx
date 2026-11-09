import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Check, CheckCircle2, Clock, ClipboardCheck, CreditCard, MapPin, MessageCircle, Package, PackageCheck, Store, Truck, XCircle } from "lucide-react";
import type { OrderStatus } from "@/types";
import { getBranches } from "@/lib/api";
import { getOrderByToken } from "@/lib/tracking";
import { canCustomerCancel, PAYMENT_LABEL, STATUS_FLOW, statusLabel, statusMessage } from "@/lib/orders";
import { BANK_ACCOUNT } from "@/lib/data/payment";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CancelOrderButton } from "@/components/tracking/CancelOrderButton";
import { ReportPaymentButton } from "@/components/tracking/ReportPaymentButton";
import { BankDetails } from "@/components/payment/BankDetails";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Seguimiento de pedido", robots: { index: false } };

const STEP_ICON: Record<OrderStatus, typeof Check> = {
  nuevo: ClipboardCheck,
  confirmado: CheckCircle2,
  preparando: Package,
  listo: Truck,
  entregado: PackageCheck,
  cancelado: XCircle,
};

export default async function OrderTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [order, branches] = await Promise.all([getOrderByToken(token), getBranches()]);
  if (!order) notFound();

  const branch = branches.find((b) => b.id === order.branchId) ?? branches[0];
  const cancelled = order.status === "cancelado";
  const currentStep = STATUS_FLOW.indexOf(order.status);
  // Fecha en que se llegó a cada paso (la más reciente)
  const reachedAt = new Map(order.events.map((e) => [e.status, e.createdAt]));
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const help = encodeURIComponent(`Hola, tengo una duda sobre mi pedido #${order.id}.`);
  const receipt = encodeURIComponent(`Hola, ya hice la transferencia del pedido #${order.id} por ${formatPrice(order.total)}. Te adjunto mi comprobante.`);
  const needsTransfer = !cancelled && order.paymentMethod === "transferencia" && order.paymentStatus === "pendiente";
  const stepIcon = (s: OrderStatus) => (s === "listo" && order.delivery === "recoger" ? Store : STEP_ICON[s]);
  const HeroIcon = stepIcon(order.status);

  return (
    <Container className="space-y-8 pb-28 pt-9">
      <Breadcrumbs items={[{ label: "Inicio", href: "/" }, { label: "Mi pedido", href: "/seguimiento" }, { label: `Pedido #${order.id}` }]} />

      {/* Estado actual */}
      <section
        className={cn(
          "flex flex-col gap-6 rounded-[28px] p-8 sm:flex-row sm:items-center lg:p-10",
          cancelled ? "border border-danger/30 bg-danger-soft" : "bg-gradient-to-r from-navy to-navy-2 text-white",
        )}
      >
        <span className={cn("grid size-16 shrink-0 place-items-center rounded-2xl", cancelled ? "bg-white text-danger" : "bg-accent text-navy")}>
          <HeroIcon className="size-8" />
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className={cn("text-sm font-semibold", cancelled ? "text-danger" : "text-accent")}>
            Pedido #{order.id} · {formatDate(order.createdAt)}
          </p>
          <h1 className={cn("font-display text-3xl font-bold tracking-tight lg:text-4xl", cancelled ? "text-navy" : "text-white")}>
            {statusLabel(order.status, order.delivery)}
          </h1>
          <p className={cn("text-lg", cancelled ? "text-muted" : "text-[#c9d3ee]")}>{statusMessage(order.status, order.delivery)}</p>
        </div>
      </section>

      {/* Falta el pago por transferencia: es lo primero que tiene que hacer el cliente */}
      {needsTransfer && (
        <section className="grid gap-8 rounded-[28px] border-2 border-accent bg-white p-6 md:grid-cols-[1fr_1.1fr] lg:p-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/25 px-3 py-1 text-sm font-bold text-[#8a5a00]">
              <Clock className="size-4" /> Falta tu pago
            </span>
            <h2 className="font-display text-2xl font-bold text-navy">Paga por transferencia en 3 pasos</h2>
            <ol className="space-y-3 text-[15px]">
              <li className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">1</span>
                Abre la app de tu banco y transfiere el monto exacto a la CLABE.
              </li>
              <li className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">2</span>
                <span>
                  En concepto escribe <b>Pedido {order.id}</b>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">3</span>
                Toca &ldquo;Ya pagué&rdquo; y mándanos tu comprobante por WhatsApp.
              </li>
            </ol>
            <ReportPaymentButton token={token} whatsappUrl={`https://wa.me/52${branch.whatsapp}?text=${receipt}`} />
            <p className="text-sm text-dim">Tu pedido queda apartado {BANK_ACCOUNT.holdHours} horas mientras recibimos tu pago.</p>
          </div>
          <BankDetails orderId={order.id} total={order.total} />
        </section>
      )}

      {/* Barra de avance */}
      {!cancelled && (
        <section className="rounded-[28px] border border-line bg-white p-6 lg:p-8" aria-label="Avance del pedido">
          <ol className="grid gap-5 sm:grid-cols-5 sm:gap-2">
            {STATUS_FLOW.map((s, i) => {
              const done = i < currentStep;
              const current = i === currentStep;
              const Icon = stepIcon(s);
              return (
                <li key={s} className="relative flex items-center gap-4 sm:flex-col sm:text-center">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={cn("absolute right-1/2 top-[22px] hidden h-1 w-full sm:block", i <= currentStep ? "bg-brand" : "bg-line")}
                    />
                  )}
                  <span
                    className={cn(
                      "relative z-10 grid size-12 shrink-0 place-items-center rounded-2xl",
                      done && "bg-brand text-white",
                      current && "bg-accent text-navy ring-4 ring-accent/30",
                      !done && !current && "bg-surface text-dim",
                    )}
                  >
                    {done ? <Check className="size-6" /> : <Icon className="size-6" />}
                  </span>
                  <span>
                    <span className={cn("block font-semibold", i <= currentStep ? "text-navy" : "text-dim")}>{statusLabel(s, order.delivery)}</span>
                    <span className="block text-xs text-dim">{i <= currentStep && reachedAt.get(s) ? formatDate(reachedAt.get(s)!) : "Pendiente"}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          {/* Historial */}
          <section className="rounded-[28px] border border-line bg-white p-6 lg:p-8">
            <h2 className="mb-5 text-[22px] font-bold text-navy">Historial</h2>
            <ol className="space-y-0">
              {[...order.events].reverse().map((e, i, arr) => (
                <li key={`${e.createdAt}-${i}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < arr.length - 1 && <span aria-hidden className="absolute left-[7px] top-5 h-full w-0.5 bg-line" />}
                  <span
                    className={cn(
                      "relative z-10 mt-1 size-4 shrink-0 rounded-full border-[3px]",
                      i === 0 ? (e.status === "cancelado" ? "border-danger bg-danger" : "border-brand bg-brand") : "border-line bg-white",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{e.kind === "pago" ? e.note : statusLabel(e.status, order.delivery)}</p>
                    <p className="text-sm text-dim">{formatDate(e.createdAt)}</p>
                    {e.kind !== "pago" && e.note && <p className="mt-1.5 rounded-xl bg-surface px-3 py-2 text-[15px]">{e.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Productos */}
          <section className="rounded-[28px] border border-line bg-white p-6 lg:p-8">
            <h2 className="mb-2 text-[22px] font-bold text-navy">
              Productos <span className="text-base font-medium text-dim">({units} {units === 1 ? "pieza" : "piezas"})</span>
            </h2>
            <ul className="divide-y divide-line">
              {order.items.map((i, idx) => (
                <li key={idx} className="flex justify-between gap-4 py-3">
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-brand">{i.brand}</span>
                    <span className="block font-medium">
                      {i.quantity} × {i.name}
                    </span>
                  </span>
                  <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <span className="text-muted">Total (IVA incluido)</span>
              <span className="font-display text-2xl font-bold text-navy">{formatPrice(order.total)}</span>
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-6">
          {!cancelled && (
            <section className="space-y-3 rounded-[28px] border border-line bg-white p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
                <CreditCard className="size-5 text-brand" /> Pago
              </h2>
              {order.paymentStatus === "pagado" ? (
                <p className="flex items-start gap-3 rounded-2xl bg-ok-soft px-4 py-3 text-ok">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <b className="block">Pago recibido</b>
                    <span className="text-sm">
                      {order.paymentMethod ? PAYMENT_LABEL[order.paymentMethod] : ""}
                      {order.paidAt ? ` · ${formatDate(order.paidAt)}` : ""}
                    </span>
                  </span>
                </p>
              ) : order.paymentStatus === "por_confirmar" ? (
                <p className="flex items-start gap-3 rounded-2xl bg-brand-soft px-4 py-3 text-brand">
                  <Clock className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <b className="block">{order.paymentMethod === "en_linea" ? "Pago en línea recibido" : "Estamos verificando tu pago"}</b>
                    <span className="text-sm">
                      {order.paymentMethod === "en_linea"
                        ? "Lo estamos verificando. Te llega un correo en cuanto quede confirmado."
                        : "Te avisamos en cuanto se refleje. Si aún no nos mandas el comprobante, hazlo por WhatsApp."}
                    </span>
                    {order.paymentRef && <span className="mt-1 block font-mono text-xs">{order.paymentRef}</span>}
                  </span>
                </p>
              ) : order.paymentMethod === "en_sucursal" ? (
                <p className="flex items-start gap-3 rounded-2xl bg-surface px-4 py-3">
                  <Store className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span>
                    <b className="block">Pagas al recoger</b>
                    <span className="text-sm text-muted">
                      {formatPrice(order.total)} en efectivo o con tarjeta en {branch.name}.
                    </span>
                  </span>
                </p>
              ) : (
                <p className="flex items-start gap-3 rounded-2xl bg-accent/20 px-4 py-3 text-[#8a5a00]">
                  <Clock className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <b className="block">Pendiente de pago</b>
                    <span className="text-sm">Transferencia por {formatPrice(order.total)}. Los datos están arriba.</span>
                  </span>
                </p>
              )}
            </section>
          )}

          <section className="space-y-3 rounded-[28px] border border-line bg-white p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-navy">
              {order.delivery === "recoger" ? <Store className="size-5 text-brand" /> : <Truck className="size-5 text-brand" />}
              {order.delivery === "recoger" ? "Recoger en sucursal" : "Envío a domicilio"}
            </h2>
            {order.delivery === "recoger" ? (
              <>
                <p className="font-semibold">{branch.name}</p>
                <p className="flex gap-2 text-muted">
                  <MapPin className="mt-0.5 size-4 shrink-0" /> {branch.address}, {branch.city}
                </p>
                <Link href="/sucursales" className="inline-block text-sm font-semibold text-brand hover:underline">
                  Ver horarios y cómo llegar
                </Link>
                <p className="rounded-xl bg-surface px-4 py-3 text-sm">Muestra tu número de pedido <b>#{order.id}</b> en mostrador.</p>
              </>
            ) : (
              <p className="flex gap-2 text-muted">
                <MapPin className="mt-0.5 size-4 shrink-0" /> {order.address}
              </p>
            )}
          </section>

          <section className="space-y-3 rounded-[28px] border border-line bg-white p-6">
            <h2 className="text-lg font-bold text-navy">¿Necesitas ayuda?</h2>
            <a
              href={`https://wa.me/52${branch.whatsapp}?text=${help}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25d366] font-bold text-white hover:brightness-95"
            >
              <MessageCircle className="size-5" /> Escribir por WhatsApp
            </a>
            {canCustomerCancel(order) ? (
              <>
                <CancelOrderButton token={token} />
                <p className="text-center text-xs text-dim">Puedes cancelar mientras no empecemos a preparar tu pedido.</p>
              </>
            ) : (
              !cancelled &&
              order.status !== "entregado" && (
                <p className="text-sm text-muted">
                  {order.paymentStatus === "pagado"
                    ? "Tu pago ya está registrado. Si necesitas cancelar o cambiar algo, escríbenos por WhatsApp y te ayudamos con el reembolso."
                    : "Tu pedido ya se está preparando. Si necesitas cancelarlo o cambiarlo, escríbenos por WhatsApp."}
                </p>
              )
            )}
          </section>
        </aside>
      </div>
    </Container>
  );
}
