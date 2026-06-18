import { useQuery } from "@tanstack/react-query";

interface ChatHistory {
  message: string;
  messageId: string;
  role: "user" | "ai";
}

const useChatHistory = ({ sessionId, enabled }: { sessionId: string; enabled?: boolean }) => {
  const chatHistoryQuery = useQuery({
    queryKey: ["chatHistory", sessionId],
    queryFn: async () => {
      if (sessionId === "new session") return [];
      const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/chat/messages?session_id=${sessionId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      return response.json() as Promise<ChatHistory[]>;
    },
    enabled: enabled ?? true,
  });

  return chatHistoryQuery;
};

export default useChatHistory;
