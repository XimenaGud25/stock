"use client";

import { startTransition, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  FlaskConical,
  Lock,
  Mail,
  MapPinned,
  MessageCircle,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import { useCart } from "./CartProvider";
import { placeOrder, type CheckoutPayment, type CheckoutState } from "@/app/(tienda)/checkout/actions";
import { cn, formatPrice } from "@/lib/format";

type BranchOption = { id: string; name: string; address: string };
type Delivery = "recoger" | "envio";
type Customer = { email: string; name: string; phone: string };
type Address = { street: string; colony: string; city: string; state: string; zip: string; refs: string };
type Card = { number: string; holder: string; exp: string; cvc: string };

const SAVED_KEY = "sh-cliente";
const STEPS = ["Tus datos", "Entrega", "Pago"] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const input =
  "h-[52px] w-full rounded-2xl border border-line bg-white px-4 text-base outline-none placeholder:text-dim focus:border-brand";

/* ------------------------------ Tarjeta ------------------------------ */

const digits = (v: string) => v.replace(/\D/g, "");
const cardBrand = (n: string) => (/^4/.test(n) ? "Visa" : /^(5[1-5]|2[2-7])/.test(n) ? "Mastercard" : /^3[47]/.test(n) ? "Amex" : "Tarjeta");
const formatCard = (v: string) => digits(v).slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
const formatExp = (v: string) => {
  const d = digits(v).slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};
/** Algoritmo de Luhn: detecta números de tarjeta mal escritos. */
function luhn(n: string) {
  let sum = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return n.length >= 15 && sum % 10 === 0;
}
function cardError(c: Card) {
  const n = digits(c.number);
  if (!luhn(n)) return "Revisa el número de tarjeta.";
  if (c.holder.trim().length < 3) return "Escribe el nombre como aparece en la tarjeta.";
  const [mm, yy] = c.exp.split("/").map(Number);
  const now = new Date();
  const expired = !yy || yy + 2000 < now.getFullYear() || (yy + 2000 === now.getFullYear() && mm < now.getMonth() + 1);
  if (!mm || mm > 12 || expired) return "Revisa la fecha de vencimiento (MM/AA).";
  if (!/^\d{3,4}$/.test(c.cvc)) return "El código de seguridad tiene 3 o 4 dígitos.";
  return null;
}

/* ---------------------------- Piezas de UI ---------------------------- */

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full text-sm font-bold",
                done && "bg-brand text-white",
                current && "bg-navy text-white ring-4 ring-navy/15",
                !done && !current && "bg-surface text-dim",
              )}
            >
              {done ? <Check className="size-5" /> : n}
            </span>
            <span className={cn("hidden text-sm font-semibold sm:block", current ? "text-navy" : "text-dim")}>{label}</span>
            {n < STEPS.length && <span className={cn("h-0.5 flex-1 rounded", done ? "bg-brand" : "bg-line")} />}
          </li>
        );
      })}
    </ol>
  );
}

function OptionCard({
  selected,
  onClick,
  Icon,
  title,
  text,
}: {
  selected: boolean;
  onClick: () => void;
  Icon: typeof Store;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-2xl border-[1.5px] px-5 py-4 text-left transition",
        selected ? "border-brand bg-brand-soft" : "border-line hover:border-navy",
      )}
    >
      <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl", selected ? "bg-brand text-white" : "bg-surface text-navy")}>
        <Icon className="size-5" />
      </span>
      <span>
        <span className={cn("block font-semibold", selected ? "text-brand" : "text-ink")}>{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}

function Field({ label, className, ...props }: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-semibold">{label}</span>
      <input {...props} className={input} />
    </label>
  );
}

/* --------------------------- Pedido confirmado --------------------------- */

