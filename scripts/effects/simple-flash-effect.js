import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";


/**
 * Exemple d'effet personnalisé - Flash simple
 * Cet effet peut servir de modèle pour créer de nouveaux effets
 */
export class SimpleFlashEffect extends BaseRubanEffect {
  static effectId = "simpleFlash";
  static effectTypes = ["critical", "fumble"];
  static labelKey = "critical-ruban.settings.exitEffectChoices.simpleFlash";
  
  getHoldDuration(type) {
    return 2500;
  }
  
  getExitDuration(type) {
    return 800;
  }

  setup(banner) {
    // Créer un calque de flash blanc
    const flash = new PIXI.Graphics();
    CriticalRubanUtils.gRoundRect(flash, -banner.mainWidth / 2, -banner.height / 2, banner.mainWidth, banner.height, 8, CriticalRubanUtils.COLORS.white, 0.0);

    banner.addEffectLayer("flash", flash, { parent: "bodyGroup", alpha: 0 });
  }

  onHold(banner, t, dtMS) {
    // Effet subtil pendant la phase de maintien
    const flash = banner.getEffectLayer("flash");
    if (flash) {
      flash.alpha = 0.05 + Math.sin(t * Math.PI * 2) * 0.02;
    }
  }

  onPrepareExit(banner) {
    banner.resetVisualState();
  }

  onExit(banner, t, dtMS) {
    const progress = CriticalRubanUtils.easeInOutQuad(t);

    const flash = banner.getEffectLayer("flash");
    if (flash) {
      // Flash qui apparaît puis disparaît
      if (progress < 0.5) {
        flash.alpha = progress * 2; // Montée
      } else {
        flash.alpha = (1 - progress) * 2; // Descente
      }
    }

    // Fait disparaître le banner principal
    banner.bodyGroup.alpha = Math.max(0, 1 - progress);
  }

  onDestroy(banner) {
    // Nettoyage si nécessaire
  }
}
