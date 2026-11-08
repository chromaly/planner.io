export function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

export async function readJsonBody(request) {
  const contentType = request.headers["content-type"] ?? "";
  if (contentType.split(";")[0].trim() !== "application/json") {
    throw Object.assign(new Error("Expected application/json."), { httpStatus: 415 });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > 16384) {
      throw Object.assign(new Error("Request body is too large."), { httpStatus: 413 });
    }
    chunks.push(bytes);
  }
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw Object.assign(new Error("Expected a JSON object."), { httpStatus: 400 });
  }
}
