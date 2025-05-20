import { useSession } from "@/lib/client-auth";
import type { AuthUser } from "@/types/auth";

export const useUser = () => {
  const { data: session } = useSession();

  if (!session) {
    return;
  }

  return session.user as AuthUser;
};
