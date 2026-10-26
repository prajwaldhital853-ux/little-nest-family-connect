import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { IconLogout, IconMail, type Icon } from "@tabler/icons-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminHeader } from "@/layouts/admin-header";
import { AdminFooter } from "@/layouts/admin-footer";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/base/sidebar";
import { useAuth } from "@/lib/auth/auth-provider";
import { useDataProvider } from "@/lib/data-provider";

interface NavItem {
  label: string;
  to: string;
  icon: Icon;
}

function AdminSidebar({ basePath }: { basePath: string }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { useProfile } = useDataProvider();
  const { data: profile } = useProfile();

  const navItems: NavItem[] = [
    { label: "Messages", to: `${basePath}/messages`, icon: IconMail },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/sign-in", { replace: true });
  };

  return (
    <Sidebar collapsible="offcanvas" className="border-r-hairline">

      <SidebarHeader className="px-4 py-4">
        <span className="text-sm font-semibold text-foreground">
          {profile.full_name}
        </span>
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.to}>
                        <item.icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator className="mx-0" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut}>
              <IconLogout className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function AdminLayout({
  basePath = "/admin",
}: {
  basePath?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <AdminHeader />
      <SidebarProvider className="flex-1 min-h-0">
        <AdminSidebar basePath={basePath} />
        <SidebarInset className="overflow-y-auto">
          <header className="sticky top-0 z-20 flex h-12 items-center gap-2 border-b-hairline bg-background px-3 md:hidden">
            <SidebarTrigger aria-label="Open navigation menu" />
          </header>
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
      <AdminFooter />
    </div>
  );
}
