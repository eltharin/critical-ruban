class CriticalRubanSystemDnd5e extends globalThis.CriticalRubanBaseSystem {
  static systemId = "dnd5e";

  extractBannerData(message) {
    if (!message?.isRoll || !message?.rolls?.length) return null;

    const roll = message.rolls[0];
    const d20Term = roll?.terms?.find((t) => t?.faces === 20);
    if (!d20Term) return null;

    const isCritical = roll?.isCritical === true;
    const isFumble = roll?.isFumble === true;

    if (!isCritical && !isFumble) return null;

    const type = isCritical ? "critical" : "fumble";
    const user = message.author;

    return {
      rollId: roll.id,
      type,
      label: type === "fumble"
        ? game.i18n.localize("critical-ruban.ruban.label.criticalFailure")
        : game.i18n.localize("critical-ruban.ruban.label.criticalSuccess"),
      nameActor: message.speaker?.alias || game.user?.name || "Inconnu",
      color:
        user?.color?.css ??        user?.color?.toString?.() ??
        user?.color ??
        "#8b0000",
      effect: null
    };
  }
}

function registerNativeCriticalRubanSystems() {
  globalThis.CriticalRubanSystemRegistry.register(CriticalRubanSystemDnd5e);
}