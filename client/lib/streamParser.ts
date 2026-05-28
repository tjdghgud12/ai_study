export interface StreamChunk {
  type: "text" | "urls" | "done" | "error";
  message: string;
  messageId: string;
}

interface ServerStreamPayload {
  type?: string;
  chat_reply?: string;
  message_id?: string;
  detail?: string;
}

function parseLineContent(content: string): StreamChunk {
  const trimmed = content.trim();
  if (trimmed === "[DONE]") return { type: "done", message: "", messageId: "" };

  try {
    const parsed = JSON.parse(content) as ServerStreamPayload;
    if (parsed.type === "delta") {
      return {
        type: "text",
        message: parsed.chat_reply ?? "",
        messageId: parsed.message_id ?? "",
      };
    }
    if (parsed.type === "done") {
      return { type: "done", message: parsed.chat_reply ?? "", messageId: parsed.message_id ?? "" };
    }
    if (parsed.type === "error") {
      return {
        type: "error",
        message: parsed.detail ?? "스트림 오류",
        messageId: parsed.message_id ?? "",
      };
    }
  } catch {
    // non-JSON line fallback
  }

  // Keep original content as-is to preserve whitespace/newlines.
  return { type: "text", message: content, messageId: "" };
}

export async function* parseStream(response: Response): AsyncGenerator<StreamChunk> {
  if (!response.body) throw new Error("스트림 없음");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        // NDJSON keepalive empty lines can be ignored, but do not trim content.
        if (line === "") continue;
        yield parseLineContent(line);
      }
    }

    if (buffer !== "") {
      yield parseLineContent(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}
