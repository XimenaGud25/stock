/**
 * Tipos del dominio. Son el "contrato" entre el front y el backend:
 * cuando hagas la API, que devuelva objetos con esta misma forma.
 */

export type CategoryIcon =
  | "generator"
  | "drill"
  | "trimmer"
  | "battery"
  | "washer"
  | "hammer"
  | "chainsaw";

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: CategoryIcon;
  productCount: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  /** Dato corto que se muestra junto a la marca: "20V", "900W", "108 PZAS"… */
  highlight: string;
  categoryId: string;
  /** Precio en MXN con IVA incluido */
  price: number;
  /** Precio anterior (si está en oferta) */
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  /** Etiqueta amarilla opcional: "Más vendido", "Nuevo"… */
  badge?: string;
  featured?: boolean;
  description: string;
  includes: string[];
  specs: ProductSpec[];
  /** URLs de imágenes. Vacío = se muestra un ícono provisional. */
  images: string[];
  createdAt: string;
  /** Con este stock o menos aparece en las alertas de "Poco stock" del panel */
  lowStockThreshold?: number;
  /** false = oculto en la tienda (solo se ve en el panel) */
  active?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  tag: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  /** Texto que se usa para el mapa y el botón "Cómo llegar" */
  mapQuery: string;
  /** 0 = domingo … 6 = sábado. null = cerrado */
  hours: Record<number, { open: string; close: string } | null>;
  services: string[];
}

export type SortOption = "relevancia" | "precio-asc" | "precio-desc" | "descuento" | "nuevos" | "calificacion";

export interface ProductFilters {
  q?: string;
  category?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

export type OrderStatus = "nuevo" | "confirmado" | "entregado" | "cancelado";

export interface OrderItem {
  productId: string | null;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customerName: string;
  phone: string;
  email: string | null;
  delivery: "recoger" | "envio";
  branchId: string | null;
  address: string | null;
  notes: string | null;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: OrderItem[];
}
