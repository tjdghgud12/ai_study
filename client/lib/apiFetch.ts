import { HttpError } from "@/lib/httpError";

const apiFetch = async (input: RequestInfo, init?: RequestInit) => {
  const body = init?.body;
  const skipContentType = typeof FormData !== "undefined" && body instanceof FormData;

  const response = await fetch(input, {
    method: "GET",
    credentials: "include",
    ...init,
    headers: skipContentType ? init?.headers : { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : response.statusText;

    throw new HttpError(message, response.status);
  }

  return response;
};

export default apiFetch;
