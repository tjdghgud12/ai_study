"use client";

import ChatInput from "@/app/chat/ChatInput";
import SpeechBubble from "@/app/chat/SpeechBubble";
import ApiStatusIcon from "@/app/signin/ApiStatusIcon";
import { Spinner } from "@/components/ui/spinner";
import useChatHistory from "@/hooks/useChatHistory";
import useSendChat from "@/hooks/useSendChat";
import { useMemo, useState } from "react";

const ChatMessages = ({ sessionId, refetchSessions }: { sessionId: string; refetchSessions: () => void }) => {
  const [prevSessionId, setPrevSessionId] = useState<string>(sessionId);
  const [enabled, setEnabled] = useState<boolean>(sessionId !== "new session");

  const { data: chatHistory, isLoading, refetch } = useChatHistory({ sessionId });
  const {
    mutate: sendMessage,
    isFirstChunk,
    responseMessage,
    requestMessage,
  } = useSendChat({
    setSession: refetchSessions,
    chatHistoryRefetch: refetch,
  });

  if (prevSessionId !== sessionId) {
    setEnabled(prevSessionId !== "new session");
    setPrevSessionId(sessionId);
  }

  const onSubmit = (message: string) => {
    sendMessage({ message, sessionId });
  };

  const history = useMemo(() => {
    return [...(chatHistory ?? []), requestMessage, responseMessage].filter((item) => item !== null);
  }, [chatHistory, responseMessage, requestMessage]);

  return (
    <div className="w-full min-w-sm h-full flex bg-gray-50 rounded-3xl p-4 relative">
      <ApiStatusIcon live={false} className="w-[60%] h-[60%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
      <div className="w-full h-full flex-1 flex flex-col gap-4 z-10 min-h-0">
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {isLoading ? (
            <Spinner className="w-10 h-10 m-auto" />
          ) : (
            history.map((item, index) => <SpeechBubble key={item.role === "ai" ? item.messageId : index} message={item.message} sender={item.role} isLoading={isLoading} />)
          )}
          {isFirstChunk && <SpeechBubble key="check-first-chunk" message={null} sender="ai" isLoading={true} />}
        </div>

        <ChatInput isPending={isLoading} onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default ChatMessages;
