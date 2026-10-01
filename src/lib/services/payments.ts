import "server-only";
import type { PaymentMethod, PaymentStatus } from "../types";

/**
 * Payment layer.
 *
 * The rest of the app only calls `PaymentService.charge()`. To plug in a real
 * gateway (e.g. a card gateway or CliQ provider) implement `PaymentProvider`
 * and return it from `getProvider()` based on PAYMENT_PROVIDER.
 *
 * For hosted-payment-page gateways return `{ status: "unpaid", redirectUrl }`
 * and confirm the payment later from a webhook route.
 */

export interface ChargeRequest {
  orderId: string;
  amount: number; // JD
  method: PaymentMethod;
  customerName: string;
  customerPhone: string;
}

export interface ChargeResult {
  status: PaymentStatus;
  reference: string | null;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  charge(req: ChargeRequest): Promise<ChargeResult>;
}

/** Pretends every online payment succeeds. Cash is paid at the counter. */
const mockProvider: PaymentProvider = {
  name: "mock",
  async charge(req) {
    if (req.method === "cash") return { status: "unpaid", reference: null };
    await new Promise((r) => setTimeout(r, 300));
    return { status: "paid", reference: `MOCK-${req.method.toUpperCase()}-${Date.now()}` };
  },
};

function getProvider(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER) {
    // case "my-gateway": return myGatewayProvider;
    default:
      return mockProvider;
  }
}

export const PaymentService = {
  methods: ["card", "cliq", "cash"] as PaymentMethod[],
  charge: (req: ChargeRequest) => getProvider().charge(req),
};
