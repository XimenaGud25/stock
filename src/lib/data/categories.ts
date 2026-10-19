import type { Category } from "@/types";
import { products } from "./products";

const count = (id: string) => products.filter((p) => p.categoryId === id).length;

// Datos de ejemplo. Se reemplazan por la respuesta de GET /categories cuando exista el backend.
export const categories: Category[] = [
  { id: "c1", slug: "generadores", name: "Generadores de luz", icon: "generator", productCount: count("c1") },
  { id: "c2", slug: "rotomartillos", name: "Rotomartillos", icon: "drill", productCount: count("c2") },
  { id: "c3", slug: "desbrozadoras", name: "Desbrozadoras", icon: "trimmer", productCount: count("c3") },
  { id: "c4", slug: "kits-inalambricos", name: "Kits inalámbricos", icon: "battery", productCount: count("c4") },
  { id: "c5", slug: "hidrolavadoras", name: "Hidrolavadoras", icon: "washer", productCount: count("c5") },
  { id: "c6", slug: "demoledores-de-concreto", name: "Demoledores de concreto", icon: "hammer", productCount: count("c6") },
  { id: "c7", slug: "motosierras", name: "Motosierras", icon: "chainsaw", productCount: count("c7") },
];

export const brands = ["Honda", "DeWalt", "Makita", "Bosch", "Hilti", "John Deere", "Stihl"];
