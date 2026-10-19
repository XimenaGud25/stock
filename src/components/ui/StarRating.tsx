import { Star } from "lucide-react";

export function StarRating({ rating, count, full = false }: { rating: number; count: number; full?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {full ? (
        Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`size-5 ${i < Math.round(rating) ? "fill-accent text-accent" : "fill-line text-line"}`} />
        ))
      ) : (
        <Star className="size-4 fill-accent text-accent" />
      )}
      <span className="font-semibold">{rating.toFixed(1)}</span>
      <span className="text-dim">({count}{full ? " reseñas" : ""})</span>
    </div>
  );
}

export function StockStatus({ stock, showCount = false }: { stock: number; showCount?: boolean }) {
  const inStock = stock > 0;
  return (
    <span className={`flex items-center gap-1.5 text-sm font-medium ${inStock ? "text-ok" : "text-danger"}`}>
      <span className={`size-2 rounded-full ${inStock ? "bg-ok" : "bg-danger"}`} />
      {inStock ? (showCount ? `En stock · ${stock} piezas` : "En stock") : "Agotado"}
    </span>
  );
}
