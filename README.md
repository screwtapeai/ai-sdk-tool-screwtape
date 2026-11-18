# ai-sdk-tool-screwtape

[AI SDK](https://ai-sdk.dev) tool for [Screwtape.ai](https://screwtape.ai): check an invoice before your agent pays it.

```bash
npm install ai-sdk-tool-screwtape ai zod
export SCREWTAPE_API_KEY=...   # optional; 3 calls a day with no key, 10 with a free key: https://screwtape.ai/signup/
```

```ts
import { generateText, isStepCount } from "ai";
import { screwtapeSpendCheck } from "ai-sdk-tool-screwtape";

const { text } = await generateText({
  model: "openai/gpt-5-mini",
  system: "Before paying any invoice, call spendCheck. Pay only when pay is true.",
  prompt: `Pay this invoice: ${invoiceJson}. PO: ${purchaseOrder}`,
  tools: { spendCheck: screwtapeSpendCheck() },
  stopWhen: isStepCount(3),
});
```

The tool returns `{ pay, action, reason, duplicate, receiptId }`.
To check whether a seller is safe to pay before an agent pays, call `POST https://screwtape.ai/v1/payment-check` or connect to the MCP server at `https://screwtape.ai/mcp` (tool `payment_check`):

```bash
curl -s https://screwtape.ai/v1/payment-check -H 'content-type: application/json' -d '{"seller_url":"https://seller.example/pay","intended_amount":0.005,"agent_id":"agent-001"}'
```

The same MCP server also has `payment_guard_authorize` (applies your own spend rules before an agent pays: limits per payment, daily and period budgets, approved sellers; needs an API key), `trust_score` (for sellers: scores a paying agent before you accept it) and a free spend export at `GET https://screwtape.ai/v1/spend-books/export` (QuickBooks, Xero or JSON). See [what is new in Screwtape.ai 1.7](https://screwtape.ai/blog/screwtape-ai-1-7-payment-guard-spend-books-trust-score/).

Free: 3 calls per UTC day with no key, or 10 with a free key from https://screwtape.ai/signup/. Then $0.005 per call (pay-per-call). Sandbox Evaluation Pack: $100 for 2,000 checks. Enterprise pilot: support@screwtape.ai. MIT.
