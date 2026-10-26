import { Link } from "react-router-dom";

export function AdminFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-page items-center justify-between gap-6 px-6 py-10 lg:px-8">
        <span className="font-heading font-semibold tracking-tight text-foreground">{"Hazel House"}</span>
        <Link to="/sign-in" className="text-muted-foreground transition-colors hover:text-foreground">
          Admin
        </Link>
      </div>
    </footer>
  );
}
