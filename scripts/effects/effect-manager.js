import { BaseRubanEffect } from "./base-effect.js";

export class EffectManager {
  constructor() {
    this.effects = new Map();
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
}

// Instance singleton
export const effectManager = new EffectManager();
export default effectManager;