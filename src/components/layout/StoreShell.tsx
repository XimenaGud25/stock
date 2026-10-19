import { TopBar } from "./TopBar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartProvider } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";

/** Encabezado, pie y carrito de la tienda (el panel /admin no los usa). */
export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </CartProvider>
  );
}
