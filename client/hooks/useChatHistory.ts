import { parseStream } from "@/lib/streamParser";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

interface ChatHistory {
  message: string;
  messageId: string;
  sender: "user" | "ai";
}

const useChatHistory = () => {
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isFirstChunk, setIsFirstChunk] = useState<boolean>(false);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId: "test" }),
      });

      if (!response.ok) throw new Error(`서버 오류: ${response.status}`);

      let firstChunkCheck = true;

      for await (const chunk of parseStream(response)) {
        if (chunk.type === "text") {
          setChatHistory((prev) => {
            if (firstChunkCheck) {
              setIsFirstChunk(false);
              firstChunkCheck = false;
            }

            if (prev.length === 0) return [{ message: chunk.message, sender: "ai" as const, messageId: chunk.messageId }];

            const next = [...prev];
            const lastIndex = next.findIndex((item) => item.messageId === chunk.messageId);
            if (lastIndex === -1) {
              next.push({ message: chunk.message, sender: "ai", messageId: chunk.messageId });
            } else {
              next[lastIndex] = {
                ...next[lastIndex],
                message: next[lastIndex].message + chunk.message,
              };
            }
            return next;
          });
        } else if (chunk.type === "done") {
          setChatHistory((prev) => {
            if (prev.length === 0) return [{ message: chunk.message, sender: "ai" as const, messageId: chunk.messageId }];

            const next = [...prev];
            const lastIndex = next.findIndex((item) => item.messageId === chunk.messageId);
            if (lastIndex === -1) {
              next.push({ message: chunk.message, sender: "ai", messageId: chunk.messageId });
              return next;
            }

            next[lastIndex] = {
              ...next[lastIndex],
              message: chunk.message,
            };
            return next;
          });
          break;
        } else if (chunk.type === "error") {
          throw new Error(chunk.message);
        }
      }
    },
  });

  const sendMessage = async (message: string) => {
    setIsFirstChunk(true);
    setChatHistory((prev) => [...prev, { message, sender: "user", messageId: "" }]);

    try {
      await chatMutation.mutateAsync(message);
    } catch (error) {
      console.error(error);
      setChatHistory((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const lastIndex = next.length - 1;
        const last = next[lastIndex];
        if (!last || last.sender !== "ai") return prev;
        next[lastIndex] = {
          ...last,
          message: "응답을 불러오지 못했습니다.",
        };
        return next;
      });
    }
  };

  return {
    ...chatMutation,
    isFirstChunk,
    chatHistory,
    sendMessage,
  };
};

export default useChatHistory;
