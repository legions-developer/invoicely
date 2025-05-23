import { useSession } from "@/lib/client-auth";

export const useUser = () => {
  const { data: session } = useSession();

  if (!session) {
    return;
  }

  return session.user;
};
