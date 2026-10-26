import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth/auth-provider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex min-h-screen flex-col gap-4 p-6"
        aria-hidden="true"
      >
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-full max-w-2xl rounded bg-muted" />
        <div className="h-4 w-full max-w-xl rounded bg-muted" />
        <div className="h-64 w-full rounded bg-muted" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
