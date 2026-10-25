// Tiny local server that mimics Vercel: static files from public/ plus /api/checkout.
// Run: npm run dev  (reads STRIPE_SECRET_KEY from .env if present)
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { existsSync } from "node:fs";
import checkout from "../api/checkout.js";

if (existsSync(".env")) process.loadEnvFile(".env");
const PORT = process.env.PORT || 3000;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json" };

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/api/checkout") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      try { req.body = raw ? JSON.parse(raw) : {}; } catch { req.body = {}; }
      res.status = (code) => ((res.statusCode = code), res);
      res.json = (obj) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
      return checkout(req, res);
    }
    let path = url.pathname === "/" ? "/index.html" : url.pathname;
    if (!extname(path)) path += ".html";
    try {
      const body = await readFile(join("public", normalize(path).replace(/^(\.\.[/\\])+/, "")));
      res.writeHead(200, { "Content-Type": TYPES[extname(path)] || "application/octet-stream" }).end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(PORT, () => console.log(`Pyr and Co running at http://localhost:${PORT}`));
