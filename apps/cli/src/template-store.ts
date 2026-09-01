type TemplateStore = typeof import("@invoicely/db/local-invoice-templates");

export async function withTemplateStore<Result>(operation: (store: TemplateStore) => Promise<Result>): Promise<Result> {
  const store = await import("@invoicely/db/local-invoice-templates");

  try {
    return await operation(store);
  } finally {
    const { sql } = await import("@invoicely/db");
    await sql.end();
  }
}
