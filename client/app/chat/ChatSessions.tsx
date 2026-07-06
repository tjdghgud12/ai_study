import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useGetSessions } from "@/hooks/useSession";
import { isHttpError } from "@/lib/httpError";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ChatSessions = ({ selectedSessionId, setSelectedSessionId }: { selectedSessionId: string; setSelectedSessionId: (sessionId: string) => void }) => {
  const { data: sessions, isPending, refetch, error } = useGetSessions();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string>(selectedSessionId);

  if (selectedSessionId !== sessionId) {
    refetch().then(() => setSessionId(selectedSessionId));
  }

  const handleSelectSession = (sessionId: string) => {
    setSessionId(sessionId);
    setSelectedSessionId(sessionId);
  };

  useEffect(() => {
    if (isHttpError(error) && error.status === 401) router.push("/signin");
  }, [error, router]);

  return (
    <div className="flex h-full min-h-0 w-1/4 max-w-xs min-w-[200px] max-h-full flex-col items-start justify-start gap-2 overflow-y-auto rounded-3xl bg-gray-50 p-4">
      {isPending ? (
        <Spinner className="w-10 h-10 m-auto" />
      ) : (
        <>
          <Button
            key={`session-new-session`}
            className={cn(
              `w-full h-fit p-2 hover:cursor-pointer hover:scale-108 active:scale-100 transition-all duration-200 flex-none`,
              sessionId === "new session" ? "" : "bg-gray-100 text-black",
            )}
            onClick={() => handleSelectSession("new session")}
          >
            + Add new Chat
          </Button>
          {(sessions ?? []).map((session, index) => (
            <Button
              key={`session-${index}`}
              className={cn(
                `w-full h-fit p-2 hover:cursor-pointer hover:scale-108 active:scale-100 transition-all duration-200 flex-none`,
                sessionId === session.sessionId ? "" : "bg-gray-100 text-black",
              )}
              onClick={() => handleSelectSession(session.sessionId)}
            >
              {session.title}
            </Button>
          ))}
        </>
      )}
    </div>
  );
};

export default ChatSessions;
