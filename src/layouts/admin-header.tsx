import { Link } from "react-router-dom";

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between px-6 lg:px-8">
        <Link to="/" className="font-heading font-semibold tracking-tight text-foreground">
          {"Hazel House"}
        </Link>
        <Link to="/" className="text-muted-foreground transition-colors hover:text-foreground">
          View the site
        </Link>
      </div>
    </header>
  );
}
