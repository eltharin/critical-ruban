console.log("critical-ruban | loading current-effect");
(() => {
  globalThis.CriticalRubanEffects.registerRubanEffect({
    id: EXIT_EFFECTS.CURRENT,
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