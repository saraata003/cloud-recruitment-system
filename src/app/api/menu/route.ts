import { getSettings, listAddons, listCategories, listProducts } from "@/lib/repo";
import { handler, json } from "@/lib/http";

export const dynamic = "force-dynamic";

export const GET = handler(async () =>
  json({
    categories: listCategories(),
    products: listProducts({ onlyAvailable: true }),
    addons: listAddons(),
    settings: getSettings(),
  }),
);
