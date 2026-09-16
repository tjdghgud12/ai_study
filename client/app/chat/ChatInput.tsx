"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Plus, Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import type { ImageAttachment } from "@/types/chatType";

const MAX_IMAGES = 10;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024;

const ChatInput = ({ isPending, onSubmit }: { isPending: boolean; onSubmit: (message: string, images?: ImageAttachment[]) => void }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef<ImageAttachment[]>([]);

  const [message, setMessage] = useState("");
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [textareaExtendFlag, setTextareaExtendFlag] = useState(false);

  const addImageFiles = (files: ArrayLike<File | null>) => {
    const incoming = Array.from(files).filter((file): file is File => file !== null && file.type.startsWith("image/"));
    if (incoming.length === 0) return;

    if (incoming.some((file) => file.size > MAX_FILE_BYTES)) {
      toast.error("이미지는 장당 5MB 이하여야 합니다.");
      return;
    }

    if (images.length + incoming.length > MAX_IMAGES) {
      toast.error("최대 10개의 이미지만 첨부할 수 있습니다.");
      return;
    }

    const currentTotalBytes = images.reduce((sum, img) => sum + img.file.size, 0);
    const incomingTotalBytes = incoming.reduce((sum, file) => sum + file.size, 0);
    if (currentTotalBytes + incomingTotalBytes > MAX_TOTAL_BYTES) {
      toast.error("이미지 용량은 최대 20MB까지 첨부할 수 있습니다.");
      return;
    }

    setImages((prev) => [
      ...prev,
      ...incoming.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addImageFiles(e.target.files ?? []);
    e.target.value = "";
  };

  const handleOnPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFiles = Array.from(e.clipboardData.items)
      .filter((item) => item.type.startsWith("image/"))
      .map((item) => item.getAsFile());

    if (imageFiles.length === 0) return;

    e.preventDefault();
    addImageFiles(imageFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    addImageFiles(e.dataTransfer.files);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value === "" && textareaExtendFlag) setTextareaExtendFlag(false);
    setMessage(e.target.value);
  };

  const handleSubmit = () => {
    if (isPending) return;
    if (message.trim() === "" && images.length === 0) {
      toast.error("메세지를 입력해주세요.");
      return;
    }

    onSubmit(message, images);
    setMessage("");
    if (textareaExtendFlag) setTextareaExtendFlag(false);
    setImages([]);
  };

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height == null) return;

      const redundancyHeight = 15;
      setTextareaExtendFlag((prev) => {
        if (height > 24 + redundancyHeight && !prev) return true;
        return prev;
      });
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn("w-full bg-white rounded-4xl border-gray-200 border overflow-hidden p-1")}>
      <AnimatePresence initial={false}>
        {images.length > 0 && (
          <motion.div
            key="image-tray"
            initial={false}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ type: "tween", duration: 0.15, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="flex max-h-52 overflow-y-auto gap-2 flex-wrap p-1">
              {images.map((img, i) => (
                <div key={img.previewUrl} className="relative shrink-0 border border-gray-200 rounded-4xl">
                  <Image src={img.previewUrl} alt="" width={100} height={100} unoptimized className="w-25 h-25 object-cover rounded-4xl" />
                  <Button
                    className="w-fit h-fit absolute top-1.5 right-1.5 bg-background border rounded-full p-0.5 transition-all duration-200 hover:bg-gray-100 hover:cursor-pointer hover:scale-105 active:scale-100"
                    variant="ghost"
                    onClick={() => {
                      setImages((prev) => prev.filter((_, idx) => idx !== i));
                      URL.revokeObjectURL(img.previewUrl);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className={cn("w-full grid grid-cols-[auto_1fr_auto] relative p-1", textareaExtendFlag ? "grid-rows-[auto_auto]" : "grid-rows-1")}
        transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
      >
        <motion.div
          layout="position"
          className={cn("h-fit col-start-1", textareaExtendFlag ? "row-start-2" : "row-start-1")}
          transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
        >
          <Input ref={fileInputRef} className="hidden" type="file" accept="image/*" multiple onChange={handleFileChange} />
          <Button asChild className="w-10 h-10 shrink-0 rounded-full p-0 my-auto" variant="ghost" disabled={isPending} onClick={() => fileInputRef.current?.click()}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 1 }}
              transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
              className="hover:cursor-pointer hover:bg-gray-100"
            >
              <Plus className="size-5" />
            </motion.button>
          </Button>
        </motion.div>

        <motion.div
          layout="position"
          className={cn("w-full min-w-0", textareaExtendFlag ? "col-span-3 row-start-1" : "col-start-2 row-start-1")}
          transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
        >
          <Textarea
            ref={textareaRef}
            className={cn(
              "w-full min-w-0 min-h-10 max-h-40 resize-none overflow-y-auto bg-transparent border-none shadow-none mx-auto focus-visible:border-none focus-visible:ring-0",
            )}
            placeholder="Type your message here..."
            value={message}
            onChange={handleMessageChange}
            onPaste={handleOnPaste}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </motion.div>
        <motion.div
          layout="position"
          className={cn("h-fit col-start-3", textareaExtendFlag ? "row-start-2" : "row-start-1")}
          transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
        >
          <Button asChild className="w-10 h-10 shrink-0 rounded-full p-0 my-auto" variant="ghost" disabled={isPending} onClick={handleSubmit}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 1 }}
              transition={{ type: "tween", duration: 0.15, ease: "easeInOut" }}
              className="hover:cursor-pointer hover:bg-gray-100"
            >
              <Send className="size-5" />
            </motion.button>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ChatInput;
