import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { getBrands, getCategories } from "@/lib/api";
import { getProductById } from "@/lib/admin-data";
import { PageTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "Editar producto" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([getProductById(id), getCategories(), getBrands()]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/productos" className="flex items-center gap-1 text-sm font-semibold text-brand hover:underline">
        <ChevronLeft className="size-4" /> Productos
      </Link>
      <PageTitle
        title={product.name}
        description={`${product.brand} · ${product.sku || "Sin SKU"}`}
        action={
          product.active && (
            <Link
              href={`/producto/${product.slug}`}
              target="_blank"
              className="flex h-12 items-center gap-2 rounded-xl border border-line bg-white px-5 font-semibold hover:border-navy"
            >
              <ExternalLink className="size-4" /> Ver en tienda
            </Link>
          )
        }
      />
      <ProductForm product={product} categories={categories} brands={brands} />
    </>
  );
}
