import { BottomNav } from "@/components/BottomNav";
import { CartProvider } from "@/components/cart";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="mx-auto max-w-md min-h-dvh bg-white pb-24 shadow-[0_0_40px_rgba(0,0,0,0.04)]">{children}</div>
      <BottomNav />
    </CartProvider>
  );
}
