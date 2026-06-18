"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ChatInput = ({ isPending, onSubmit }: { isPending: boolean; onSubmit: (message: string) => void }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (isPending) return;
    if (message.trim() === "") {
      toast.error("메세지를 입력해주세요.");
      return;
    }
    onSubmit(message);
    setMessage("");
  };

  return (
    <div className="w-full h-10 flex gap-1">
      <Textarea
        className="h-full bg-white resize-none overflow-y-none"
        placeholder="Type your message here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
      />
      <Button className="w-12 h-full hover:cursor-pointer hover:scale-105 active:scale-100 transition-all duration-200" disabled={isPending} onClick={handleSubmit}>
        <Send className="size-5" />
      </Button>
    </div>
  );
};

export default ChatInput;
