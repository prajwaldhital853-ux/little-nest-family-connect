import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { AppleIcon, GoogleIcon } from "./provider-icons";

interface LocationState {
  from?: { pathname?: string };
}

export function OAuthButtons() {
  const navigate = useNavigate();
  const location = useLocation();
  const [pending, setPending] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    setPending(provider);
    const from = (location.state as LocationState)?.from?.pathname;
    if (from) {
      sessionStorage.setItem("auth:redirect", from);
    } else {
      sessionStorage.removeItem("auth:redirect");
    }
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/auth/callback`,
    });
    if (result.error) {
      setError(
        `Couldn't sign in with ${provider === "google" ? "Google" : "Apple"}. Try again.`,
      );
      setPending(null);
      return;
    }
    if (result.redirected) {
      return;
    }
    navigate("/auth/callback", { replace: true });
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => handleOAuth("google")}
        disabled={pending !== null}
        className="w-full justify-center gap-2 rounded-none border-black/15 bg-white text-neutral-900 hover:bg-white/85"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={() => handleOAuth("apple")}
        disabled={pending !== null}
        className="w-full justify-center gap-2 rounded-none border-black/15 bg-white text-neutral-900 hover:bg-white/85"
      >
        <AppleIcon />
        Continue with Apple
      </Button>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