function OrderPlaced({ state }: { state: Extract<CheckoutState, { status: "ok" }> }) {
  const online = state.payment === "en_linea";
  const steps = [
    online
      ? { title: "Confirmamos tu pago", text: "Lo verificamos y te avisamos por correo." }
      : { title: "Confirmamos tu pedido", text: "Revisamos existencias y te avisamos por correo." },
    { title: "Preparamos tu herramienta", text: "Te llega un correo cuando empezamos a prepararla." },
    state.delivery === "recoger"
      ? { title: "Recoge en sucursal", text: `En ${state.branchName}${online ? "" : "; pagas ahí en efectivo o con tarjeta"}. Te avisamos cuando esté lista.` }
      : { title: "Te lo enviamos", text: "Te avisamos por correo cuando salga a entrega." },
  ];

  return (
    <section className="mx-auto max-w-3xl space-y-8 rounded-[28px] border border-line bg-white p-6 sm:p-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-ok-soft text-ok">
          <CheckCircle2 className="size-8" />
        </span>
        <p className="text-sm font-bold uppercase tracking-wider text-brand">{online ? "Pago recibido" : "Pedido apartado"}</p>
        {state.orderId ? (
          <>
            <p className="text-muted">Tu número de pedido es</p>
            <h2 className="font-display text-5xl font-bold text-navy">#{state.orderId}</h2>
          </>
        ) : (
          <h2 className="font-display text-3xl font-bold text-navy">¡Pedido listo!</h2>
        )}
        <p className="text-lg text-muted">
          Total <b className="text-navy">{formatPrice(state.total)}</b> · {online ? "Pagado en línea" : "Pagas en sucursal"}
        </p>
        {state.paymentRef && <p className="rounded-xl bg-surface px-4 py-2 font-mono text-sm text-muted">Referencia: {state.paymentRef}</p>}
        <p className="flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-2.5 text-sm text-brand">
          <Mail className="size-4 shrink-0" /> Te mandamos la confirmación a <b>{state.email}</b>
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-navy">¿Qué sigue?</h3>
        <ol className="space-y-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className={cn("grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold", i === 0 ? "bg-accent text-navy" : "bg-surface text-muted")}>
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold">{s.title}</span>
                <span className="block text-sm text-muted">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {state.trackingPath && (
          <Link
            href={state.trackingPath}
            className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl bg-navy px-6 font-bold text-white hover:bg-navy/90"
          >
            <MapPinned className="size-5" /> Seguir mi pedido
          </Link>
        )}
        <a
          href={state.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-14 flex-1 items-center justify-center gap-2.5 rounded-2xl border border-line px-6 font-bold text-navy hover:bg-surface"
        >
          <MessageCircle className="size-5" /> ¿Dudas? WhatsApp
        </a>
      </div>
      <p className="text-center text-sm text-dim">Guarda tu número de pedido. También puedes consultarlo en “Mi pedido” con tu número y teléfono.</p>
    </section>
  );
}

/* ------------------------------ Formulario ------------------------------ */

export function CheckoutForm({ branches }: { branches: BranchOption[] }) {
  const { items, subtotal, clear } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, { status: "idle" });
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState<string>();

  const [customer, setCustomer] = useState<Customer>({ email: "", name: "", phone: "" });
  const [saved, setSaved] = useState<Customer | null>(null);
  const [remember, setRemember] = useState(true);
  const [delivery, setDelivery] = useState<Delivery>("recoger");
  const [branch, setBranch] = useState(branches[0]?.id ?? "");
  const [address, setAddress] = useState<Address>({ street: "", colony: "", city: "", state: "", zip: "", refs: "" });
  const [payment, setPayment] = useState<CheckoutPayment>("en_linea");
  const [card, setCard] = useState<Card>({ number: "", holder: "", exp: "", cvc: "" });
  const [notes, setNotes] = useState("");

  // Datos recordados de una compra anterior en este equipo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) {
        const c = JSON.parse(raw) as Customer;
        if (c.email) {
          setSaved(c);
          setCustomer(c);
        }
      }
    } catch {
      /* sin datos guardados */
    }
  }, []);

  useEffect(() => {
    if (state.status === "ok") clear();
    // `clear` cambia en cada render del carrito; solo nos importa cuando el pedido se confirma
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  // A domicilio el pago es en línea
  useEffect(() => {
    if (delivery === "envio") setPayment("en_linea");
  }, [delivery]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  if (state.status === "ok") return <OrderPlaced state={state} />;

  if (!items.length) {
    return (
      <section className="flex flex-col items-center gap-4 rounded-[28px] border border-line bg-white p-14 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-brand-soft text-brand">
          <ShoppingCart className="size-7" />
        </span>
        <p className="text-lg font-semibold">Tu carrito está vacío</p>
        <Link href="/catalogo" className="font-semibold text-brand hover:underline">
          Ver catálogo
        </Link>
      </section>
    );
  }

  const validateStep = (): string | null => {
    if (step === 1) {
      if (!EMAIL.test(customer.email.trim())) return "Escribe un correo válido.";
      if (customer.name.trim().length < 3) return "Escribe tu nombre completo.";
      if (digits(customer.phone).length !== 10) return "El teléfono debe tener 10 dígitos.";
    }
    if (step === 2 && delivery === "envio") {
      const a = address;
      if (!a.street.trim() || !a.colony.trim() || !a.city.trim() || !a.state.trim()) return "Completa la dirección de envío.";
      if (digits(a.zip).length !== 5) return "El código postal tiene 5 dígitos.";
    }
    if (step === 3 && payment === "en_linea") return cardError(card);
    return null;
  };

  const next = () => {
    const err = validateStep();
    setStepError(err ?? undefined);
    if (err) return;
    if (step === 1) {
      try {
        if (remember) localStorage.setItem(SAVED_KEY, JSON.stringify({ ...customer, phone: digits(customer.phone) }));
        else localStorage.removeItem(SAVED_KEY);
      } catch {
        /* el navegador no deja guardar: no pasa nada */
      }
    }
    setStep((s) => s + 1);
  };

  const submit = () => {
    const err = validateStep();
    setStepError(err ?? undefined);
    if (err) return;
    const fd = new FormData();
    fd.set("items", JSON.stringify(items));
    fd.set("email", customer.email);
    fd.set("name", customer.name);
    fd.set("phone", customer.phone);
    fd.set("delivery", delivery);
    fd.set("branch", branch);
    Object.entries(address).forEach(([k, v]) => fd.set(k, v));
    fd.set("payment", payment);
    fd.set("notes", notes);
    if (payment === "en_linea") {
      // Solo viajan los últimos 4 dígitos y la marca; nunca el número completo
      const n = digits(card.number);
      fd.set("card_last4", n.slice(-4));
      fd.set("card_brand", cardBrand(n));
      fd.set("card_holder", card.holder.trim());
    }
    startTransition(() => action(fd));
  };

  const error = stepError ?? (state.status === "error" ? state.message : undefined);
  const branchInfo = branches.find((b) => b.id === branch);
  const brand = cardBrand(digits(card.number));
  const setAddr = (k: keyof Address) => (e: React.ChangeEvent<HTMLInputElement>) => setAddress((a) => ({ ...a, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 3) next();
        else submit();
      }}
      className="grid gap-10 lg:grid-cols-[1fr_440px]"
    >
      <div className="space-y-8 rounded-[28px] border border-line bg-white p-6 sm:p-8">
        <Stepper step={step} />

        {/* ----------------------- Paso 1: Tus datos ----------------------- */}
        {step === 1 && (
          <section className="space-y-5">
            <div>
              <h2 className="flex items-center gap-2 text-[22px] font-bold text-navy">
                <UserRound className="size-6 text-brand" /> Inicia sesión para comprar
              </h2>
              <p className="text-muted">Sin contraseña: solo tu correo, nombre y teléfono. Ahí te avisamos cómo va tu pedido.</p>
            </div>

            {saved && saved.email === customer.email && saved.name === customer.name ? (
              <div className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-brand bg-brand-soft p-5 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  <span className="block font-semibold text-navy">Hola de nuevo, {saved.name.split(" ")[0]}</span>
                  <span className="block text-sm text-muted">
                    {saved.email} · {saved.phone}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setCustomer({ email: "", name: "", phone: "" })}
                  className="text-sm font-semibold text-brand hover:underline"
                >
                  No soy yo
                </button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Correo electrónico *"
                  className="sm:col-span-2"
                  type="email"
                  autoComplete="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={customer.email}
                  onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                />
                <Field
                  label="Nombre completo *"
                  autoComplete="name"
                  value={customer.name}
                  onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                />
                <Field
                  label="Teléfono / WhatsApp *"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10 dígitos"
                  value={customer.phone}
                  onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
                />
                <label className="flex items-center gap-2 text-sm text-muted sm:col-span-2">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-brand" />
                  Recordar mis datos en este equipo
                </label>
              </div>
            )}
          </section>
        )}

        {/* ------------------------- Paso 2: Entrega ------------------------- */}
        {step === 2 && (
          <section className="space-y-6">
            <h2 className="text-[22px] font-bold text-navy">¿Cómo quieres recibirlo?</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <OptionCard selected={delivery === "recoger"} onClick={() => setDelivery("recoger")} Icon={Store} title="Recoger en tienda" text="Sin costo, normalmente el mismo día." />
              <OptionCard selected={delivery === "envio"} onClick={() => setDelivery("envio")} Icon={Truck} title="Envío a domicilio" text="24/48 h a tu obra o domicilio." />
            </div>

            {delivery === "recoger" ? (
              <>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold">Sucursal</span>
                  <select value={branch} onChange={(e) => setBranch(e.target.value)} className={input}>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} — {b.address}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="space-y-3">
                  <h3 className="font-bold text-navy">¿Cómo quieres pagar?</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OptionCard
                      selected={payment === "en_sucursal"}
                      onClick={() => setPayment("en_sucursal")}
                      Icon={Store}
                      title="Pagar en sucursal"
                      text="Efectivo o tarjeta al recoger."
                    />
                    <OptionCard
                      selected={payment === "en_linea"}
                      onClick={() => setPayment("en_linea")}
                      Icon={CreditCard}
                      title="Pagar en línea"
                      text="Con tarjeta ahora y solo pasas por él."
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Calle y número *" className="sm:col-span-2" autoComplete="street-address" placeholder="Av. Juárez 123, int. 4" value={address.street} onChange={setAddr("street")} />
                  <Field label="Colonia *" value={address.colony} onChange={setAddr("colony")} />
                  <Field label="Código postal *" inputMode="numeric" autoComplete="postal-code" maxLength={5} value={address.zip} onChange={setAddr("zip")} />
                  <Field label="Ciudad / Municipio *" autoComplete="address-level2" value={address.city} onChange={setAddr("city")} />
                  <Field label="Estado *" autoComplete="address-level1" value={address.state} onChange={setAddr("state")} />
                  <Field label="Referencias (opcional)" className="sm:col-span-2" placeholder="Entre calles, color de la casa, horario…" value={address.refs} onChange={setAddr("refs")} />
                </div>
                <p className="flex items-start gap-2 rounded-2xl bg-surface px-4 py-3 text-sm text-muted">
                  <CreditCard className="mt-0.5 size-4 shrink-0 text-brand" /> El envío a domicilio se paga en línea en el siguiente paso.
                </p>
              </>
            )}
          </section>
        )}

        {/* --------------------------- Paso 3: Pago --------------------------- */}
        {step === 3 && (
          <section className="space-y-6">
            {payment === "en_linea" ? (
              <>
                <h2 className="flex items-center gap-2 text-[22px] font-bold text-navy">
                  <Lock className="size-5 text-brand" /> Pago con tarjeta
                </h2>
                <div className="flex items-start gap-3 rounded-2xl border border-accent bg-accent/15 px-4 py-3 text-sm text-[#8a5a00]">
                  <FlaskConical className="mt-0.5 size-5 shrink-0" />
                  <span>
                    <b className="block">Modo de prueba: no se cobra nada.</b>
                    Usa la tarjeta <span className="font-mono font-semibold">4242 4242 4242 4242</span>, cualquier fecha futura y cualquier CVV. Con{" "}
                    <span className="font-mono">4000 0000 0000 0002</span> puedes probar un pago rechazado.
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2 sm:col-span-2">
                    <span className="flex items-center justify-between text-sm font-semibold">
                      Número de tarjeta * {digits(card.number) && <span className="text-xs font-bold uppercase tracking-wider text-brand">{brand}</span>}
                    </span>
                    <input
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="1234 5678 9012 3456"
                      value={card.number}
                      onChange={(e) => setCard((c) => ({ ...c, number: formatCard(e.target.value) }))}
                      className={cn(input, "font-mono tracking-wider")}
                    />
                  </label>
                  <Field
                    label="Nombre en la tarjeta *"
                    className="sm:col-span-2"
                    autoComplete="cc-name"
                    value={card.holder}
                    onChange={(e) => setCard((c) => ({ ...c, holder: e.target.value }))}
                  />
                  <Field
                    label="Vencimiento *"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    value={card.exp}
                    onChange={(e) => setCard((c) => ({ ...c, exp: formatExp(e.target.value) }))}
                  />
                  <Field
                    label="CVV *"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    placeholder="123"
                    maxLength={4}
                    value={card.cvc}
                    onChange={(e) => setCard((c) => ({ ...c, cvc: digits(e.target.value) }))}
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="flex items-center gap-2 text-[22px] font-bold text-navy">
                  <Store className="size-5 text-brand" /> Pagas al recoger
                </h2>
                <p className="rounded-2xl bg-surface px-5 py-4 text-muted">
                  Apartamos tu herramienta y pagas <b className="text-navy">{formatPrice(subtotal)}</b> en efectivo o con tarjeta en{" "}
                  <b className="text-navy">{branchInfo?.name}</b>. Te avisamos por correo cuando esté lista.
                </p>
              </>
            )}
            <label className="block space-y-2">
              <span className="text-sm font-semibold">Notas (opcional)</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="¿Necesitas factura? ¿Algún horario?"
                className={cn(input, "h-auto py-3")}
              />
            </label>
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
          {step > 1 ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setStepError(undefined);
                setStep((s) => s - 1);
              }}
              className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-line px-6 font-bold text-navy hover:bg-surface disabled:opacity-50"
            >
              <ArrowLeft className="size-5" /> Atrás
            </button>
          ) : (
            <span />
          )}
          <button
            disabled={pending}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-accent px-8 font-bold text-navy hover:brightness-95 disabled:opacity-60"
          >
            {step < 3 ? (
              <>
                Continuar <ArrowRight className="size-5" />
              </>
            ) : pending ? (
              payment === "en_linea" ? "Procesando pago…" : "Apartando tu pedido…"
            ) : payment === "en_linea" ? (
              <>
                <Lock className="size-5" /> Pagar {formatPrice(subtotal)}
              </>
            ) : (
              "Confirmar pedido"
            )}
          </button>
        </div>
      </div>

      <aside className="h-fit space-y-5 rounded-[28px] border border-line bg-white p-8 lg:sticky lg:top-32">
        <h2 className="text-[22px] font-bold text-navy">Resumen</h2>
        <ul className="divide-y divide-line">
          {items.map((i) => (
            <li key={i.productId} className="flex justify-between gap-4 py-3">
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
        <dl className="space-y-1.5 border-t border-line pt-4 text-sm">
          {step > 1 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Cliente</dt>
              <dd className="truncate font-medium">{customer.email}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Entrega</dt>
            <dd className="font-medium">{delivery === "recoger" ? "Recoger en tienda" : "Envío a domicilio"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Pago</dt>
            <dd className="font-medium">{payment === "en_linea" ? "En línea" : "En sucursal"}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="text-muted">Total (IVA incluido)</span>
          <span className="font-display text-3xl font-bold text-navy">{formatPrice(subtotal)}</span>
        </div>
        <p className="flex items-start gap-2 text-[13px] text-dim">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" />
          Te avisamos por correo cada paso: pago confirmado, preparando y {delivery === "envio" ? "enviado" : "listo para recoger"}.
        </p>
      </aside>
    </form>
  );
}
