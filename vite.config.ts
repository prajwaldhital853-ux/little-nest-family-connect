import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/* The clinic panel is its own app, reached through this address at /admin/. Its dev server
   serves the app at /admin/ only, so the slash-less spelling gets it. */
function panelSlash(): Plugin {
  return {
    name: "panel-slash",
    configureServer( server ) {
      server.middlewares.use( ( req, res, next ) => {
        if ( req.url === "/admin" ) {
          res.writeHead( 301, { Location: "/admin/" } );
          res.end();
          return;
        }
        next();
      } );
    },
  };
}

export default defineConfig(({ mode }) => {
  /* Read from .env as well as the shell, so the proxy target is one knob in one place. */
  const env = loadEnv( mode, process.cwd() );
  const backend = env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
  const panel = env.VITE_PANEL_URL || "http://127.0.0.1:5173";

  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        /* changeOrigin stays off: the address in the bar must reach Django, because the panel's
           cookie-backed calls are trusted by matching that address against the Origin header. */
        "/api": { target: backend, changeOrigin: false },
        /* Only real file paths belong to Django. A bare /media is the site's own page, and matching
           the prefix alone would send that request to Django and 404 the page on a hard refresh. */
        "^/media/.+": { target: backend, changeOrigin: false },
        "/admin": { target: panel, changeOrigin: true },
      },
      hmr: {
        overlay: false,
      },
    },
    plugins: [ panelSlash(), react() ],
    resolve: {
      alias: {
        "@": path.resolve( __dirname, "./src" ),
      },
    },
  };
} );
