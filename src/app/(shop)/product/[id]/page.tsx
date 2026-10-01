import { notFound } from "next/navigation";
import { addonsForProduct, getProduct, getSettings, listCategories } from "@/lib/repo";
import { categoryEmoji } from "@/lib/category-emoji";
import { ProductClient } from "./ProductClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const product = getProduct((await params).id);
  if (!product) notFound();
  return (
    <ProductClient
      product={product}
      addons={addonsForProduct(product)}
      emoji={categoryEmoji(listCategories(), product.category)}
      paused={getSettings().store_status === "paused"}
    />
  );
}
