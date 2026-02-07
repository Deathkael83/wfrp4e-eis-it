import fs from "fs";
import path from "path";

const SRC_ROOT = "src/journals";
const OUT_FILE = "translations/wfrp4e-eis.journals.json";

const output = {
  label: "WFRP4E Enemy in Shadows – Journals (IT)",
  entries: {}
};

for (const entryName of fs.readdirSync(SRC_ROOT)) {
  const entryDir = path.join(SRC_ROOT, entryName);
  if (!fs.statSync(entryDir).isDirectory()) continue;

  output.entries[entryName] = { pages: {} };

  const files = fs.readdirSync(entryDir)
    .filter(f => f.endsWith(".json"))
    .sort();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(entryDir, file), "utf8");
    const page = JSON.parse(raw);

    output.entries[entryName].pages[page.page] = {
      name: page.name,
      text: page.text
    };
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
console.log("✔ Journals built for Babele");