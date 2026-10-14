import apiFetch from "@/lib/apiFetch";
import { HttpError } from "@/lib/httpError";
import { parseStream } from "@/lib/streamParser";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import type { ChatAttachment, ImageAttachment } from "@/types/chatType";

interface Message {
  message: string;
  messageId: string;
  role: "user" | "ai";
  attachments?: ChatAttachment[] | null;
}

const useSendChat = ({
  setSessionId,
  chatHistoryRefetch,
  onStreamComplete,
}: {
  setSessionId: (sessionId: string) => void;
  chatHistoryRefetch?: () => Promise<unknown>;
  onStreamComplete?: () => void;
}) => {
  const [responseMessage, setResponseMessage] = useState<Message | null>(null);
  const [requestMessage, setRequestMessage] = useState<Message | null>(null);
  const [isFirstChunk, setIsFirstChunk] = useState<boolean>(false);
  const [progressMessage, setProgressMessage] = useState<Message | null>(null);
  const chatMutation = useMutation({
    mutationFn: async ({ message, sessionId, images }: { message: string; sessionId: string | null; images?: ImageAttachment[] }) => {
      setIsFirstChunk(true);
      setResponseMessage(null);
      setRequestMessage({ message, role: "user" as const, messageId: crypto.randomUUID(), attachments: images });

      const body = new FormData();
      body.append("message", message);
      if (sessionId && sessionId !== "new session") body.append("sessionId", sessionId);
      if (images) images.forEach((img) => body.append("images", img.file));

      const response = await apiFetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/chat/stream`, {
        method: "POST",
        body: body,
      });

      let firstChunkCheck = true;

      for await (const chunk of parseStream(response)) {
        if (chunk.type === "newSession") {
          setSessionId(chunk.sessionId ?? "");
        } else if (chunk.type === "progress") {
          setProgressMessage((prev) => {
            if (!prev) return { message: chunk.message, role: "ai" as const, messageId: chunk.messageId };
            return { ...prev, message: chunk.message };
          });
        } else if (chunk.type === "text") {
          if (firstChunkCheck) {
            setProgressMessage(null);
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
          setProgressMessage(null);
          throw new Error(chunk.message);
        }
      }
    },
    onSuccess: async () => {
      onStreamComplete?.();
      if (chatHistoryRefetch) await chatHistoryRefetch();

      setResponseMessage(null);
      setRequestMessage(null);
      setIsFirstChunk(false);
      setProgressMessage(null);
    },
    onError: (error: HttpError) => {
      onStreamComplete?.();
      if (chatHistoryRefetch) {
        toast.error("응답을 불러오지 못했습니다.", {
          description: `status: ${error.status ?? "unknown"}\nmessage: ${error.message}`,
          classNames: { description: "whitespace-pre-line" },
        });
        chatHistoryRefetch().then(() => {
          setResponseMessage(null);
          setIsFirstChunk(false);
          setRequestMessage(null);
          setProgressMessage(null);
        });
      } else {
        setResponseMessage((prev) => {
          if (!prev) return { message: "응답을 불러오지 못했습니다.", role: "ai" as const, messageId: "" };
          return { ...prev, message: "응답을 불러오지 못했습니다." };
        });
        setIsFirstChunk(false);
        setRequestMessage(null);
        setProgressMessage(null);
      }
    },
  });

  return {
    ...chatMutation,
    isFirstChunk,
    responseMessage,
    requestMessage,
    progressMessage,
  };
};

export default useSendChat;
