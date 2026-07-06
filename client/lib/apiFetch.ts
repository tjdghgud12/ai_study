import { HttpError } from "@/lib/httpError";

const apiFetch = async (input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : response.statusText;

    throw new HttpError(message, response.status);
  }

  return response;
};

export default apiFetch;
