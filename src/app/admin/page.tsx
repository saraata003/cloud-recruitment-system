import type { Metadata } from "next";
import { isStaff } from "@/lib/auth";
import { getSettings, listAddons, listCategories, listProducts } from "@/lib/repo";
import { StaffLogin } from "@/components/StaffLogin";
import { AdminClient } from "./AdminClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المنتجات – DRINKAT" };

export default async function AdminPage() {
  if (!(await isStaff())) return <StaffLogin />;
  return (
    <AdminClient
      products={listProducts()}
      categories={listCategories()}
      addons={listAddons()}
      settings={getSettings()}
    />
  );
}
