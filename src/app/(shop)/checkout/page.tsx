import { getSettings } from "@/lib/repo";
import { CheckoutClient } from "./CheckoutClient";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return <CheckoutClient paused={getSettings().store_status === "paused"} />;
}
