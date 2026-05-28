"use client";

import { CatIcon } from "@/app/CatIcon";
import SpeechBubble from "@/app/chat/SpeechBubble";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useChatHistory from "@/hooks/useChatHistory";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Send } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  message: z.string().min(1),
});

const Chat = () => {
  const { chatHistory, isPending, isFirstChunk, sendMessage } = useChatHistory();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (isPending) return;
    form.reset();
    sendMessage(data.message);
  };

  return (
    <div className="w-full h-full justify-center items-center flex">
      <div className="w-2/5 min-w-sm h-full flex bg-gray-50 rounded-3xl p-4 relative">
        <CatIcon className="w-[60%] h-[60%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <div className="w-full h-full flex-1 flex flex-col gap-4 z-10 min-h-0">
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
            {chatHistory.map((item, index) => (
              <SpeechBubble key={item.sender === "ai" ? item.messageId : index} message={item.message} sender={item.sender} isLoading={isPending} />
            ))}
            {isFirstChunk && <SpeechBubble key="check-first-chunk" message={null} sender="ai" isLoading={true} />}
          </div>
          <form className="w-full flex gap-1" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="message"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <Input {...field} className="bg-white" placeholder="Type your message here..." />
                  </Field>
                )}
              />
            </FieldGroup>
            <Field className="w-fit" orientation="horizontal">
              <Button className="hover:cursor-pointer hover:scale-105 active:scale-100 transition-all duration-200" disabled={isPending}>
                <Send className="size-4" />
              </Button>
            </Field>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
