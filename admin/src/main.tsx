import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { applyTheme, storedTheme } from "./theme";
import "./admin.css";

/* The palette goes on before the first paint, so a dark panel never flashes white on the way in. */
applyTheme( storedTheme() );

/* The panel shares the site's address and lives under /admin, so every route name in App.tsx
   is relative to that prefix. */
createRoot( document.getElementById( "root" ) as HTMLElement ).render(
  <StrictMode>
    <BrowserRouter basename="/admin">
      <App />
    </BrowserRouter>
  </StrictMode>
);
