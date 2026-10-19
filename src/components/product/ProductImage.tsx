import Image from "next/image";
import { BatteryFull, Package } from "lucide-react";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { categories } from "@/lib/data/categories";
import type { Product } from "@/types";
import { cn } from "@/lib/format";

interface Props {
  product: Product;
  /** Índice de la imagen (0 = principal) */
  index?: number;
  className?: string;
  iconClassName?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Muestra la foto del producto. Si todavía no hay fotos, dibuja un ícono provisional
 * (el mismo estilo que en el diseño de Figma).
 */
export function ProductImage({ product, index = 0, className, iconClassName, sizes = "400px", priority }: Props) {
  const src = product.images[index];

  if (src) {
    return (
      <div className={cn("relative overflow-hidden bg-white", className)}>
        <Image src={src} alt={product.name} fill sizes={sizes} priority={priority} className="object-contain p-6" />
      </div>
    );
  }

  const icon = categories.find((c) => c.id === product.categoryId)?.icon ?? "drill";
  const iconCls = cn("size-28 text-[#34405a]", iconClassName);
  return (
    <div className={cn("grid place-items-center bg-[#f1f4f9]", className)} aria-label={product.name} role="img">
      {index === 1 ? (
        <BatteryFull strokeWidth={1.2} className={iconCls} />
      ) : index === 2 ? (
        <Package strokeWidth={1.2} className={iconCls} />
      ) : (
        <CategoryIcon icon={icon} strokeWidth={1.2} className={iconCls} />
      )}
    </div>
  );
}
