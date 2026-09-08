import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import ts from "typescript";

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const app = read("src/App.tsx");
const css = read("src/styles.css");
const html = read("index.html");
const file = ts.createSourceFile("App.tsx", app, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const ids = [];
const anchors = [];
let headings = 0;
function visit(node) {
  if (ts.isJsxOpeningElement(node) && node.tagName.getText(file) === "h1") headings++;
  if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
    if (node.name.getText(file) === "id") ids.push(node.initializer.text);
    if (node.name.getText(file) === "href" && node.initializer.text.startsWith("#")) anchors.push(node.initializer.text.slice(1));
  }
  ts.forEachChild(node, visit);
}
visit(file);
assert.equal(headings, 1, "One primary heading is required");
assert.equal(new Set(ids).size, ids.length, "Duplicate DOM ids");
for (const anchor of [...anchors, "laboratories", "community-phages", "lmnop"]) assert(ids.includes(anchor), `Missing anchor: ${anchor}`);
assert(!/preventDefault|replaceState|ScrollTrigger/.test(app), "Keep role links native and the page free of scroll traps");
assert(/lazy\(\(\) => import\("\.\/components\/ConferenceAtlas"\)\)/.test(app), "Load the map outside the initial page path");
assert(!/from ["'].*OperationsVisuals/.test(app), "Do not reintroduce the eager legacy graphics bundle");
assert(!/setDaypart|className="lighting"|Architectural visualization/.test(app), "Do not restore rejected image controls or captions");
assert(app.includes("Approximately 20–22 members") && app.includes("Approximately 18–20 members"), "Keep James's confirmed lab population ranges");
assert(app.includes("Lab members supported"), "Do not present supported lab populations as direct reports");
assert(read("src/components/ConferenceAtlas.tsx").includes("2027 · In planning"), "Distinguish the planned DC conference from previous meetings");
assert(!css.includes("65svh"), "Do not reintroduce viewport-sized program steps");
assert(read("src/components/ConferenceAtlas.tsx").includes("location.facts.map"), "Conference selections must include meeting context, not only city and year");

// A framing correction must never silently substitute or modify the approved portrait.
const portraits = {
  "james-m-spencer-studio-headshot.jpg": "359fb98431edb6c4bbed5eee42534db1430803b285fb391bd8523019bf196286",
  "james-m-spencer-studio-headshot-720.jpg": "b6fc36bafe0fce36c64c2db622cd27925670a6271e726e608540501317570a1a",
  "james-m-spencer-studio-headshot-1100.jpg": "6375fe017c6e23837945b8d0bb2a5f5fb27a95e23d6c853aedfd956312bf5e43",
  "james-m-spencer-studio-headshot-1500.jpg": "63d1142f671726466909b4e577a436be26bf3112791bfc35e973e758755c22bd",
};
for (const [name, expected] of Object.entries(portraits)) {
  const bytes = readFileSync(new URL(`../public/assets/images/${name}`, import.meta.url));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), expected, `Portrait changed: ${name}`);
}
assert(app.includes('asset("assets/images/james-m-spencer-studio-headshot.jpg")'), "Contact must reference the original portrait");
const portraitRules = [...css.matchAll(/\.contact-portrait img\s*\{([^}]+)\}/g)].map(match => match[1]);
assert(portraitRules.length > 0);
assert(portraitRules.every(rule => !/object-fit:\s*cover/.test(rule)), "Portrait cropping is not allowed");
assert(portraitRules.some(rule => /object-fit:\s*contain/.test(rule) && /height:\s*auto/.test(rule)));
assert(!/assets\/images\/hero\/|daypart/.test(app + html), "Do not load or preload the rejected aerial");
const rejectedAerials = new Set([
  "a813ba3c9d6655578c32fff8cea16d8029476842c8bc30dfbd2af4fd0f2e9f3f",
  "7e53863dfc65f3029adc83d4ec7ab04ea3cf50716fa76efb97bb45f6a37b6026",
  "220d6371b97b8020226c3aa17779b8b6472bc83292074abd359107f15610a592",
  "36d30e116f42124cd0f45351ce0676e1e60215c0a7a180b0c8893051bdf2bd52",
  "546b64b1b8c5ecdad1f597a0922bb24f687f24148867955d91e2f5f8c60b7a25",
  "1ad02c66d2f0b0a8dd587bf5d7b0519b8b9afd0decba0c0f7790f4996cbc4e7e",
  "1068c9c100eff25146a81963492e77293fd7ee9dff5e11c286c8361252e26642",
  "a6b518fc4260923bc735904c612e392e37ebe0b3b1096d83701f4011f4c61388",
  "45c7c353738e5dc8a62d903a1ad2dd988458f9b23fef090bef15b0fb05e6e844",
]);
function checkPublishedAssets(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const url = new URL(encodeURIComponent(entry.name) + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) checkPublishedAssets(url);
    else {
      const hash = createHash("sha256").update(readFileSync(url)).digest("hex");
      assert(!rejectedAerials.has(hash), `Rejected aerial restored: ${url.pathname}`);
    }
  }
}
checkPublishedAssets(new URL("../public/", import.meta.url));
assert(!/<source[^>]*media=/.test(app), "Avoid a second mobile-only hero request");
assert(existsSync(new URL("../public/assets/resume/james-m-spencer-resume.pdf", import.meta.url)));
assert(html.includes('rel="canonical"'));
assert(html.includes('content="https://jamesspencer-source.github.io/james-spencer-personal-site/og.png"'));
console.log("Site structure, assets, navigation, portrait, and lazy-loading checks passed.");
