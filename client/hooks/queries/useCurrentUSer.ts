import { useQuery } from "@tanstack/react-query";

import { signInWithToken, SignInWithTokenResponse } from "@/app/api/signIn";
import { HttpError } from "@/lib/httpError";
import { useEffect } from "react";

const useCurrentUser = ({ onSuccess, onError }: { onSuccess?: (data: SignInWithTokenResponse) => void; onError?: (error: HttpError) => void }) => {
  const query = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => await signInWithToken(),
    retry: false,
  });

  useEffect(() => {
    if (!query.isFetched) return;
    if (query.isError || !query.data) onError?.(query.error as HttpError);
    else onSuccess?.(query.data);
  }, [query.isFetched, query.isError, query.data]);

  return query;
};

export default useCurrentUser;
