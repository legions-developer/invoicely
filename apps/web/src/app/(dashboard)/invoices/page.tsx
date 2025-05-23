import { serverAuth } from "@/lib/auth";
import { headers } from "next/headers";
import InvoicesPage from "./invoices";
import React from "react";

const Page = async () => {
  const session = await serverAuth.api.getSession({
    headers: await headers(),
  });

  return <InvoicesPage user={session?.user} />;
};

export default Page;
