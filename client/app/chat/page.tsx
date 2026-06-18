"use client";

import ChatMessages from "@/app/chat/ChatMessages";
import ChatSessions from "@/app/chat/ChatSessions";
import { useState } from "react";

const Chat = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string>("new session");

  // const refetchSessions = () => {
  //   refetch().then((res) => {
  //     if (res.data && selectedSessionId === "new session") {
  //       const latestSession = res.data.reduce((latest, session) => {
  //         return new Date(session.createdAt) > new Date(latest.createdAt) ? session : latest;
  //       });
  //       setSelectedSessionId(latestSession?.sessionId ?? null);
  //     }
  //   });
  // };

  return (
    <div className="mx-auto flex h-full min-h-0 w-2/3 flex-1 flex-row items-center justify-center gap-2">
      <ChatSessions selectedSessionId={selectedSessionId} setSelectedSessionId={setSelectedSessionId} />
      <div className="h-full min-h-0 min-w-sm flex-1">
        <ChatMessages sessionId={selectedSessionId} refetchSessions={() => {}} />
      </div>
    </div>
  );
};

export default Chat;
