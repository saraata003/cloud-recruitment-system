import { getSettings, listCategories, listProducts } from "@/lib/repo";
import { MenuClient } from "./MenuClient";

export const dynamic = "force-dynamic";

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  return (
    <MenuClient
      categories={listCategories()}
      products={listProducts({ onlyAvailable: true })}
      initialCategory={c || "all"}
      paused={getSettings().store_status === "paused"}
    />
  );
}
