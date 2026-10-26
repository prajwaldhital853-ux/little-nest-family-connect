import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { OAuthButtons } from "./oauth-buttons";
import { SignInForm } from "./sign-in-form";
import { ForgotPasswordForm } from "./forgot-password-form";

export function SignInCard() {
  const [mode, setMode] = useState<"sign-in" | "forgot">("sign-in");

  return (
    <div className="border border-border bg-card p-8 lg:p-10">
      <p className="text-center text-sm text-muted-foreground">
        Sign in to your dashboard
      </p>

      <div className="mt-8 space-y-6">
        <OAuthButtons />

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            or
          </span>
          <Separator className="flex-1" />
        </div>

        {mode === "sign-in" ? (
          <SignInForm onForgotPassword={() => setMode("forgot")} />
        ) : (
          <ForgotPasswordForm onBack={() => setMode("sign-in")} />
        )}
      </div>
    </div>
  );
}
