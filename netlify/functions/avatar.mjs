import { getStore } from "@netlify/blobs";

const store = getStore("shared-profile-avatar");
const KEY = "common-avatar";
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

export default async (request) => {
  if (request.method === "GET") {
    const saved = await store.getWithMetadata(KEY, { type: "blob" });
    if (!saved?.data) return new Response("No avatar saved yet", { status: 404 });
    return new Response(saved.data, {
      headers: {
        "Content-Type": saved.metadata?.contentType || "image/png",
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (request.method === "PUT") {
    const contentType = (request.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!ALLOWED.has(contentType)) return Response.json({ error: "Unsupported image type" }, { status: 415 });
    const bytes = await request.arrayBuffer();
    if (!bytes.byteLength || bytes.byteLength > MAX_BYTES) {
      return Response.json({ error: "Image must be under 3 MB" }, { status: 413 });
    }
    await store.set(KEY, new Uint8Array(bytes), { metadata: { contentType } });
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, PUT" } });
};
