import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { DeviceGate } from "./auth/DeviceGate";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentDetailPage from "./pages/AppointmentDetailPage";
import { CmsEditPage, CmsListPage } from "./pages/CmsPages";
import { PageCopyEditPage, PagesListPage } from "./pages/PageCopyPages";
import HomePageEditor from "./pages/HomePageEditor";
import SeoPage from "./pages/SeoPage";
import GalleryPage from "./pages/GalleryPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AuditPage from "./pages/AuditPage";
import StaffPage from "./pages/StaffPage";
import AccountPage from "./pages/AccountPage";

function RequireAuth( { children }: { children: JSX.Element } ) {
  const { ready, user } = useAuth();
  /* A returning visitor has no token in hand yet, only a cookie, so the first paint waits. */
  if ( !ready ) return <p className="text-small loading">Loading</p>;
  if ( !user ) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <DeviceGate>
          <Routes>
            <Route path="/login" element={ <LoginPage /> } />
            <Route path="/reset-password" element={ <ResetPasswordPage /> } />
            <Route
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route path="/" element={ <DashboardPage /> } />
              <Route path="/appointments" element={ <AppointmentsPage /> } />
              <Route path="/appointments/:id" element={ <AppointmentDetailPage /> } />
              <Route path="/content" element={ <Navigate to="/content/posts" replace /> } />
              <Route path="/content/:resource" element={ <CmsListPage /> } />
              <Route path="/content/:resource/new" element={ <CmsEditPage /> } />
              <Route path="/content/:resource/:id/edit" element={ <CmsEditPage /> } />
              <Route path="/home" element={ <HomePageEditor /> } />
              <Route path="/gallery" element={ <GalleryPage /> } />
              <Route path="/pages" element={ <PagesListPage /> } />
              <Route path="/pages/:key" element={ <PageCopyEditPage /> } />
              <Route path="/seo" element={ <SeoPage /> } />
              <Route path="/analytics" element={ <AnalyticsPage /> } />
              <Route path="/audit" element={ <AuditPage /> } />
              <Route path="/staff" element={ <StaffPage /> } />
              <Route path="/account" element={ <AccountPage /> } />
            </Route>
            <Route path="*" element={ <Navigate to="/" replace /> } />
          </Routes>
        </DeviceGate>
      </AuthProvider>
    </ToastProvider>
  );
}
