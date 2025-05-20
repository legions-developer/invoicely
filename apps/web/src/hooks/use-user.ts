import { useSession } from "@/lib/client-auth";
import type { AuthUser } from "@/types/auth";

export const useUser = () => {
  const { data: session } = useSession();
  return session?.user as AuthUser | undefined;
};
