// tools/build-journals.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Repo root = parent of /tools
const ROOT = path.resolve(__dirname, "..");

const SRC_ROOT = path.join(ROOT, "src", "journals");
const OUT_PATH = path.join(ROOT, "translations", "wfrp4e-eis.journals.json");

// ---- helpers ----
function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readJson(p) {
  let raw = fs.readFileSync(p, "utf8");

  // Remove UTF-8 BOM if present
  raw = raw.replace(/^\uFEFF/, "");

  // If any junk appears before the first { or [, strip it
  const firstObj = raw.indexOf("{");
  const firstArr = raw.indexOf("[");
  let start = -1;
  if (firstObj !== -1 && firstArr !== -1) start = Math.min(firstObj, firstArr);
  else start = Math.max(firstObj, firstArr);
  if (start > 0) raw = raw.slice(start);

  try {
    return JSON.parse(raw);
  } catch (e) {
    const preview = raw.slice(0, 160).replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    throw new Error(`JSON non valido: ${p}\n${e.message}\nPreview: ${preview}`);
  }
}

// ---- main ----
if (!isDir(SRC_ROOT)) {
  throw new Error(`Cartella sorgente non trovata: ${SRC_ROOT}`);
}

ensureDir(path.dirname(OUT_PATH));

const output = {
  label: "Diario (Nemico nell'Ombra)",
  entries: {}
};

const folders = fs.readdirSync(SRC_ROOT);

for (const folderName of folders) {
  const entryDir = path.join(SRC_ROOT, folderName);
  if (!isDir(entryDir)) continue;

  const files = fs.readdirSync(entryDir)
    .filter(f => f.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, "en"));

  if (files.length === 0) continue;

  // Determine entry key + translated entry name from the FIRST page file
  const firstPage = readJson(path.join(entryDir, files[0]));

  const entryKey = (firstPage.entry && String(firstPage.entry).trim())
    ? String(firstPage.entry).trim()
    : folderName;

  const translatedEntryName = (firstPage.entryName && String(firstPage.entryName).trim())
    ? String(firstPage.entryName).trim()
    : "";

  output.entries[entryKey] = output.entries[entryKey] ?? { name: "", pages: {} };

  // If provided, set translated Journal Entry title
  if (translatedEntryName) {
    output.entries[entryKey].name = translatedEntryName;
  }

  for (const file of files) {
    const fullPath = path.join(entryDir, file);
    const page = readJson(fullPath);

    if (!page || typeof page !== "object") throw new Error(`Formato pagina non valido: ${fullPath}`);
    if (!page.page || typeof page.page !== "string") throw new Error(`Manca "page" (string) in: ${fullPath}`);
    if (typeof page.name !== "string") throw new Error(`Manca "name" (string) in: ${fullPath}`);
    if (typeof page.text !== "string") throw new Error(`Manca "text" (string) in: ${fullPath}`);

    // Fallback entry name if not set
    if (!output.entries[entryKey].name) {
      output.entries[entryKey].name = entryKey;
    }

    output.entries[entryKey].pages[page.page] = {
      name: page.name,
      text: page.text
    };
  }

  // Final fallback
  if (!output.entries[entryKey].name) {
    output.entries[entryKey].name = entryKey;
  }
}

fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8");
console.log(`OK: scritto ${OUT_PATH}`);