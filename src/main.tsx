import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./base.css";
import "./style-pack.css";
import "./section-layouts.css";
import "./styles/site-grid.css";
import "./styles/layouts.css";

import { applySitePack } from "./style-packs";
import { hazelHouse } from "./style-packs/hazel-house";
applySitePack(hazelHouse);

const theme = localStorage.getItem("theme") ?? "system";
if (theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
