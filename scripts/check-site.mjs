import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
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
for (const time of ["day", "dusk", "night"]) for (const width of [960, 1536, 2560]) {
  assert(existsSync(new URL(`../public/assets/images/hero/hero-${time}-${width}.jpg`, import.meta.url)), `Missing hero variant: ${time}/${width}`);
}
assert(html.includes('preload.imageSizes = "100vw"') && app.includes('sizes="100vw"'), "Hero preload and rendered sizes must agree");
assert(!/<source[^>]*media=/.test(app), "Avoid a second mobile-only hero request");
assert(existsSync(new URL("../public/assets/resume/james-m-spencer-resume.pdf", import.meta.url)));
assert(html.includes('rel="canonical"'));
assert(html.includes('content="https://jamesspencer-source.github.io/james-spencer-personal-site/og.png"'));
console.log("Site structure, assets, navigation, portrait, and lazy-loading checks passed.");
