import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/auth-provider";
import { FilterProvider } from "@/lib/filter-context";
import {
  SupabaseDataProvider,
} from "@/lib/data-provider";
import { ProtectedRoute } from "@/components/protected-route";
import { ScrollToTop } from "@/components/scroll-to-top";
import AdminLayout from "./layouts/admin-layout";
import NotFound from "./pages/not-found";
import SignIn from "./pages/sign-in";
import AuthCallback from "./pages/auth-callback";
import AdminMessages from "./pages/admin-messages";
import { SitePage } from "./pages/site";
import { SeedDataProvider } from "@/lib/seed-data-provider";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PublicRoutes() {
  return (
    <SupabaseDataProvider>
      <div className="themed-type min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    </SupabaseDataProvider>
  );
}

function AdminRoutes() {
  return (
    <ProtectedRoute>
      <SupabaseDataProvider>
        <Outlet />
      </SupabaseDataProvider>
    </ProtectedRoute>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FilterProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<PublicRoutes />}>
              <Route path="/" element={<SitePage />} />
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/:page" element={<SitePage />} />
              <Route path="/:page/:item" element={<SitePage />} />
            </Route>

            <Route path="/admin" element={<AdminRoutes />}>
              <Route element={<AdminLayout basePath="/admin" />}>
                <Route path="/admin/messages" element={<AdminMessages />} />
              </Route>
            </Route>

            <Route path="/demo" element={<SeedDataProvider><Outlet /></SeedDataProvider>}>
              <Route index element={<Navigate to="/demo/messages" replace />} />
              <Route element={<AdminLayout basePath="/demo" />}>
                <Route path="/demo/messages" element={<AdminMessages />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BrowserRouter>
      </FilterProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
