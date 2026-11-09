import { renderPrintFile } from "../lib/print-file.js";
import { cleanName, INK } from "../public/design.js";

// GET /api/print-file?name=MOOSE&ink=light|dark  ->  PNG
// Printful downloads the artwork for custom name orders from here.
export default function handler(req, res) {
  const url = new URL(req.url, "http://localhost");
  const name = cleanName(url.searchParams.get("name"));
  const ink = INK[url.searchParams.get("ink")];
  if (!name || !ink) return res.status(400).json({ error: "Invalid name or ink" });

  const png = renderPrintFile({ name, ink });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.status(200).send(png);
}
