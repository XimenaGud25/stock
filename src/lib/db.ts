/** Conversión entre las filas de la base (snake_case) y los tipos de la app (camelCase). */
import type { Order, Product } from "@/types";

export type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  highlight: string;
  category_id: string;
  price: number | string;
  compare_at_price: number | string | null;
  rating: number | string;
  review_count: number;
  stock: number;
  low_stock_threshold: number;
  badge: string | null;
  featured: boolean;
  active: boolean;
  description: string;
  includes: string[];
  specs: { label: string; value: string }[];
  images: string[];
  created_at: string;
};

export function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    sku: r.sku,
    name: r.name,
    brand: r.brand,
    highlight: r.highlight,
    categoryId: r.category_id,
    price: Number(r.price),
    compareAtPrice: r.compare_at_price == null ? undefined : Number(r.compare_at_price),
    rating: Number(r.rating),
    reviewCount: r.review_count,
    stock: r.stock,
    lowStockThreshold: r.low_stock_threshold,
    badge: r.badge ?? undefined,
    featured: r.featured,
    active: r.active,
    description: r.description,
    includes: r.includes ?? [],
    specs: r.specs ?? [],
    images: r.images ?? [],
    createdAt: r.created_at,
  };
}

export function productToRow(p: Product): Omit<ProductRow, "created_at"> & { created_at?: string } {
  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    highlight: p.highlight,
    category_id: p.categoryId,
    price: p.price,
    compare_at_price: p.compareAtPrice ?? null,
    rating: p.rating,
    review_count: p.reviewCount,
    stock: p.stock,
    low_stock_threshold: p.lowStockThreshold ?? 3,
    badge: p.badge ?? null,
    featured: Boolean(p.featured),
    active: p.active ?? true,
    description: p.description,
    includes: p.includes,
    specs: p.specs,
    images: p.images,
    created_at: p.createdAt,
  };
}

type OrderRow = {
  id: number;
  customer_name: string;
  phone: string;
  email: string | null;
  delivery: "recoger" | "envio";
  branch_id: string | null;
  address: string | null;
  notes: string | null;
  status: Order["status"];
  channel?: Order["channel"];
  payment_method?: Order["paymentMethod"];
  payment_status?: Order["paymentStatus"];
  paid_at?: string | null;
  payment_ref?: string | null;
  tracking_token?: string;
  total: number | string;
  created_at: string;
  order_items?: { product_id: string | null; name: string; brand: string; price: number | string; quantity: number }[];
  order_events?: { status: Order["status"]; note: string | null; actor: "tienda" | "cliente"; kind?: "estado" | "pago"; created_at: string }[];
};

export function rowToOrder(r: OrderRow): Order {
  return {
    id: r.id,
    customerName: r.customer_name,
    phone: r.phone,
    email: r.email,
    delivery: r.delivery,
    branchId: r.branch_id,
    address: r.address,
    notes: r.notes,
    status: r.status,
    channel: r.channel ?? "en_linea",
    paymentMethod: r.payment_method ?? null,
    paymentStatus: r.payment_status ?? "pendiente",
    paidAt: r.paid_at ?? null,
    paymentRef: r.payment_ref ?? null,
    trackingToken: r.tracking_token ?? "",
    total: Number(r.total),
    createdAt: r.created_at,
    items: (r.order_items ?? []).map((i) => ({
      productId: i.product_id,
      name: i.name,
      brand: i.brand,
      price: Number(i.price),
      quantity: i.quantity,
    })),
    events: (r.order_events ?? [])
      .map((e) => ({ status: e.status, note: e.note, actor: e.actor, kind: e.kind ?? "estado", createdAt: e.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}

/** "Generador Honda 6,500W" → "generador-honda-6500w" */
export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const isLowStock = (p: Pick<Product, "stock" | "lowStockThreshold">) => p.stock <= (p.lowStockThreshold ?? 3);
