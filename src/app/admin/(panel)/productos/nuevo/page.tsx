import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getBrands, getCategories } from "@/lib/api";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([getCategories(), getBrands()]);
  return (
    <>
      <Link href="/admin/productos" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft className="size-4" /> Productos
      </Link>
      <PageTitle title="Nuevo producto" description="Llena los datos, sube las fotos y elige en qué categoría aparece." />
      <ProductForm categories={categories} brands={brands} />
    </>
  );
}
