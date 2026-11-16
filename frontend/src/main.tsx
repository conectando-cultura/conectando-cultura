import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

function obtenerBasename(): string {
  const rawPath = window.location.pathname;
  const matchTics = rawPath.match(
    /^(\/TICS\/2026\/6to(?:\s|%20)2da\/conectando-cultura-main)/i
  );
  if (matchTics) {
    return matchTics[1];
  }
  const matchCorto = rawPath.match(/^(\/conectando-cultura)/i);
  if (matchCorto) {
    return matchCorto[1];
  }
  return "/";
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename={obtenerBasename()}>
      <App />
    </BrowserRouter>
  </StrictMode>
);