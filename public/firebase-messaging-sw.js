/* Firebase Messaging Service Worker */

/* Import Firebase scripts */
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

/* Initialize Firebase */
firebase.initializeApp({
  apiKey: "AIzaSyDjM_o43j_spIkE_pKmKlwW9V05HTJg_yE",
  authDomain: "fresh-balancer-448901-m0.firebaseapp.com",
  projectId: "fresh-balancer-448901-m0",
  storageBucket: "fresh-balancer-448901-m0.appspot.com",
  messagingSenderId: "301021771346",
  appId: "1:301021771346:web:cf425579304e469807118b",
});

/* Get messaging instance */
const messaging = firebase.messaging();

/* Handle background notifications */
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message received:", payload);

  const title =
    payload.notification?.title || "Medi-Time Reminder";

  const options = {
    body:
      payload.notification?.body ||
      "Time to take your medicine",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [200, 100, 200],
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);
});

/* Optional: handle notification click */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});
