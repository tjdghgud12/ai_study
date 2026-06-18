import { useUserInfo } from "@/store/useUserInfo";
import { ISession } from "@/types/sessionType";
import { useQuery } from "@tanstack/react-query";

const useGetSessions = () => {
  const { userInfo } = useUserInfo();

  const sessionQuery = useQuery({
    queryKey: ["sessions", userInfo?.id],
    queryFn: async () => {
      if (!userInfo?.id) return [];
      const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/chat/sessions`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      return response.json() as Promise<ISession[]>;
    },
    enabled: !!userInfo?.id,
  });

  return sessionQuery;
};

export { useGetSessions };
