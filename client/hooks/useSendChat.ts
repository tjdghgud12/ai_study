import { parseStream } from "@/lib/streamParser";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface IMessage {
  message: string;
  messageId: string;
  role: "user" | "ai";
}

const useSendChat = ({ setSession, chatHistoryRefetch }: { setSession: () => void; chatHistoryRefetch?: () => Promise<unknown> }) => {
  const [responseMessage, setResponseMessage] = useState<IMessage | null>(null);
  const [requestMessage, setRequestMessage] = useState<IMessage | null>(null);
  const [isFirstChunk, setIsFirstChunk] = useState<boolean>(false);

  const chatMutation = useMutation({
    mutationFn: async ({ message, sessionId }: { message: string; sessionId: string | null }) => {
      setIsFirstChunk(true);
      setResponseMessage(null);
      setRequestMessage({ message, role: "user" as const, messageId: "" });
      const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: message, sessionId: sessionId === "new session" ? null : sessionId }),
      });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      let firstChunkCheck = true;

      for await (const chunk of parseStream(response)) {
        if (chunk.type === "newSession") {
          setSession();
        } else if (chunk.type === "text") {
          if (firstChunkCheck) {
            setIsFirstChunk(false);
            firstChunkCheck = false;
          }
          setResponseMessage((prev) => {
            if (!prev) return { message: chunk.message as string, role: "ai" as const, messageId: chunk.messageId };
            return { ...prev, message: prev.message + chunk.message };
          });
        } else if (chunk.type === "done") {
          setResponseMessage({ message: chunk.message, role: "ai" as const, messageId: chunk.messageId });
          break;
        } else if (chunk.type === "error") {
          setIsFirstChunk(false);

          throw new Error(chunk.message);
        }
      }
    },
    onSuccess: () => {
      if (chatHistoryRefetch)
        chatHistoryRefetch().then(() => {
          setResponseMessage(null);
          setRequestMessage(null);
        });
    },
    onError: () => {
      setResponseMessage((prev) => {
        if (!prev) return { message: "응답을 불러오지 못했습니다.", role: "ai" as const, messageId: "" };
        return { ...prev, message: "응답을 불러오지 못했습니다." };
      });
      setRequestMessage(null);
    },
  });

  return {
    ...chatMutation,
    isFirstChunk,
    responseMessage,
    requestMessage,
  };
};

export default useSendChat;
