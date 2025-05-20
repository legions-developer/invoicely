import { clientAuth } from "@/lib/client-auth";

// Session Type
export type SessionDataProps = typeof clientAuth.$Infer.Session;

// User Type
export type AuthUser = SessionDataProps["user"];
export type AuthSession = SessionDataProps["session"];
