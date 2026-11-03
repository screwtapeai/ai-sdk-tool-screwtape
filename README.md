# ai-sdk-tool-screwtape

[AI SDK](https://ai-sdk.dev) tool for [Screwtape.ai](https://screwtape.ai): check an invoice before your agent pays it.

```bash
npm install ai-sdk-tool-screwtape ai zod
export SCREWTAPE_API_KEY=...   # free key (10 calls a day): https://screwtape.ai/signup/
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
Free: 10 calls a day. Sandbox Evaluation Pack: $100 for 2,000 checks. Enterprise pilot: support@screwtape.ai. MIT.
