self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data?.json() ?? {};
  } catch {
    payload = {};
  }

  const title =
    typeof payload.title === "string"
      ? payload.title.slice(0, 100)
      : "Planner";

  const body =
    typeof payload.body === "string"
      ? payload.body.slice(0, 500)
      : "You have an upcoming reminder.";

  const target = new URL(
    "/planner.io/mobile/#/calendar",
    self.location.origin,
  );

  if (typeof payload.eventId === "string") {
    target.hash =
      "/calendar?eventId=" + encodeURIComponent(payload.eventId);
  } else if (typeof payload.deadlineId === "string") {
    target.hash =
      "/calendar?deadlineId=" + encodeURIComponent(payload.deadlineId);
  }

  event.waitUntil(
    self.registration.showNotification(title, {
        body,
        silent: false,
        tag: typeof payload.tag === "string" ? payload.tag : undefined,
        renotify: false,
        data: { url: target.href },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const fallback = new URL(
    "/planner.io/mobile/",
    self.location.origin,
  );

  let target = fallback;

  try {
    const candidate = new URL(event.notification.data?.url);

    if (
      candidate.origin === fallback.origin &&
      candidate.pathname.startsWith(fallback.pathname)
    ) {
      target = candidate;
    }
  } catch {
    // Use the app's home page if the stored URL is invalid.
  }

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windows) {
        const current = new URL(client.url);

        if (
          current.origin === fallback.origin &&
          current.pathname.startsWith(fallback.pathname)
        ) {
          const navigated = await client.navigate(target.href);

          if (navigated) {
            await navigated.focus();
            return;
          }
        }
      }

      await self.clients.openWindow(target.href);
    })(),
  );
});