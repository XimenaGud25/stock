/**
 * Cálculos de la pantalla Reportes. Recibe TODOS los pedidos (para saber si un cliente
 * es nuevo o ya había comprado) y calcula todo para el periodo elegido.
 * "Venta" = cualquier pedido que no esté cancelado. Fechas en hora del centro de México.
 */
import type { Category, Order, OrderChannel, PaymentMethod, Product } from "@/types";

export const PERIODS = [
  { value: "hoy", label: "Hoy", days: 1 },
  { value: "7d", label: "7 días", days: 7 },
  { value: "30d", label: "30 días", days: 30 },
  { value: "mes", label: "Este mes", days: 0 },
  { value: "90d", label: "90 días", days: 90 },
  { value: "todo", label: "Todo", days: 0 },
] as const;
export type PeriodValue = (typeof PERIODS)[number]["value"];

const dayFmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" });
/** "2026-11-07" en hora de México */
export const dayKey = (d: Date | string) => dayFmt.format(typeof d === "string" ? new Date(d) : d);

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
/** "2026-11-07" → "7 nov" · "2026-11" → "nov 2026" */
export const bucketLabel = (key: string) => {
  const [y, m, d] = key.split("-");
  return d ? `${Number(d)} ${MONTHS[Number(m) - 1]}` : `${MONTHS[Number(m) - 1]} ${y}`;
};

