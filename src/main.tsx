import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/index.css";
import { registerSW } from "virtual:pwa-register";

// Mount the React application immediately to avoid blocking initial UI render
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Non-blocking Service Worker registration for 100% offline cold-start
if ("serviceWorker" in navigator) {
  const register = () => {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log("[PWA] New content available; auto-updated.");
      },
      onOfflineReady() {
        console.log("[PWA] Application ready for 100% offline cold-start.");
      },
      onRegisterError(error: unknown) {
        console.error("[PWA] Service Worker registration failed:", error);
      },
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
