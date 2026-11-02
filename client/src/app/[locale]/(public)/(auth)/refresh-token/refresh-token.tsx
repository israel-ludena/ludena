"use client";

import { useRouter } from "@/i18n/navigation";
import { checkAndRefreshToken, getRefreshTokenFromLocalStorage } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function RefreshToken() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPathname = searchParams.get("redirect");
  useEffect(() => {
    const currentRefreshToken = getRefreshTokenFromLocalStorage();

    // If no refresh token in localStorage or URL, redirect to home
    if (!currentRefreshToken) {
      router.push("/");
      return;
    }

    try {
      checkAndRefreshToken({
        onSuccess: () => {
          router.push(redirectPathname || "/");
        },
        onError: () => {
          router.push("/");
        },
      });
    } catch (error) {
      console.error("Error decoding refresh token:", error);
      router.push("/");
    }
  }, [router, redirectPathname]);
  return <div>Refresh token....</div>;
}
