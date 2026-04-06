import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";
import { effectManager } from "./effect-manager.js";

export class CurrentEffect extends BaseRubanEffect {
  static effectId = CriticalRubanUtils.DEFAULT_EFFECT_ID;
  static effectTypes = ["critical", "fumble"];

  setup(banner) {
    banner.ensureCommonFxLayers();
  }

  onHold(banner, t, dtMS) {
    // No special behavior during hold
  }

  onPrepareExit(banner) {
    banner.resetVisualState();
  }

  onExit(banner, t, dtMS) {
    banner.updateCurrentExitBase(t);
  }

  onDestroy(banner) {
    // No cleanup needed
  }
}
