import { CriticalRubanBaseSystem } from "./base-system.js";
import { CriticalRubanSystemDnd5e } from "./dnd5e-system.js";
import { CriticalRubanSystemTest } from "./test-system.js";

export class SystemRegistry {
  constructor() {
    this.registry = new Map();
  }

  register(SystemClass) {
    if (typeof SystemClass !== "function") {
      throw new Error("Critical Ruban | registerSystem attend une classe.");
    }

    const systemId = SystemClass.systemId;
    if (!systemId || typeof systemId !== "string") {
      throw new Error("Critical Ruban | La classe système doit définir static systemId.");
    }

    if (!(SystemClass.prototype instanceof CriticalRubanBaseSystem)) {
      throw new Error(`Critical Ruban | "${systemId}" doit étendre CriticalRubanBaseSystem.`);
    }

    this.registry.set(systemId, SystemClass);
  }

  unregister(systemId) {
    this.registry.delete(systemId);
  }

  get(systemId = game.system.id) {
    const SystemClass = this.registry.get(systemId);
    return SystemClass ? new SystemClass() : null;
  }

  has(systemId = game.system.id) {
    return this.registry.has(systemId);
  }

  list() {
    return Array.from(this.registry.keys());
  }
}

let criticalRubanSystemRegistry = null;

export function initCriticalRubanSystems() {
  if (criticalRubanSystemRegistry) return;
  criticalRubanSystemRegistry = new SystemRegistry();
}

export function exposeCriticalRubanApi(criticalRuban) {
  if (!criticalRuban) {
    throw new Error("Critical Ruban | exposeCriticalRubanApi requires the CriticalRuban class reference.");
  }

  const api = {
    show: (options) => criticalRuban.showBannerManually(options),
    showCritical: (name, color) => criticalRuban.showBannerManually({ type: "critical", name, color }),
    showFumble: (name, color) => criticalRuban.showBannerManually({ type: "fumble", name, color }),

    BaseSystem: CriticalRubanBaseSystem,

    registerSystem: (SystemClass) => criticalRubanSystemRegistry.register(SystemClass),
    unregisterSystem: (systemId) => criticalRubanSystemRegistry.unregister(systemId),
    getSystem: () => criticalRubanSystemRegistry.get(),
    hasSystem: (systemId) => criticalRubanSystemRegistry.has(systemId),
    listSystems: () => criticalRubanSystemRegistry.list()
  };

  return api;
}

export function registerNativeCriticalRubanSystems() {
  if (!criticalRubanSystemRegistry) {
    initCriticalRubanSystems();
  }

  criticalRubanSystemRegistry.register(CriticalRubanSystemDnd5e);
  //criticalRubanSystemRegistry.register(CriticalRubanSystemTest); //-- permet de tester les bannières avec un système ultra simple (1d20 = critique, 1d10 = échec critique)
}