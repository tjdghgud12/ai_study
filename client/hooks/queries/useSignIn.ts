import type { SignInResponse } from "@/app/api/signIn";
import { signIn } from "@/app/api/signIn";
import { HttpError } from "@/lib/httpError";
import { useMutation } from "@tanstack/react-query";

const useSignIn = ({ onSuccess, onError }: { onSuccess?: (data: SignInResponse) => void; onError?: (error: HttpError) => void }) => {
  const mutation = useMutation({
    mutationFn: async ({ id, password }: { id: string; password: string }) => {
      return await signIn(id, password);
    },
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error as HttpError);
    },
  });

  return mutation;
};

export default useSignIn;
