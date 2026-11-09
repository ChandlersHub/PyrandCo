import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { designSvg, FONT_FAMILY } from "../public/design.js";

const FONT = join(process.cwd(), "public/fonts/Oswald-Bold.ttf");

// Renders the silhouette + name as a transparent PNG for Printful.
export function renderPrintFile({ name, ink }) {
  const svg = designSvg({ name, ink });
  const resvg = new Resvg(svg, {
    background: "rgba(0,0,0,0)",
    font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: FONT_FAMILY },
  });
  return resvg.render().asPng();
}
