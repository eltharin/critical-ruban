(() => {
  globalThis.CriticalRubanEffects.registerRubanEffect({
    id: DEFAULT_EFFECT_ID,
    types: ["critical", "fumble"],

    setup(banner) {
      banner.ensureCommonFxLayers();
    },

    onHold(banner, t, dtMS) {},

    onPrepareExit(banner) {
      banner.resetVisualState();
    },

    onExit(banner, t, dtMS) {
      banner.updateCurrentExitBase(t);
    },

    onDestroy(banner) {}
  });
})();