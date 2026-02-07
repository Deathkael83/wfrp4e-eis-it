import fs from "fs";
import path from "path";
const SRC_ROOT = "src/scenes";
const OUT_FILE = "translations/wfrp4e-eis.scenes.json";
const output = { label: "Scene (Nemico nell'Ombra)", entries: {} };
for (const entryName of fs.readdirSync(SRC_ROOT)) {
  const entryDir = path.join(SRC_ROOT, entryName);
  if (!fs.statSync(entryDir).isDirectory()) continue;
  output.entries[entryName] = {};
  const files = fs.readdirSync(entryDir).filter(f => f.endsWith(".json")).sort();
  for (const file of files) {
    const raw = fs.readFileSync(path.join(entryDir, file), "utf8");
    const frag = JSON.parse(raw);
    if (!frag?.key || frag?.value === undefined) throw new Error(`Invalid fragment: ${entryName}/${file} (expected {key,value})`);
    output.entries[entryName][frag.key] = frag.value;
  }
}
fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
console.log("✔ Scenes built for Babele");
