import { CriticalRubanBaseSystem } from "./base-system.js";

export class CriticalRubanSystemTest extends CriticalRubanBaseSystem {
  static systemId = "beryllium";

  extractBannerData(message) {

    if (!message?.isRoll || !message?.rolls?.length) return null;

    const roll = message.rolls[0];

    const isCritical = roll.terms[0].faces == 20;
    const isFumble = roll.terms[0].faces == 10;

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
        user?.color?.css ??
        user?.color?.toString?.() ??
        user?.color ??
        "#8b0000",
      effect: null
    };
  }
}