import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join, relative } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const meta = JSON.parse(readFileSync(join(root, "site-meta.json"), "utf8"));
const indexHtml = readFileSync(join(root, "index.html"), "utf8");

const scanTargets = [
  join(root, "src"),
  join(root, "index.html"),
  join(root, "README.md"),
  join(root, "package.json"),
  join(root, "vite.config.ts")
];

const allowedExtensions = new Set([".ts", ".tsx", ".css", ".html", ".md", ".json"]);
const blocked = [
  { label: "Preferred", pattern: /Preferred/i },
  { label: "remit", pattern: /\bremit\b/i },
  { label: "operating profile", pattern: /operating profile/i },
  { label: "operating surface", pattern: /operating surface/i },
  { label: "operating pattern", pattern: /operating pattern/i },
  { label: "throughline", pattern: /throughline/i },
  { label: "ecosystem", pattern: /\becosystem\b/i },
  { label: "convenings", pattern: /\bconvenings\b/i },
  { label: "shared operating footprint", pattern: /shared operating footprint/i },
  { label: "work behind the titles", pattern: /work behind the titles/i },
  { label: "work moving", pattern: /work moving/i },
  { label: "Documentary proof", pattern: /Documentary proof/i },
  { label: "ready to run", pattern: /ready to run/i },
  { label: "practical systems", pattern: /practical systems/i },
  { label: "steady follow-through", pattern: /steady follow-through/i },
  { label: "the anchor", pattern: /the anchor/i },
  { label: "work spans", pattern: /work spans/i },
  { label: "operating work", pattern: /operating work/i },
  { label: "scientific communities", pattern: /scientific communities/i },
  { label: "professional programming", pattern: /professional programming/i },
  { label: "same coordination work", pattern: /same coordination work/i },
  { label: "before, during, and after launch", pattern: /before, during, and after launch/i },
  { label: "Selected examples", pattern: /Selected examples/i },
  { label: "old cropped headshot filename", pattern: /(headshot-cropped|headshot-tall|skinny-headshot|tall-skinny)/i },
  { label: "former building name label", pattern: /(formerly HIM|formerly NRB|Harvard Institutes of Medicine|New Research Building)/i }
];

const blockedVNext = [
  { label: "systems behind", pattern: /systems behind/i },
  { label: "operating side", pattern: /operating side/i },
  { label: "strongest fit", pattern: /strongest fit/i },
  { label: "recurring programming", pattern: /recurring programming/i },
  { label: "scene settles", pattern: /scene settles/i },
  { label: "cinematic prototype", pattern: /cinematic prototype/i },
  { label: "visual system", pattern: /visual system/i },
  { label: "managed floors remain visible", pattern: /managed floors remain visible/i }
];

const r3fPattern = /@react-three\/fiber/i;

function walk(path) {
  const stats = statSync(path);

  if (stats.isDirectory()) {
    return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
  }

  if (!allowedExtensions.has(extname(path))) {
    return [];
  }

  return [path];
}

const files = scanTargets.flatMap((target) => walk(target));
const failures = [];

function relativeFromRoot(file) {
  return relative(root, file);
}

for (const file of files) {
  const text = readFileSync(file, "utf8");
  const relativeFile = relativeFromRoot(file);

  for (const item of blocked) {
    if (item.pattern.test(text)) {
      failures.push(`${relativeFile}: blocked phrase or dependency found (${item.label})`);
    }
  }

  if (relativeFile.startsWith("src/vnext/")) {
    for (const item of blockedVNext) {
      if (item.pattern.test(text)) {
        failures.push(`${relativeFile}: blocked vNext phrase found (${item.label})`);
      }
    }
  }

  if (r3fPattern.test(text)) {
    const allowedR3fFile =
      relativeFile.startsWith("src/vnext/") || relativeFile === "package.json" || relativeFile === "vite.config.ts";

    if (!allowedR3fFile) {
      failures.push(`${relativeFile}: React Three Fiber is only allowed inside src/vnext`);
    }
  }
}

if (!indexHtml.includes(`<title>${meta.title}</title>`)) {
  failures.push("index.html: title does not match site-meta.json");
}

if (!indexHtml.includes(`content="${meta.description}"`)) {
  failures.push("index.html: description does not match site-meta.json");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Content checks passed.");
