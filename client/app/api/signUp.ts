interface CheckDuplicateIdResponse {
  isDuplicate: boolean;
}

interface SignUpResponse {
  id: string;
}

const signUp = async (id: string, password: string): Promise<SignUpResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/sign-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, password }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : response.statusText;
    throw new Error(message as string);
  }

  return response.json();
};

const checkId = async (id: string): Promise<CheckDuplicateIdResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/sign-up/check-duplicate-id`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = typeof body?.detail === "string" ? body.detail : response.statusText;
    throw new Error(message as string);
  }

  return response.json() as Promise<CheckDuplicateIdResponse>;
};

export { checkId, signUp };
