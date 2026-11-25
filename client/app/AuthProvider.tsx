"use client";

import useCurrentUser from "@/hooks/queries/useCurrentUSer";
import { handleUnauthorized } from "@/lib/handleUnauthorizedRedirect";
import { useUserInfo } from "@/store/useUserInfo";
import type { MutationCacheNotifyEvent, QueryCacheNotifyEvent } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUserInfo } = useUserInfo();
  const { isFetched } = useCurrentUser({ onSuccess: (data) => setUserInfo({ id: data.id }), onError: () => setUserInfo(null) });

  const redirectToSignIn = useCallback(() => {
    setUserInfo(null);
    router.replace("/signin");
  }, [router, setUserInfo]);

  // query / mutation 401 전역 처리
  useEffect(() => {
    const onQueryEvent = (event: QueryCacheNotifyEvent) => {
      if (event.type === "updated" && event.action.type === "error") {
        handleUnauthorized(event.query.state.error, redirectToSignIn);
      }
    };

    const onMutationEvent = (event: MutationCacheNotifyEvent) => {
      if (event.type === "updated" && event.action.type === "error") {
        handleUnauthorized(event.mutation.state.error, redirectToSignIn);
      }
    };

    const unsubQuery = queryClient.getQueryCache().subscribe(onQueryEvent);
    const unsubMutation = queryClient.getMutationCache().subscribe(onMutationEvent);

    return () => {
      unsubQuery();
      unsubMutation();
    };
  }, [queryClient, redirectToSignIn]);

  // (선택) 인증 확인 전 로딩
  if (!isFetched) return null; // 또는 <Spinner />

  return <>{children}</>;
}
