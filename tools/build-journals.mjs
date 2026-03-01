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

// ---------- helpers ----------
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

  // Strip junk before first { or [
  const firstObj = raw.indexOf("{");
  const firstArr = raw.indexOf("[");
  let start = -1;
  if (firstObj !== -1 && firstArr !== -1) start = Math.min(firstObj, firstArr);
  else start = Math.max(firstObj, firstArr);
  if (start > 0) raw = raw.slice(start);

  try {
    return JSON.parse(raw);
  } catch (e) {
    const preview = raw.slice(0, 220).replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    throw new Error(`JSON non valido: ${p}\n${e.message}\nPreview: ${preview}`);
  }
}

function pickString(obj, keys) {
  for (const k of keys) {
    if (obj && typeof obj[k] === "string" && obj[k].trim()) return obj[k].trim();
  }
  return "";
}

function normType(t) {
  const v = (typeof t === "string" ? t.trim().toLowerCase() : "");
  if (v === "image") return "image";
  return "text";
}

// ---------- main ----------
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

  const files = fs
    .readdirSync(entryDir)
    .filter(f => f.toLowerCase().endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" }));

  if (files.length === 0) continue;

  // Use FIRST page to determine entry key + translated entry title
  const firstPath = path.join(entryDir, files[0]);
  const firstPage = readJson(firstPath);

  // entry key must match original JournalEntry name (or ID)
  const entryKey = pickString(firstPage, ["entry", "entryId", "entryID"]) || folderName;

  // translated JournalEntry name
  const translatedEntryName =
    pickString(firstPage, ["entryName", "entryname", "entry_title", "entryTitle"]);

  if (!output.entries[entryKey]) output.entries[entryKey] = { name: "", pages: {} };

  // Apply translated entry name (the thing you said wasn't being applied)
  if (translatedEntryName) output.entries[entryKey].name = translatedEntryName;

  for (const file of files) {
    const fullPath = path.join(entryDir, file);
    const page = readJson(fullPath);

    if (!page || typeof page !== "object") {
      throw new Error(`Formato pagina non valido: ${fullPath}`);
    }

    // Original page key (must match original JournalEntryPage name or ID)
    const pageKey = pickString(page, ["page", "pageId", "pageID"]);
    if (!pageKey) throw new Error(`Manca "page" (string) in: ${fullPath}`);

    // Translated page name (what you want displayed)
    const pageName = pickString(page, ["name", "pageName", "pagename"]);
    if (!pageName) throw new Error(`Manca "name" (string) in: ${fullPath}`);

    const type = normType(page.type);

    // Ensure entry has a name fallback (last resort)
    if (!output.entries[entryKey].name) output.entries[entryKey].name = entryKey;

    if (type === "image") {
      const src = pickString(page, ["src", "source", "img", "image"]);
      if (!src) throw new Error(`Pagina image senza "src" in: ${fullPath}`);

      output.entries[entryKey].pages[pageKey] = {
        name: pageName,
        type: "image",
        src
      };
    } else {
      // text page
      const text = (typeof page.text === "string") ? page.text : "";
      if (!text.trim()) {
        // se vuoi, qui puoi fare throw invece di warning. Io tengo permissivo.
        console.warn(`WARN: pagina testo senza "text" (vuota) in: ${fullPath}`);
      }

      output.entries[entryKey].pages[pageKey] = {
        name: pageName,
        type: "text",
        text
      };
    }
  }

  // final fallback
  if (!output.entries[entryKey].name) output.entries[entryKey].name = entryKey;
}

fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2), "utf8");
console.log(`OK: scritto ${OUT_PATH}`);