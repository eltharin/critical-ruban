import { BaseRubanEffect } from "./base-effect.js";

export class EffectManager {
  constructor() {
    this.effects = new Map();
    this.registerDefaultEffects();
  }

  register(effectClass) {
    if (!(effectClass.prototype instanceof BaseRubanEffect)) {
      throw new Error("Effect must extend BaseRubanEffect");
    }

    const instance = new effectClass();
    this.effects.set(instance.id, instance);
    return this;
  }

  get(id) {
    return this.effects.get(id) ?? this.effects.get("current");
  }

  getAll() {
    return Array.from(this.effects.values());
  }

  getForType(type) {
    return this.getAll().filter(effect => effect.types.includes(type));
  }

  getChoicesForType(type) {
    return this.getForType(type).reduce((acc, effect) => {
      acc[effect.id] = game.i18n.localize(effect.labelKey);
      return acc;
    }, {});
  }

  validateForType(type, requestedId) {
    const effects = this.getForType(type);
    return effects.some(effect => effect.id === requestedId) ? requestedId : "current";
  }

  registerLegacy(effectConfig) {
    const { id, types, startDelay = 3000, totalDuration = 900, setup, onHold, onPrepareExit, onExit, onDestroy } = effectConfig;

    class LegacyEffect extends BaseRubanEffect {
      static effectId = id;
      static effectTypes = types;
      static startDelay = startDelay;
      static totalDuration = totalDuration;

      setup(banner) {
        if (setup) setup(banner);
      }

      onHold(banner, t, dtMS) {
        if (onHold) onHold(banner, t, dtMS);
      }

      onPrepareExit(banner) {
        if (onPrepareExit) onPrepareExit(banner);
      }

      onExit(banner, t, dtMS) {
        if (onExit) onExit(banner, t, dtMS);
        else super.onExit(banner, t, dtMS);
      }

      onDestroy(banner) {
        if (onDestroy) onDestroy(banner);
      }
    }

    return this.register(LegacyEffect);
  }

  registerDefaultEffects() {
    // Les effets par défaut seront enregistrés via les imports
  }
}

// Instance singleton
export const effectManager = new EffectManager();
export default effectManager;