import { toNextJsHandler as BetterAuthNextJsHandler } from "better-auth/next-js";
import { serverAuth } from "@/lib/auth";

export const { POST, GET } = BetterAuthNextJsHandler(serverAuth);
