import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { initTheme } from "@shared/store/uiStore";

initTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
