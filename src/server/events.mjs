export async function readEventPage(token, uid, pageToken) {
  const url = new URL(
    "https://firestore.googleapis.com/v1/" +
    "projects/planner-io-f4953/databases/(default)/documents/" +
    `users/${encodeURIComponent(uid)}/events`
  );

  url.searchParams.set("pageSize", "100");

  if (pageToken) {
    url.searchParams.set("pageToken", pageToken);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error("Could not read planner events.");

    error.code = data.error?.status;
    error.httpStatus = [400, 401, 403].includes(response.status)
      ? response.status
      : 502;

    throw error;
  }

  return {
    events: (data.documents ?? []).map((document) => {
      const fields = document.fields ?? {};

      return {
        id: document.name.split("/").at(-1),
        name: fields.name?.stringValue ?? "",
        startTime: fields.startTime?.timestampValue ?? null,
        duration: Number(
          fields.duration?.integerValue ??
          fields.duration?.doubleValue ??
          0
        ),
      };
    }),
    nextPageToken: data.nextPageToken ?? null,
  };
}