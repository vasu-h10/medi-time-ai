import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// ✅ Firebase Messaging Service Worker (PWA + Notifications)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then(() => {
        console.log("Firebase Messaging Service Worker registered");
      })
      .catch((err) => {
        console.error("Service Worker registration failed:", err);
      });
  });
}
