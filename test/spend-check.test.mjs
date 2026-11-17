import { test } from "node:test";
import assert from "node:assert/strict";
import { screwtapeSpendCheck } from "../dist/index.js";

test("sends a request without an API key and returns pay=true on pass", async () => {
  const calls = [];
  const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(
      JSON.stringify({ next_step: { action: "pass" }, receipt: { receipt_id: "r1" } }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };
  try {
    const tool = screwtapeSpendCheck({ apiUrl: "https://screwtape.ai" });
    const result = await tool.execute(
      {
        invoice: {
          invoice_id: "inv-1",
          vendor: "Acme",
          currency: "USD",
          items: [{ amount: 1 }],
          tax: 0,
          total: 1,
        },
        evidence: ["PO-1"],
      },
      { toolCallId: "t1", messages: [] },
    );
    assert.equal(result.pay, true);
    assert.equal(result.receiptId, "r1");
    assert.equal(calls[0].url, "https://screwtape.ai/v1/duplicate");
    assert.equal(calls[0].init.headers.Authorization, undefined);
  } finally {
    globalThis.fetch = original;
  }
});
