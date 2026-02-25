import fs from "fs";
import path from "path";

const SRC_ROOT = "src/journals";
const OUT_FILE = "translations/wfrp4e-eis.journals.json";

const output = {
  label: "Diario (Nemico nell'Ombra)",
  entries: {}
};

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readJson(p) {
  let raw = fs.readFileSync(p, "utf8");

  // 1) rimuovi BOM UTF-8 (molto comune su export/copy-paste da Windows)
  raw = raw.replace(/^\uFEFF/, "");

  // 2) se c'è spazzatura prima di { o [, tagliala (apostrofi, backtick, ecc.)
  const firstObj = raw.indexOf("{");
  const firstArr = raw.indexOf("[");
  let start = -1;
  if (firstObj !== -1 && firstArr !== -1) start = Math.min(firstObj, firstArr);
  else start = Math.max(firstObj, firstArr);

  if (start > 0) raw = raw.slice(start);

  try {
    return JSON.parse(raw);
  } catch (e) {
    const preview = raw.slice(0, 120).replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    throw new Error(`JSON non valido: ${p}\n${e.message}\nPreview: ${preview}`);
  }
}

// Assicura che esistano le cartelle (anche se hai già .gitkeep)
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

if (!isDir(SRC_ROOT)) {
  throw new Error(`Cartella sorgente non trovata: ${SRC_ROOT}`);
}

for (const folderName of fs.readdirSync(SRC_ROOT)) {
  const entryDir = path.join(SRC_ROOT, folderName);
  if (!isDir(entryDir)) continue;

  const files = fs.readdirSync(entryDir)
    .filter(f => f.endsWith(".json"))
    .sort();

  if (files.length === 0) continue;

  // Determina la chiave entry “vera”:
  // se la prima pagina ha "entry", usiamo quella; altrimenti usiamo il nome cartella
  const firstPage = readJson(path.join(entryDir, files[0]));
  const entryKey = (firstPage.entry && String(firstPage.entry).trim())
    ? String(firstPage.entry).trim()
    : folderName;

  // entry “come RNHD”: ha anche un name a livello entry
  output.entries[entryKey] = output.entries[entryKey] ?? { name: "", pages: {} };

  for (const file of files) {
    const fullPath = path.join(entryDir, file);
    const page = readJson(fullPath);

    // Validazione minima
    if (!page || typeof page !== "object") {
      throw new Error(`Formato pagina non valido: ${fullPath}`);
    }
    if (!page.page || typeof page.page !== "string") {
      throw new Error(`Manca "page" (string) in: ${fullPath}`);
    }
    if (typeof page.name !== "string") {
      throw new Error(`Manca "name" (string) in: ${fullPath}`);
    }
    if (typeof page.text !== "string") {
      throw new Error(`Manca "text" (string) in: ${fullPath}`);
    }

    // Imposta il nome entry dalla prima pagina utile
    if (!output.entries[entryKey].name) {
      output.entries[entryKey].name = page.name;
    }

    // Inserisce/aggiorna la pagina
    output.entries[entryKey].pages[page.page] = {
      name: page.name,
      text: page.text
    };
  }

  // fallback
  if (!output.entries[entryKey].name) {
    output.entries[entryKey].name = entryKey;
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
console.log("✔ Journals built for Babele");
