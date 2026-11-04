import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { FilterProvider } from "@/lib/filter-context";
import { ScrollToTop } from "@/components/scroll-to-top";
import NotFound from "./pages/not-found";
import { SitePage } from "./pages/site";
import { SiteDataProvider } from "./pages/site/site-data";

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
    <SiteDataProvider>
      <div className="themed-type min-h-screen bg-background text-foreground">
        <Outlet />
      </div>
    </SiteDataProvider>
  );
}

/* There is no sign-in on this site. The clinic panel is a separate app, and it is
   the only place a password is ever asked for. */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <FilterProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<PublicRoutes />}>
            <Route path="/" element={<SitePage />} />
            {/* Healthy ageing and the consultation walk became one page, at the healthy ageing address. */}
            <Route path="/how-it-works" element={<Navigate to="/healthy-ageing" replace />} />
            <Route path="/:page" element={<SitePage />} />
            <Route path="/:page/:item" element={<SitePage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </FilterProvider>
  </QueryClientProvider>
);

export default App;
