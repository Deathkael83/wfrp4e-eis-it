Hooks.once("init", () => {
  const babeleModule = game.modules.get("babele");
  if (!babeleModule || !babeleModule.active) {
    console.error("wfrp4e-eis | Babele non è attivo: impossibile registrare la traduzione EIS.");
    return;
  }

  if (typeof Babele === "undefined") {
    console.error("wfrp4e-eis | Oggetto globale Babele non trovato.");
    return;
  }

  Babele.get().register({
    module: "wfrp4e-eis", // modulo ORIGINALE
    lang: "it",
    dir: "translations"    // cartella dove sta wfrp4e-eis.journals.json
  });

  console.log("wfrp4e-eis | Traduzioni EIS registrate per lingua 'it'.");
});
