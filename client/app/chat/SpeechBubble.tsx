import { Spinner } from "@/components/ui/spinner";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const SpeechBubble = ({ message, sender, isLoading }: { message: string | null; sender: string; isLoading?: boolean }) => {
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
      ) : (
        <p className="w-fit h-fit whitespace-pre-wrap break-all">{message}</p>
      )}
      {shouldShowSpinner && <Spinner />}
    </div>
  );
};

export default SpeechBubble;
