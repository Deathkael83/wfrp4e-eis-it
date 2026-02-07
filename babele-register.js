Hooks.once("init", () => {
  const babeleModule = game.modules.get("babele");
  if (!babeleModule || !babeleModule.active) {
    console.error("wfrp4e-eis-it | Babele non è attivo: impossibile registrare la traduzione eis.");
    return;
  }

  if (typeof Babele === "undefined") {
    console.error("wfrp4e-eis-it | Oggetto globale Babele non trovato.");
    return;
  }

  Babele.get().register({
    module: "wfrp4e-eis-it", // modulo ORIGINALE
    lang: "it",
    dir: "translations"    // cartella dove sta wfrp4e-eis.journals.json
  });

  console.log("wfrp4e-eis-it | Traduzioni eis registrate per lingua 'it'.");
});