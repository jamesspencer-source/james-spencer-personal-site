import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { extname, join } from "node:path";

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
  { label: "What the role includes", pattern: /What the role includes/i },
  { label: "Responsibility has expanded over time", pattern: /Responsibility has expanded over time/i },
  { label: "Responsibilities at HMS and HHMI", pattern: /Responsibilities at HMS and HHMI/i },
  { label: "From one laboratory to the current scope", pattern: /From one laboratory to the current scope/i },
  { label: "Research operations from planning through delivery", pattern: /Research operations from planning through delivery/i },
  { label: "unverified 15-20 lab headcount", pattern: /15[–-]20 people/i },
  { label: "old cropped headshot filename", pattern: /(headshot-cropped|headshot-tall|skinny-headshot|tall-skinny)/i },
  { label: "former building name label", pattern: /(formerly HIM|formerly NRB|Harvard Institutes of Medicine|New Research Building)/i },
  { label: "React Three Fiber dependency", pattern: /@react-three\/fiber/i }
];

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

for (const file of files) {
  const text = readFileSync(file, "utf8");

  for (const item of blocked) {
    if (item.pattern.test(text)) {
      failures.push(`${file.replace(`${root}/`, "")}: blocked phrase or dependency found (${item.label})`);
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
