import { moveInvoiceToServer } from "./move-invoice-to-server.ts";
import assert from "node:assert/strict";
import test from "node:test";

function createInvoice(companyDetails = {}) {
  return {
    invoiceId: "local-invoice",
    status: "success",
    paidAt: new Date("2026-09-28T10:00:00Z"),
    invoiceFields: {
      companyDetails: { name: "Example Company", address: "Company address", metadata: [], ...companyDetails },
      clientDetails: { name: "Example Client", address: "Client address", metadata: [] },
      invoiceDetails: {
        currency: "USD",
        prefix: "INV-",
        serialNumber: "123",
        date: new Date("2026-09-25T10:00:00Z"),
        dueDate: new Date("2026-10-25T10:00:00Z"),
        paymentTerms: "Due in 30 days",
        billingDetails: [{ label: "Tax", type: "percentage", value: 5 }],
        theme: { baseColor: "#635CFF", mode: "light", template: "default" },
      },
      items: [{ name: "Design", description: "Invoice design", quantity: 1, unitPrice: 200 }],
      metadata: { notes: "Thank you", terms: "Net 30", paymentInformation: [{ label: "Account", value: "1234" }] },
    },
  };
}

test("waits for server confirmation before deleting only the selected local invoice", async () => {
  const input = createInvoice();
  const original = structuredClone(input);
  const calls = [];
  let confirmSave;
  const saveResult = new Promise((resolve) => {
    confirmSave = resolve;
  });

  const moving = moveInvoiceToServer(input, {
    saveInvoice: async (payload) => {
      calls.push("save");
      assert.deepEqual(payload, {
        invoiceFields: {
          ...input.invoiceFields,
          companyDetails: { ...input.invoiceFields.companyDetails, logo: undefined, signature: undefined },
        },
        status: input.status,
        paidAt: input.paidAt,
      });
      return saveResult;
    },
    deleteLocalInvoice: async (id) => {
      calls.push(`delete:${id}`);
    },
  });

  assert.deepEqual(calls, ["save"]);
  confirmSave({ success: true, message: "Saved", invoiceId: "server-invoice" });
  assert.deepEqual(await moving, { invoiceId: "server-invoice", localCopyRemoved: true });
  assert.deepEqual(calls, ["save", "delete:local-invoice"]);
  assert.deepEqual(input, original);
});

for (const [name, saveInvoice, expectedError] of [
  ["server rejects the save", async () => Promise.reject(new Error("Offline")), /Offline/],
  ["server reports failure", async () => ({ success: false, message: "Saving disabled" }), /Saving disabled/],
  ["server returns no invoice ID", async () => ({ success: true, message: "Saved" }), /did not confirm/],
]) {
  test(`keeps the local invoice when ${name}`, async () => {
    let deleted = false;
    await assert.rejects(
      moveInvoiceToServer(createInvoice(), {
        saveInvoice,
        deleteLocalInvoice: async () => {
          deleted = true;
        },
      }),
      expectedError,
    );
    assert.equal(deleted, false);
  });
}

test("reports an incomplete move if local cleanup fails after saving", async () => {
  const result = await moveInvoiceToServer(createInvoice(), {
    saveInvoice: async () => ({ success: true, message: "Saved", invoiceId: "server-invoice" }),
    deleteLocalInvoice: async () => {
      throw new Error("IndexedDB unavailable");
    },
  });
  assert.deepEqual(result, { invoiceId: "server-invoice", localCopyRemoved: false });
});

test("preserves local images using their durable data URLs without mutating the local invoice", async () => {
  const logo = "data:image/png;base64,bG9nbw==";
  const signature = "data:image/png;base64,c2lnbmF0dXJl";
  const input = createInvoice({ logo: "blob:expired-local-logo", logoBase64: logo, signatureBase64: signature });
  const original = structuredClone(input);

  await moveInvoiceToServer(input, {
    saveInvoice: async ({ invoiceFields }) => {
      assert.equal(invoiceFields.companyDetails.logo, logo);
      assert.equal(invoiceFields.companyDetails.signature, signature);
      return { success: true, message: "Saved", invoiceId: "server-invoice" };
    },
    deleteLocalInvoice: async () => {},
  });

  assert.deepEqual(input, original);
});

for (const value of ["https://example.com/logo.png", "http://example.com/logo.png", "data:image/png;base64,bG9nbw=="]) {
  test(`preserves the selected portable image ${value}`, async () => {
    await moveInvoiceToServer(
      createInvoice({ logo: value, signature: value, logoBase64: "data:image/png;base64,b2xk" }),
      {
        saveInvoice: async ({ invoiceFields }) => {
          assert.equal(invoiceFields.companyDetails.logo, value);
          assert.equal(invoiceFields.companyDetails.signature, value);
          return { success: true, message: "Saved", invoiceId: "server-invoice" };
        },
        deleteLocalInvoice: async () => {},
      },
    );
  });
}

for (const name of ["logo", "signature"]) {
  test(`keeps the local invoice when its ${name} cannot be transferred`, async () => {
    const calls = [];
    await assert.rejects(
      moveInvoiceToServer(createInvoice({ [name]: "blob:unavailable-image" }), {
        saveInvoice: async () => {
          calls.push("save");
          return { success: true, message: "Saved", invoiceId: "server-invoice" };
        },
        deleteLocalInvoice: async () => {
          calls.push("delete");
        },
      }),
      new RegExp(`invoice ${name} is unavailable`),
    );
    assert.deepEqual(calls, []);
  });
}
