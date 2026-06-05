interface CheckDuplicateIdResponse {
  isDuplicate: boolean;
}

interface SignUpResponse {
  id: string;
}

const signUp = async (id: string, password: string): Promise<SignUpResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    });

    if (!response.ok) throw new Error(`회원가입에 실패하였습니다. ${response.statusText}`);

    return response.json();
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const checkId = async (id: string): Promise<CheckDuplicateIdResponse> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_CAT_AGENT_API}/api/sign-up/check-duplicate-id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) throw new Error(`ID 중복 확인에 실패하였습니다. ${response.statusText}`);

    return response.json() as Promise<CheckDuplicateIdResponse>;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { checkId, signUp };
