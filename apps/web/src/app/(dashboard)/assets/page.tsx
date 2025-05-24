import { serverAuth } from "@/lib/auth";
import { headers } from "next/headers";
import AssetsPage from "./assets";
import React from "react";

const Page = async () => {
  const session = await serverAuth.api.getSession({
    headers: await headers(),
  });
  return <AssetsPage user={session?.user} />;
};

export default Page;
