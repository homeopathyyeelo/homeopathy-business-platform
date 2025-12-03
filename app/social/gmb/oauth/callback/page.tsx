"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GMBCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      router.push(`/social/gmb?error=${encodeURIComponent(error)}`);
      return;
    }

    if (code && state) {
      // Redirect to backend to handle the OAuth code exchange
      // The backend will verify the state and exchange the code for tokens
      // then redirect back to the frontend
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005";
      window.location.href = `${backendUrl}/api/social/gmb/oauth/callback?code=${code}&state=${state}`;
    } else {
        // If no code/state, just go back
        router.push("/social/gmb");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Connecting to Google...</h2>
        <p className="text-muted-foreground">Please wait while we complete the authentication.</p>
      </div>
    </div>
  );
}
