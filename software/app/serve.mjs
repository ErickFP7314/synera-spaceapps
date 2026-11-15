// Tiny static server for the Galley web app. No dependencies, only Node.js.
// Run from the software folder:  npm start
// It serves the whole repo (the app reads data/ and contracts/), same layout as GitHub Pages.
// "/" redirects to /software/app/.
// The camera only works on http://127.0.0.1 or localhost, so we bind to 127.0.0.1.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../../", import.meta.url)));
const port = Number(process.env.PORT) || 5174;
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".css": "text/css; charset=utf-8", ".bin": "application/octet-stream",
  ".md": "text/plain; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".csv": "text/csv; charset=utf-8", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".opus": "audio/ogg", ".wav": "audio/wav",
  ".mp4": "video/mp4", ".webm": "video/webm", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json"
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (path === "/") { res.writeHead(302, { Location: "/software/app/" }).end(); return; }
    if (path.endsWith("/")) path += "index.html";
    // never serve hidden files (.git, .env…) or the personal folders that are not in the repo
    if (path.split("/").some((s) => s.startsWith(".") || s === "resumenes-hardware" || s === "node_modules")) { res.writeHead(403).end("Forbidden"); return; }
    const file = resolve(join(root, normalize(path)));
    if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403).end("Forbidden"); return; }
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-cache" });
    res.end(data);
  } catch (e) {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () => console.log(`Galley app: http://127.0.0.1:${port}/software/app/`));
