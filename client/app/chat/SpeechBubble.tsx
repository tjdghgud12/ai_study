import AttachmentImage from "@/components/AttachmentImage";
import { Spinner } from "@/components/ui/spinner";
import type { ChatAttachment } from "@/types/chatType";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const getAttachmentSrc = (attachment: ChatAttachment): string | null => {
  if ("previewUrl" in attachment && attachment.previewUrl) return attachment.previewUrl;
  if ("url" in attachment && attachment.url) return `${process.env.NEXT_PUBLIC_CAT_AGENT_API}${attachment.url}`;
  return null;
};

const SpeechBubble = ({
  message,
  progressMessage,
  sender,
  isLoading,
  attachments,
}: {
  message: string | null;
  progressMessage?: string | null;
  sender: string;
  isLoading?: boolean;
  attachments?: ChatAttachment[] | null;
}) => {
  const shouldShowSpinner = sender === "ai" && isLoading;
  const normalizedMessage = (message ?? "").replace(/\\n/g, "\n");

  return (
    <div className={`w-fit h-fit flex p-3 rounded-2xl max-w-[80%] ${sender === "user" ? "bg-white text-black ml-auto" : "bg-black text-white mr-auto"}`}>
      {sender === "ai" ? (
        <div className="prose prose-sm prose-invert max-w-none break-all [&_p]:my-0 [&_p+p]:mt-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
            components={{
              p: ({ children }) => <p className="my-0 leading-7">{children}</p>,
              ul: ({ children }) => <ul className="my-3 list-disc pl-5">{children}</ul>,
              ol: ({ children }) => <ol className="my-3 list-decimal pl-5">{children}</ol>,
              li: ({ children }) => <li className="my-1 [&>p]:my-0">{children}</li>,
            }}
          >
            {normalizedMessage}
          </ReactMarkdown>
        </div>
      ) : message ? (
        <p className="w-fit h-fit whitespace-pre-wrap break-all">{message}</p>
      ) : (
        <></>
      )}
      {shouldShowSpinner && (
        <div className="flex flex-col">
          <Spinner />
          {progressMessage && <p className="text-gray-300 text-sm mt-1">{progressMessage}</p>}
        </div>
      )}
      {attachments && attachments.length > 0 && (
        <div className="w-full min-w-0 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {attachments?.map((attachment, index) => {
              const src = getAttachmentSrc(attachment);
              if (!src) return null;

              return <AttachmentImage key={index} src={src} alt="" width={800} height={800} className="size-125 object-cover rounded-4xl" />;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechBubble;
