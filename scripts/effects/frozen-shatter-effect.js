console.log("critical-ruban | loading frozen-shatter-effect");
(() => {
  globalThis.CriticalRubanEffects.registerRubanEffect({
    id: EXIT_EFFECTS.FROZEN_SHATTER,
    types: ["fumble"],

    setup(banner) {
      banner.ensureCommonFxLayers();
      banner.ensureFrozenFxLayers();
    },

    onHold(banner, t, dtMS) {
      banner.frostLines.alpha = 0.10 + Math.sin(t * Math.PI) * 0.06;
      banner.flare.alpha = 0;
    },

    onPrepareExit(banner) {
      banner.prepareFrozenShatter();
    },

    onExit(banner, t, dtMS) {
      banner.updateFrozenShatterExitEffect(t, dtMS);
    },

    onDestroy(banner) {
      banner.cleanupFrozenShatter();
    }
  });
})();