self.addEventListener("push", (event) => {
  let data = { title: "GROUP PHOEBE", body: "", url: "/" };

  try {
    const payload = event.data?.json();
    if (payload) data = { ...data, ...payload };
  } catch {
    data.body = event.data?.text() ?? "";
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon.png",
      badge: "/icon.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(clients.openWindow(url));
});
