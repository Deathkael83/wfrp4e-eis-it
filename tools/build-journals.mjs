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
  const raw = fs.readFileSync(p, "utf8");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON non valido: ${p}\n${e.message}`);
  }
}

// Assicura che esistano le cartelle (anche se hai già .gitkeep)
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });

if (!isDir(SRC_ROOT)) {
  throw new Error(`Cartella sorgente non trovata: ${SRC_ROOT}`);
}

for (const entryName of fs.readdirSync(SRC_ROOT)) {
  const entryDir = path.join(SRC_ROOT, entryName);
  if (!isDir(entryDir)) continue;

  // entry “come RNHD”: ha anche un name a livello entry
  output.entries[entryName] = { name: "", pages: {} };

  const files = fs.readdirSync(entryDir)
    .filter(f => f.endsWith(".json"))
    .sort();

  if (files.length === 0) continue;

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
    if (!output.entries[entryName].name) {
      output.entries[entryName].name = page.name;
    }

    // Inserisce/aggiorna la pagina
    output.entries[entryName].pages[page.page] = {
      name: page.name,
      text: page.text
    };
  }

  // Se per qualche motivo non è stato impostato (es. name vuoto), fallback
  if (!output.entries[entryName].name) {
    output.entries[entryName].name = entryName;
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
console.log("✔ Journals built for Babele");
