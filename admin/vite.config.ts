import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

/* The panel is reached at /admin on the site's origin, so every asset and route name carries
   that prefix. Change it here and in src/main.tsx together. */
export default defineConfig(
  ( { mode } ) => {
    /* Read from .env as well as the shell, so the proxy target is one knob in one place. */
    const env = loadEnv( mode, process.cwd() );
    const backend = env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

    return {
      base: "/admin/",
      plugins: [ react() ],
      server: {
        /* Pinned to IPv4 loopback because the site's dev server forwards /admin here, and a
           host that resolves to ::1 only would leave that forward nowhere to go. */
        host: "127.0.0.1",
        port: 5173,
        strictPort: true,
        proxy: {
          /* changeOrigin stays off, the same way the site's own proxy does it: Django trusts a
             cookie-backed call when the address in the bar matches the Origin it was sent from,
             and rewriting that address would make every call from this port look like a
             forgery. The site is still the front door; this only makes the direct port work too. */
          "/api": { target: backend, changeOrigin: false },
          /* Uploaded pictures live on the backend's disk, the same route /api takes. */
          "/media": { target: backend, changeOrigin: false },
        },
        /* Hot reload connects straight back to this server, because the page is loaded
           through the site's proxy and the address in the bar is not this port. */
        hmr: { clientPort: 5173 },
      },
    };
  }
);
