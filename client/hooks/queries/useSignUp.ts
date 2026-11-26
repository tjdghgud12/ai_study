import { signUp, SignUpResponse } from "@/app/api/signUp";
import { HttpError } from "@/lib/httpError";
import { useMutation } from "@tanstack/react-query";

const useSignUp = ({ onSuccess, onError }: { onSuccess?: (data: SignUpResponse) => void; onError?: (error: HttpError) => void }) => {
  const mutation = useMutation({
    mutationFn: signUp,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error) => {
      onError?.(error as HttpError);
    },
  });

  return mutation;
};

export default useSignUp;
