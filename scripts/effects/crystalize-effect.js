console.log("critical-ruban | loading crystalize-effect");
(() => {
  globalThis.CriticalRubanEffects.registerRubanEffect({
    id: EXIT_EFFECTS.CRYSTALIZE,
    types: ["critical"],

    setup(banner) {
      banner.ensureCommonFxLayers();
      banner.ensureCrystalFxLayers();
    },

    onHold(banner, t, dtMS) {
      banner.updateCrystalizeHoldEffect(t, dtMS);
    },

    onPrepareExit(banner) {
      banner.prepareCrystalize();
    },

    onExit(banner, t, dtMS) {
      banner.updateCrystalizeExitEffect(t, dtMS);
    },

    onDestroy(banner) {
      banner.cleanupCrystalize();
    }
  });
})();