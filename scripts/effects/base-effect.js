
import { CriticalRubanUtils } from "../critical-ruban-utils.js";


export class BaseRubanEffect {
  static effectId = null;
  static effectTypes = [];
  static labelKey = null;

  constructor() {
    this.id = this.constructor.effectId;
    this.types = this.constructor.effectTypes;
    this.labelKey = this.constructor.labelKey ?? `critical-ruban.settings.exitEffectChoices.${this.id}`;
  }

  getEnterDuration(type) {
    return type == "fumble" ? 480 : 320;
  }
   
  getHoldDuration(type) {
    return 3000;
  }
  
  getExitDuration(type) {
    return 900;
  }

  setup(banner) {
    // Override in subclasses
  }

  onEnter(banner, t, dtMS) {
    const e       = banner.isType("fumble") ? CriticalRubanUtils.easeOutBackSoft(t) : CriticalRubanUtils.easeOutCubic(t);
    const offsetX = CriticalRubanUtils.lerp(banner.isType("fumble") ? -145 : -120, 0, e);
    const offsetY = CriticalRubanUtils.lerp(banner.isType("fumble") ? 6 : -8, 0, e);
    const scale   = CriticalRubanUtils.lerp(banner.isType("fumble") ? 0.88 : 0.9, 1, e);
    const alpha   = CriticalRubanUtils.lerp(0, 1, CriticalRubanUtils.easeOutCubic(t));
    const rot     = banner.baseRotation + CriticalRubanUtils.lerp(banner.isType("fumble") ? -0.025 : -0.015, 0, e);
    const shake   = banner.isType("fumble") ? Math.sin(t * Math.PI * 7) * (1 - t) * 8 : 0;

    banner.root.position.set(banner.baseX + offsetX + shake, banner.baseY + offsetY);
    banner.motion.scale.set(banner.baseScale * scale);
    banner.motion.rotation = rot;
    banner.root.alpha = alpha;
    
    banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.2, 0.55, t);
    banner.shine.alpha = Math.sin(t * Math.PI) * 0.18;
    banner.shine.x = CriticalRubanUtils.lerp(-50, 14, t);

  }

  //-- fonction executée à chaque frame pendant le maintien du ruban
  onHold(banner, t, dtMS) {
    const bob = Math.sin((banner.elapsed / 1000) * 2.6 + banner.floatSeed) * 1.2;
    const glow = 0.48 + Math.sin((banner.elapsed / 1000) * 4.8 + banner.floatSeed) * 0.08;
    const shinePulse = ((banner.elapsed / 1000) + banner.shineSeed) % 1.85;
    const shineT = CriticalRubanUtils.clamp01((shinePulse - 0.15) / 0.55);

    banner.root.position.set(banner.baseX, banner.baseY + bob);
    banner.root.alpha = 1;
    banner.motion.scale.set(banner.baseScale);
    banner.motion.rotation = banner.baseRotation + (banner.isType("fumble") ? Math.sin((banner.elapsed / 1000) * 6.2) * 0.004 : 0);

    banner.innerGlow.alpha = glow;
    banner.shine.alpha = shinePulse > 0.15 && shinePulse < 0.70 ? Math.sin(shineT * Math.PI) * 0.30 : 0;
    banner.shine.x = CriticalRubanUtils.lerp(-banner.mainWidth * 0.7, banner.mainWidth * 0.7, CriticalRubanUtils.easeInOutQuad(shineT));

    banner.motion.tint = 0xffffff;
  }

  //-- fonction executée une fois avant le début de la phase de sortie
  onPrepareExit(banner) {
    // Override in subclasses
  }

  //-- fonction exécutée à chaque frame pendant la phase de sortie
  onExit(banner, t, dtMS) {
    // Override in subclasses - default behavior
    this.fadeOutAndMoveRight(banner,t);
  }

  onDestroy(banner) {
    // Override in subclasses
  }



  fadeOutAndMoveRight(banner, t) {
    const e = CriticalRubanUtils.easeInCubic(t);
    banner.root.alpha = 1 - e;
    banner.root.position.set(banner.baseX + CriticalRubanUtils.lerp(0, 40, e), banner.baseY + CriticalRubanUtils.lerp(0, -10, e));
    banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.04, e));
    banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(0, banner.isType("fumble") ? -0.03 : 0.02, e);
    banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.5, 0.15, e);
    banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0, 0.3);
  }
}