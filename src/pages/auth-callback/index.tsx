import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const ran = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const code = url.searchParams.get("code");

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(url.href);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          const stored = sessionStorage.getItem("auth:redirect");
          sessionStorage.removeItem("auth:redirect");
          navigate(stored ?? "/admin/messages", { replace: true });
        } else {
          navigate("/sign-in", { replace: true });
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Sign-in could not be completed.",
        );
      }
    })();
  }, [navigate]);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6">
      {error ? (
        <div className="max-w-sm text-center">
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate("/sign-in", { replace: true })}
            className="mt-4 text-sm underline underline-offset-4"
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Completing sign-in…
        </div>
      )}
    </main>
  );
}
