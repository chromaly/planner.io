import { createServer } from "node:http";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { createApiHandler } from "./app.mjs";

// Existing calendar utilities currently require Pacific time.
process.env.TZ ??= "America/Los_Angeles";

const firebaseApp = initializeApp({ projectId: "planner-io-f4953" });
const auth = getAuth(firebaseApp);
const handler = createApiHandler({ verifyIdToken: token => auth.verifyIdToken(token) });
const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "127.0.0.1";

createServer(handler).listen(port, host, () => {
  console.log(`Planner API running at http://${host}:${port}`);
});
