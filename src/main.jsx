import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// ✅ Global styles (app-wide)
import "./styles/global.css";

// ✅ Render app
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Minimal Service Worker registration (REQUIRED for PWA / Play Store)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        console.log("Service Worker registered");
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}