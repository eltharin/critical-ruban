export class CriticalRubanBaseSystem {
  static systemId = null;

  static isEnabled() {
    return this.systemId == game.settings.get(CriticalRubanUtils.MODULE_ID, "activeSystem");
  }

  extractBannerData(message) {
    return null;
  }
}

/*
Hooks.on("critical-ruban:registerSystems", (api) => {
  class CriticalRubanSystemMyGame extends api.BaseSystem {
    static systemId = "mygame";

    extractBannerData(message) {
      if (!message) return null;

      // 1. Vérifier que c’est un message géré
      // 2. Lire la structure du jet du système
      // 3. Déterminer critique ou fumble
      // 4. Retourner un objet normalisé
      Si critique :
        return {
          rollId: string | null,
          type: "critical" | "fumble",
          label: string | null,
          nameActor: string,
          color: string,
          effect: string | null
        };
      Sinon return null;
    }
  }

  api.registerSystem(CriticalRubanSystemMyGame);
});
*/