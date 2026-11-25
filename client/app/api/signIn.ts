import { HttpError } from "@/lib/httpError";

interface SignInResponse {
  id: string;
  token: string;
}

interface SignInWithTokenResponse {
  id: string;
}

const signIn = async (id: string, password: string): Promise<SignInResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/sign-in`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : response.statusText;
    throw new HttpError(message, response.status);
  }

  return response.json();
};

const signInWithToken = async (): Promise<SignInWithTokenResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/sign-in/with-token`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : response.statusText;
    throw new HttpError(message, response.status);
  }

  return response.json();
};

const signOut = async (): Promise<boolean> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/sign-out`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : response.statusText;
    throw new HttpError(message, response.status);
  }

  return response.ok;
};

export { signIn, signInWithToken, signOut, type SignInResponse, type SignInWithTokenResponse };
