import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";
import { effectManager } from "./effect-manager.js";

export class CurrentEffect extends BaseRubanEffect {
  static effectId = CriticalRubanUtils.DEFAULT_EFFECT_ID;
  static effectTypes = ["critical", "fumble"];



  onPrepareExit(banner) {
    banner.resetVisualState();
  }

}
