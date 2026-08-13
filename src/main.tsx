import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/index.css";
import App from "./App";

// Apply persisted theme before first render to avoid flash
const stored = localStorage.getItem("rspir-ui");
const theme = stored ? (JSON.parse(stored) as { state?: { theme?: string } }).state?.theme : null;
document.documentElement.setAttribute("data-theme", theme === "light" ? "light" : "dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
