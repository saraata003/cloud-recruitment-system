import "server-only";
import type { PaymentMethod, PaymentStatus } from "../types";

/**
 * Payment layer.
 *
 * The rest of the app only calls `PaymentService.charge()`.
 *
 * How each method works:
 *  - card: the browser turns the card into a one-time token (src/lib/card.ts –
 *    swap the mock tokenizer for the gateway's hosted fields / SDK). Only the
 *    token reaches this server, we charge it here. Card numbers are never sent
 *    to or stored by us.
 *  - cliq: the order is created as `pending`; the customer transfers to our
 *    CliQ alias with the pickup number as reference, staff confirm it from the
 *    kitchen screen. A gateway with CliQ "request to pay" can confirm it
 *    automatically instead.
 *  - cash: `unpaid`, marked paid when the order is picked up.
 *
 * To plug in a real gateway implement `PaymentProvider` and return it from
 * `getProvider()` based on PAYMENT_PROVIDER. Pass `idempotencyKey` through to
 * the gateway so a retried request can never charge twice.
 */

export interface ChargeRequest {
  orderId: string;
  idempotencyKey: string;
  amount: number; // JD
  method: PaymentMethod;
  token?: string; // card token from the browser
  customerName: string;
  customerPhone: string;
}

export interface ChargeResult {
  status: PaymentStatus;
  reference: string | null;
  error?: string;
}

export interface PaymentProvider {
  name: string;
  charge(req: ChargeRequest): Promise<ChargeResult>;
}

/** Mock: card tokens succeed unless the test "decline" card was used. */
const mockProvider: PaymentProvider = {
  name: "mock",
  async charge(req) {
    if (req.method === "cash") return { status: "unpaid", reference: null };
    if (req.method === "cliq") return { status: "pending", reference: null };
    await new Promise((r) => setTimeout(r, 700));
    if (!req.token?.startsWith("tok_mock_")) return { status: "failed", reference: null, error: "بيانات البطاقة غير صالحة" };
    if (req.token === "tok_mock_decline") {
      return { status: "failed", reference: null, error: "البنك رفض العملية وما انخصم منك شي." };
    }
    return { status: "paid", reference: `MOCK-CARD-${req.token.slice(-4)}-${Date.now()}` };
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
