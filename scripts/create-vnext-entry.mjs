import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const vnext = join(dist, "vnext");

mkdirSync(vnext, { recursive: true });
copyFileSync(join(dist, "index.html"), join(vnext, "index.html"));

console.log("Created dist/vnext/index.html.");
