/* ================= MEDI-TIME SERVICE WORKER ================= */

// 🔁 Activate immediately
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/* ---------------- PUSH / NOTIFICATION ---------------- */
/*
  This handler works for:
  - Web Push
  - FCM background messages (next step)
*/
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};

  self.registration.showNotification("🔔 Medicine Reminder", {
    body: data.body || "Time to take your medicine",
    icon: data.icon || "/icons/icon-192.png",
    image: data.image || undefined, // 🖼 medicine image
    badge: "/icons/icon-192.png",

    // ✅ stays on lock screen until user acts
    requireInteraction: true,

    // ✅ vibration fallback when device is silent
    vibrate: [200, 100, 200],

    data: {
      url: data.url || "/", // open app on click
    },
  });
});

/* ---------------- CLICK HANDLER ---------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
  );
});