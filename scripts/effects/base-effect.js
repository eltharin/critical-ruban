
export class BaseRubanEffect {
  static effectId = null;
  static effectTypes = [];
  static labelKey = null;
  static startDelay = 3000;
  static totalDuration = 900;

  constructor() {
    this.id = this.constructor.effectId;
    this.types = this.constructor.effectTypes;
    this.labelKey = this.constructor.labelKey ?? `critical-ruban.settings.exitEffectChoices.${this.id}`;
    this.startDelay = this.constructor.startDelay;
    this.totalDuration = this.constructor.totalDuration;
  }

  setup(banner) {
    // Override in subclasses
  }

  onHold(banner, t, dtMS) {
    // Override in subclasses
  }

  onPrepareExit(banner) {
    // Override in subclasses
  }

  onExit(banner, t, dtMS) {
    // Override in subclasses - default behavior
    banner.updateCurrentExitBase(t);
  }

  onDestroy(banner) {
    // Override in subclasses
  }




  getTiming() {
    return {
      startDelay: this.startDelay,
      totalDuration: this.totalDuration
    };
  }
}