import { createServer } from "node:http";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readEventPage } from "./events.mjs";

const firebaseApp = initializeApp({
  projectId: "planner-io-f4953",
});

const auth = getAuth(firebaseApp);

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json",
  });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    sendJson(response, 200, {
      status: "ok",
      service: "planner.io",
    });
    return;
  }

  const url = new URL(request.url, "http://127.0.0.1:8787");

  if (
    request.method === "GET" &&
    ["/me", "/events"].includes(url.pathname)
  ) {
    const authorization = request.headers.authorization ?? "";
    const match = /^Bearer (\S+)$/i.exec(authorization);

    if (!match) {
      sendJson(response, 401, {
        error: "A Bearer token is required.",
      });
      return;
    }

    try {
      const user = await auth.verifyIdToken(match[1]);

      if (url.pathname === "/me") {
        sendJson(response, 200, { uid: user.uid });
      } else {
        const page = await readEventPage(
          match[1],
          user.uid,
          url.searchParams.get("pageToken")
        );

        sendJson(response, 200, page);
      }
    } catch (error) {
    console.error("API request failed:", error.code ?? error.name);

    const invalidToken = [
      "auth/argument-error",
      "auth/invalid-id-token",
      "auth/id-token-expired",
    ].includes(error.code);

    const status = error.httpStatus ?? (invalidToken ? 401 : 503);

    sendJson(response, status, {
      error: invalidToken
        ? "Invalid or expired token."
        : "Could not complete the request.",
    });
  }

    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(8787, "127.0.0.1", () => {
  console.log("Planner API running at http://127.0.0.1:8787");
});