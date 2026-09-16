"use client";

import ChatInput from "@/app/chat/ChatInput";
import SpeechBubble from "@/app/chat/SpeechBubble";
import ApiStatusIcon from "@/app/signin/ApiStatusIcon";
import { Spinner } from "@/components/ui/spinner";
import useChatHistory from "@/hooks/useChatHistory";
import useSendChat from "@/hooks/useSendChat";
import { Fragment, useMemo, useState } from "react";

import type { ChatAttachment, ImageAttachment } from "@/types/chatType";

interface ChatItem {
  message: string;
  messageId: string;
  role: "user" | "ai";
  attachments?: ChatAttachment[] | null;
}

const isSameTurn = (left: ChatItem, right: ChatItem) => {
  if (left.role !== right.role) return false;
  return Boolean(left.messageId && right.messageId && left.messageId === right.messageId);
};

const hasPreviewAttachment = (attachments?: ChatAttachment[] | null) => attachments?.some((attachment) => "previewUrl" in attachment && attachment.previewUrl) ?? false;

const mergeOptimisticMessages = (history: ChatItem[], requestMessage: ChatItem | null, responseMessage: ChatItem | null, historyCountAtSend: number) => {
  const merged = [...history];

  for (const extra of [requestMessage, responseMessage]) {
    if (!extra) continue;

    let index = merged.findIndex((item) => isSameTurn(item, extra));
    if (index === -1 && extra.role === "user" && history.length > historyCountAtSend) {
      index = merged.findLastIndex((item) => item.role === "user");
    }
    if (index === -1) {
      merged.push(extra);
      continue;
    }

    merged[index] = {
      ...merged[index],
      message: extra.message || merged[index].message,
      messageId: merged[index].messageId || extra.messageId,
      attachments: hasPreviewAttachment(extra.attachments) ? extra.attachments : merged[index].attachments,
    };
  }

  return merged;
};

const ChatMessages = ({
  sessionId,
  setSessionId,
  isStreaming,
  setIsStreaming,
}: {
  sessionId: string;
  setSessionId: (sessionId: string) => void;
  isStreaming: boolean;
  setIsStreaming: (isStreaming: boolean) => void;
}) => {
  const [historyCountAtSend, setHistoryCountAtSend] = useState(0);

  const {
    data: chatHistory,
    isLoading: isChatHistoryLoading,
    isFetching: isChatHistoryFetching,
    isPlaceholderData: isChatHistoryPlaceholder,
    refetch: chatHistoryRefetch,
  } = useChatHistory({ sessionId, enabled: !isStreaming });
  const {
    mutate: sendMessage,
    isFirstChunk,
    isPending: isSendMessagePending,
    responseMessage,
    requestMessage,
    progressMessage,
  } = useSendChat({
    setSessionId,
    chatHistoryRefetch,
    onStreamComplete: () => setIsStreaming(false),
  });

  const onSubmit = (message: string, images?: ImageAttachment[]) => {
    setHistoryCountAtSend((chatHistory ?? []).length);
    setIsStreaming(true);
    sendMessage({ message, sessionId, images });
  };

  const messages = useMemo(
    () => mergeOptimisticMessages(chatHistory ?? [], requestMessage, responseMessage, historyCountAtSend),
    [chatHistory, responseMessage, requestMessage, historyCountAtSend],
  );

  const showHistorySpinner = !isSendMessagePending && !isStreaming && (isChatHistoryLoading || (isChatHistoryFetching && isChatHistoryPlaceholder));

  return (
    <div className="w-full min-w-sm h-full flex bg-gray-50 rounded-3xl p-4 relative">
      <ApiStatusIcon live={false} className="w-[60%] h-[60%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
      <div className="w-full h-full flex-1 flex flex-col gap-4 z-10 min-h-0">
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
          {showHistorySpinner ? (
            <Spinner className="w-10 h-10 m-auto" />
          ) : (
            messages.map((item, index) => (
              <Fragment key={`${item.role}-${item.messageId || index}`}>
                <SpeechBubble message={item.message} sender={item.role} />
                {item.attachments && item.attachments.length > 0 && <SpeechBubble message={null} sender={item.role} attachments={item.attachments} />}
              </Fragment>
            ))
          )}
          {isFirstChunk && <SpeechBubble key="check-first-chunk" message={null} progressMessage={progressMessage?.message} sender="ai" isLoading={true} />}
        </div>

        <ChatInput isPending={isSendMessagePending || isStreaming} onSubmit={onSubmit} />
      </div>
    </div>
  );
};

export default ChatMessages;
