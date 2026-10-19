import type { Product } from "@/types";

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

export const formatPrice = (value: number) => mxn.format(value);

export function discountPercent(p: Pick<Product, "price" | "compareAtPrice">) {
  if (!p.compareAtPrice || p.compareAtPrice <= p.price) return 0;
  return Math.round((1 - p.price / p.compareAtPrice) * 100);
}

export function savings(p: Pick<Product, "price" | "compareAtPrice">) {
  return p.compareAtPrice ? p.compareAtPrice - p.price : 0;
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const dateFmt = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
