import { EditInvoicePageSchema } from "@/zod-schemas/invoice/edit-invoice-page";
import { ERROR_MESSAGES } from "@/constants/issues";
import EditInvoice from "./editInvoice";
import React from "react";

interface PageProps {
  params: Promise<{ type?: string; id?: string }>;
}

const Page = async ({ params }: PageProps) => {
  const awaitedParams = await params;

  //   safe parsing
  const parsedParams = EditInvoicePageSchema.safeParse({
    type: awaitedParams.type,
    id: awaitedParams.id,
  });

  if (!parsedParams.success) {
    throw new Error(ERROR_MESSAGES.INVALID_SEARCH_PARAMS);
  }

  const { type, id } = parsedParams.data;

  return <EditInvoice type={type} id={id} />;
};

export default Page;
