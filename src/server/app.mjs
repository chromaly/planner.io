import { createRoutes } from "./routes.mjs";
import { readJsonBody, sendJson } from "./http.mjs";

export function createApiHandler({ verifyIdToken, services = {} }) {
  const routes = createRoutes(services);
  return async (request, response) => {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const route = routes.get(`${request.method} ${url.pathname}`);
      if (!route) return sendJson(response, 404, { error: "Not found" });
      const context = { params: url.searchParams };
      if (route.auth !== false) {
        const match = /^Bearer (\S+)$/i.exec(request.headers.authorization ?? "");
        if (!match) return sendJson(response, 401, { error: "A Bearer token is required." });
        const user = await verifyIdToken(match[1]);
        context.uid = user.uid;
        context.token = match[1];
      }
      if (route.body) context.body = await readJsonBody(request);
      const { status, body } = await route.handler(context);
      sendJson(response, status, body);
    } catch (error) {
      console.error("API request failed:", error.code ?? error.name, error.message);
      const invalidToken = [
        "auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired",
      ].includes(error.code);
      sendJson(response, error.httpStatus ?? (invalidToken ? 401 : 503), {
        error: invalidToken ? "Invalid or expired token." : "Could not complete the request.",
      });
    }
  };
}