const addDays = (key: string, n: number) => {
  const d = new Date(`${key}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

type ChannelTotals = { revenue: number; orders: number; units: number; avgTicket: number };
const emptyTotals = (): ChannelTotals => ({ revenue: 0, orders: 0, units: 0, avgTicket: 0 });

export interface SalesReport {
  period: PeriodValue;
  startKey: string;
  endKey: string;
  /** "día" o "mes" según qué tan largo es el periodo */
  bucket: "day" | "month";
  totals: Record<"all" | OrderChannel, ChannelTotals>;
  /** Ventas del periodo anterior de la misma duración (null en "Todo") */
  previousRevenue: number | null;
  cancelled: { orders: number; amount: number };
  /** De las ventas del periodo: cuánto ya se cobró y cuánto falta por cobrar */
  collection: { collected: number; pending: number; pendingOrders: number; toConfirm: number };
  series: { key: string; en_linea: number; tienda: number }[];
  topProducts: { productId: string | null; name: string; brand: string; units: number; revenue: number; online: number; store: number }[];
  categories: { name: string; revenue: number; units: number }[];
  payments: { method: PaymentMethod | "sin_dato"; revenue: number; orders: number }[];
  onlineDelivery: { recoger: number; envio: number };
  onlineStatus: Record<Order["status"], number>;
  customers: {
    active: number;
    newOnes: number;
    returning: number;
    top: { name: string; phone: string; orders: number; revenue: number; lastOrder: string; channels: OrderChannel[] }[];
  };
}

export function buildSalesReport(allOrders: Order[], products: Product[], categories: Category[], period: PeriodValue, now = new Date()): SalesReport {
  const endKey = dayKey(now);
  const p = PERIODS.find((x) => x.value === period) ?? PERIODS[2];
  let startKey: string;
  if (p.value === "mes") startKey = `${endKey.slice(0, 8)}01`;
  else if (p.value === "todo") startKey = allOrders.length ? dayKey(allOrders.reduce((m, o) => (o.createdAt < m ? o.createdAt : m), allOrders[0].createdAt)) : endKey;
  else startKey = addDays(endKey, -(p.days - 1));

  const span = daysBetween(startKey, endKey) + 1;
  const bucket: SalesReport["bucket"] = span > 92 ? "month" : "day";
  const bucketOf = (key: string) => (bucket === "month" ? key.slice(0, 7) : key);

  const inPeriod = allOrders.filter((o) => {
    const k = dayKey(o.createdAt);
    return k >= startKey && k <= endKey;
  });
  const sales = inPeriod.filter((o) => o.status !== "cancelado");

  // Totales por canal
  const totals = { all: emptyTotals(), en_linea: emptyTotals(), tienda: emptyTotals() };
  for (const o of sales) {
    const units = o.items.reduce((n, i) => n + i.quantity, 0);
    for (const t of [totals.all, totals[o.channel]]) {
      t.revenue += o.total;
      t.orders += 1;
      t.units += units;
    }
  }
  for (const t of Object.values(totals)) t.avgTicket = t.orders ? t.revenue / t.orders : 0;

  // Periodo anterior
  let previousRevenue: number | null = null;
  if (p.value !== "todo") {
    const prevEnd = addDays(startKey, -1);
    const prevStart = addDays(startKey, -span);
    previousRevenue = allOrders
      .filter((o) => o.status !== "cancelado")
      .filter((o) => {
        const k = dayKey(o.createdAt);
        return k >= prevStart && k <= prevEnd;
      })
      .reduce((n, o) => n + o.total, 0);
  }

  const cancelledOrders = inPeriod.filter((o) => o.status === "cancelado");

  // Serie por día / mes, con todos los huecos en cero
  const seriesMap = new Map<string, { key: string; en_linea: number; tienda: number }>();
  for (let k = startKey; k <= endKey; k = addDays(k, 1)) {
    const b = bucketOf(k);
    if (!seriesMap.has(b)) seriesMap.set(b, { key: b, en_linea: 0, tienda: 0 });
  }
  for (const o of sales) seriesMap.get(bucketOf(dayKey(o.createdAt)))![o.channel] += o.total;

  // Productos y categorías
  const productById = new Map(products.map((x) => [x.id, x]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const prodMap = new Map<string, SalesReport["topProducts"][number]>();
  const catMap = new Map<string, { name: string; revenue: number; units: number }>();
  for (const o of sales) {
    for (const i of o.items) {
      const key = i.productId ?? `${i.name}|${i.brand}`;
      const row = prodMap.get(key) ?? { productId: i.productId, name: i.name, brand: i.brand, units: 0, revenue: 0, online: 0, store: 0 };
      row.units += i.quantity;
      row.revenue += i.price * i.quantity;
      if (o.channel === "en_linea") row.online += i.quantity;
      else row.store += i.quantity;
      prodMap.set(key, row);

      const catId = (i.productId && productById.get(i.productId)?.categoryId) || "otros";
      const cat = catMap.get(catId) ?? { name: categoryName.get(catId) ?? "Otros / descontinuados", revenue: 0, units: 0 };
      cat.revenue += i.price * i.quantity;
      cat.units += i.quantity;
      catMap.set(catId, cat);
    }
  }

  // Formas de pago (ventas en tienda)
  const payMap = new Map<SalesReport["payments"][number]["method"], { revenue: number; orders: number }>();
  for (const o of sales.filter((x) => x.channel === "tienda")) {
    const m = o.paymentMethod ?? "sin_dato";
    const row = payMap.get(m) ?? { revenue: 0, orders: 0 };
    row.revenue += o.total;
    row.orders += 1;
    payMap.set(m, row);
  }

  // Pedidos en línea: entrega y estado
  const online = inPeriod.filter((o) => o.channel === "en_linea");
  const onlineStatus = { nuevo: 0, confirmado: 0, preparando: 0, listo: 0, entregado: 0, cancelado: 0 };
  const onlineDelivery = { recoger: 0, envio: 0 };
  for (const o of online) {
    onlineStatus[o.status]++;
    if (o.status !== "cancelado") onlineDelivery[o.delivery]++;
  }

  // Clientes (se identifican por teléfono; las ventas de mostrador sin teléfono no cuentan)
  const firstOrderKey = new Map<string, string>();
  for (const o of allOrders) {
    if (o.status === "cancelado" || !o.phone) continue;
    const k = dayKey(o.createdAt);
    const prev = firstOrderKey.get(o.phone);
    if (!prev || k < prev) firstOrderKey.set(o.phone, k);
  }
  const custMap = new Map<string, SalesReport["customers"]["top"][number]>();
  for (const o of sales) {
    if (!o.phone) continue;
    const c = custMap.get(o.phone) ?? { name: o.customerName, phone: o.phone, orders: 0, revenue: 0, lastOrder: o.createdAt, channels: [] };
    c.orders += 1;
    c.revenue += o.total;
    if (o.createdAt >= c.lastOrder) {
      c.lastOrder = o.createdAt;
      c.name = o.customerName;
    }
    if (!c.channels.includes(o.channel)) c.channels.push(o.channel);
    custMap.set(o.phone, c);
  }
  const newOnes = [...custMap.keys()].filter((ph) => (firstOrderKey.get(ph) ?? "") >= startKey).length;

  return {
    period: p.value,
    startKey,
    endKey,
    bucket,
    totals,
    previousRevenue,
    cancelled: { orders: cancelledOrders.length, amount: cancelledOrders.reduce((n, o) => n + o.total, 0) },
    collection: {
      collected: sales.filter((o) => o.paymentStatus === "pagado").reduce((n, o) => n + o.total, 0),
      pending: sales.filter((o) => o.paymentStatus !== "pagado").reduce((n, o) => n + o.total, 0),
      pendingOrders: sales.filter((o) => o.paymentStatus !== "pagado").length,
      toConfirm: sales.filter((o) => o.paymentStatus === "por_confirmar").length,
    },
    series: [...seriesMap.values()],
    topProducts: [...prodMap.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, 10),
    categories: [...catMap.values()].sort((a, b) => b.revenue - a.revenue),
    payments: [...payMap.entries()].map(([method, v]) => ({ method, ...v })).sort((a, b) => b.revenue - a.revenue),
    onlineDelivery,
    onlineStatus,
    customers: {
      active: custMap.size,
      newOnes,
      returning: custMap.size - newOnes,
      top: [...custMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    },
  };
}
