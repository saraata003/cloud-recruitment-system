import type { Metadata } from "next";
import { isStaff } from "@/lib/auth";
import { getSettings } from "@/lib/repo";
import { StaffLogin } from "@/components/StaffLogin";
import { KitchenClient } from "./KitchenClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المطبخ – DRINKAT" };

export default async function KitchenPage() {
  if (!(await isStaff())) return <StaffLogin />;
  return <KitchenClient initialStoreStatus={getSettings().store_status} />;
}
