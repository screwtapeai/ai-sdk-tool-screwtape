import { tool } from "ai";
import { z } from "zod";

export interface SpendCheckOptions {
  apiKey?: string;
  apiUrl?: string;
  /** Record checked invoices so later duplicates are caught. Default true. */
  store?: boolean;
}

const invoiceSchema = z.object({
  invoice_id: z.string(),
  vendor: z.string(),
  date: z.string().optional(),
  currency: z.string(),
  items: z.array(z.object({ description: z.string().optional(), amount: z.number() })),
  tax: z.number(),
  total: z.number(),
});

/** Call before paying any invoice. Pay only when `pay` is true. */
export function screwtapeSpendCheck(options: SpendCheckOptions = {}) {
  const apiUrl = options.apiUrl ?? process.env.SCREWTAPE_API_URL ?? "https://screwtape.ai";
  return tool({
    description:
      "Call before paying any invoice. Checks for duplicate invoices, checks line items plus tax against the total, " +
      "and judges the invoice against the evidence. Pay only when pay is true.",
    inputSchema: z.object({
      invoice: invoiceSchema,
      evidence: z.array(z.string()).describe("Purchase order, contract or approval text."),
    }),
    execute: async ({ invoice, evidence }) => {
      const apiKey = options.apiKey ?? process.env.SCREWTAPE_API_KEY;
      if (!apiKey) throw new Error("Set SCREWTAPE_API_KEY (free key: https://screwtape.ai/signup/).");
      const parts = [...invoice.items.map((_, i) => `items.${i}.amount`), "tax"];
      const res = await fetch(`${apiUrl}/v1/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "User-Agent": "ai-sdk-tool-screwtape/0.1.0" },
        body: JSON.stringify({
          task: `Decide whether the agent may pay invoice ${invoice.invoice_id} from ${invoice.vendor}.`,
          agent_output: JSON.stringify(invoice),
          evidence,
          checks: [{ type: "sum", parts, total: "total", tolerance: 0.01 }],
          duplicate: { vendor_path: "vendor", invoice_id_path: "invoice_id", amount_path: "total",
                       currency_path: "currency", date_path: "date", store: options.store ?? true },
        }),
      });
      if (!res.ok) throw new Error(`Screwtape API ${res.status}: ${await res.text()}`);
      const r = (await res.json()) as {
        verdict?: string; next_step?: { action?: string; error_type?: string; hint?: string };
        duplicate?: { status?: string }; receipt?: { receipt_id?: string } | null;
      };
      return {
        pay: r.next_step?.action === "pass",
        action: r.next_step?.action, reason: r.next_step?.error_type, hint: r.next_step?.hint,
        duplicate: r.duplicate?.status, receiptId: r.receipt?.receipt_id ?? null,
      };
    },
  });
}
