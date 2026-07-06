import { isHttpError } from "@/lib/httpError";

let lastRedirectAt = 0;

const handleUnauthorized = (error: unknown, redirect: () => void) => {
  if (!isHttpError(error) || error.status !== 401) return;
  if (window.location.pathname.startsWith("/signin")) return;
  if (window.location.pathname.startsWith("/signup")) return;

  const now = Date.now();
  if (now - lastRedirectAt < 2000) return; // 2초 안 중복 방지

  lastRedirectAt = now;
  redirect();
};

export { handleUnauthorized };
