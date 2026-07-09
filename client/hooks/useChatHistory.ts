import apiFetch from "@/lib/apiFetch";
import { HttpError } from "@/lib/httpError";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

interface ChatHistory {
  message: string;
  messageId: string;
  role: "user" | "ai";
}

const useChatHistory = ({ sessionId, enabled }: { sessionId: string; enabled?: boolean }) => {
  const chatHistoryQuery = useQuery<ChatHistory[], HttpError>({
    queryKey: ["chatHistory", sessionId],
    queryFn: async () => {
      if (sessionId === "new session") return [];
      const response = await apiFetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/chat/messages?session_id=${sessionId}`);
      return response.json() as Promise<ChatHistory[]>;
    },
    enabled: enabled ?? true,
    placeholderData: keepPreviousData,
  });

  return chatHistoryQuery;
};

export default useChatHistory;
