import apiFetch from "@/lib/apiFetch";
import { HttpError } from "@/lib/httpError";
import { useUserInfo } from "@/store/useUserInfo";
import { ISession } from "@/types/sessionType";
import { useQuery } from "@tanstack/react-query";

const useGetSessions = () => {
  const { userInfo } = useUserInfo();

  const sessionQuery = useQuery<ISession[], HttpError>({
    queryKey: ["sessions", userInfo?.id],
    queryFn: async () => {
      if (!userInfo?.id) return [];
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/chat/sessions`);
      return response.json() as Promise<ISession[]>;
    },
    enabled: !!userInfo?.id,
  });

  return sessionQuery;
};

export { useGetSessions };
