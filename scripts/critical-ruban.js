import { CriticalRubanUtils } from './critical-ruban-utils.js';
import { BannerManager } from "./critical-ruban-banner_manager.js";

import { CritBanner } from './critical-ruban-banner.js';
import { SettingsManager } from './critical-ruban-settings.js';
import { initCriticalRubanSystems, exposeCriticalRubanApi, registerNativeCriticalRubanSystems } from '../systems/system-registry.js';

import { effectManager } from "./effects/effect-manager.js";




// Import effects (they auto-register)
import {CurrentEffect} from './effects/current-effect.js';
import {FrozenShatterEffectLegacy} from './effects/frozen-shatter-effect.js';
import {SimpleFlashEffect} from './effects/simple-flash-effect.js';
import {DemonCrownShatterEffect} from './effects/demon-crown-shatter-effect.js';
import {MaddeningGripEffect} from './effects/maddening-grip-effect.js';
import {SnowVeilEffect} from './effects/snow-veil-effect.js';
import {VecnaEffect} from './effects/vecna-effect.js';
import {VecnaRunesEffect} from './effects/vecna-runes-effect.js';
import {VoidCrystalBloomEffect} from './effects/void-crystal-bloom-effect.js';
import {VoidCrystalEffect} from './effects/void-crystal-effect.js';
import {MyCustomEffect} from './effects/myCustomEffect.mjs';


class CriticalRuban {
  
  static criticalRubanApi = null;

  static bannerShown = new Set();
  static bannerPending = new Map();
  static bannerSlots = new Map();
  static bannerManager = null;

  static init() {
    initCriticalRubanSystems();
    this.criticalRubanApi = exposeCriticalRubanApi(CriticalRuban);
    registerNativeCriticalRubanSystems();

    effectManager.register(CurrentEffect);
    effectManager.register(FrozenShatterEffectLegacy);
    effectManager.register(SimpleFlashEffect);
    effectManager.register(DemonCrownShatterEffect);
    effectManager.register(MaddeningGripEffect);
    effectManager.register(SnowVeilEffect);
    effectManager.register(VecnaEffect);
    effectManager.register(VecnaRunesEffect);
    effectManager.register(VoidCrystalBloomEffect);
    effectManager.register(VoidCrystalEffect);
    effectManager.register(MyCustomEffect);
  }

  static ready() {
    SettingsManager.registerSettings();

    CriticalRuban.bannerShown ??= new Set();
    CriticalRuban.bannerPending ??= new Map();
    CriticalRuban.bannerSlots ??= new Map();
    CriticalRuban.bannerManager ??= null;

    Hooks.callAll("critical-ruban:registerSystems", this.criticalRubanApi);

    Hooks.on("renderChatMessageHTML", this.onRenderChatMessageHTML.bind(this));

    if (game.modules.get("dice-so-nice")?.active) {
      Hooks.on("diceSoNiceRollComplete", this.onDiceSoNiceRollComplete.bind(this));
    }
  }

  static onRenderChatMessageHTML(message) {
    try {
      if (!game.settings.get(CriticalRubanUtils.MODULE_ID, "enableBanner")) return;
      if (!message?.visible) return;

      const system = this.criticalRubanApi?.getSystem();
      if (!system) return;

      const bannerData = system.extractBannerData(message);
      if (!bannerData) return;
      if (CriticalRuban.bannerShown.has(message.id)) return;

      const payload = {
        messageId: message.id,
        rollId: bannerData.rollId ?? null,
        nom_pj: bannerData.nameActor ?? "Inconnu",
        couleur: bannerData.color ?? "#8b0000",
        type: bannerData.type ?? "critical",
        label: bannerData.label ?? null,
        effect: bannerData.effect ?? null
      };

      if (game.modules.get("dice-so-nice")?.active) {
        if (message.id) CriticalRuban.bannerPending.set(message.id, payload);
        if (payload.rollId) CriticalRuban.bannerPending.set(payload.rollId, payload);

        setTimeout(() => {
          const pending =
            CriticalRuban.bannerPending.get(message.id) ||
            CriticalRuban.bannerPending.get(payload.rollId);

          if (pending) this.consumePendingRuban(pending);
        }, 8000);

        return;
      }

      requestAnimationFrame(() => this.showRubanOnce(payload));
    } catch (err) {
      console.error(`${CriticalRubanUtils.MODULE_ID} | Error in renderChatMessageHTML:`, err);
    }
  }

  static onDiceSoNiceRollComplete(id) {
    try {
      const payload = CriticalRuban.bannerPending.get(id);
      if (!payload) return;
      this.consumePendingRuban(payload);
    } catch (err) {
      console.error(`${CriticalRubanUtils.MODULE_ID} | Error in diceSoNiceRollComplete:`, err);
    }
  }

  static consumePendingRuban(payload) {
    if (!payload) return;
    if (payload.messageId) CriticalRuban.bannerPending.delete(payload.messageId);
    if (payload.rollId) CriticalRuban.bannerPending.delete(payload.rollId);
    requestAnimationFrame(() => this.showRubanOnce(payload));
  }

  static showRubanOnce({ messageId, nom_pj, couleur, type, label, effect }) {
    if (messageId && CriticalRuban.bannerShown.has(messageId)) return;

    if (messageId) {
      CriticalRuban.bannerShown.add(messageId);
      setTimeout(() => CriticalRuban.bannerShown.delete(messageId), 10000);
    }

    this.showRollRuban(nom_pj, couleur, type, label, effect);
  }

  static showBannerManually({
    type = "critical",
    name = game.user?.character?.name || game.user?.name || "Inconnu",
    color = game.user?.color?.css ?? game.user?.color?.toString?.() ?? game.user?.color ?? "#8b0000"
  } = {}) {
    if (!game.settings.get(CriticalRubanUtils.MODULE_ID, "enableBanner")) return;

    if (type !== "critical" && type !== "fumble") type = "critical";
    requestAnimationFrame(() => this.showRollRuban(name, color, type));
  }

  static showRollRuban(nom_pj, couleur, type = "critical", label = null, effect = null) {
    const manager = BannerManager.getManager();
    if (!manager) {
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Unable to initialize PIXI BannerManager.`);
      return;
    }

    const slotIndex = CriticalRubanUtils.acquireBannerSlot();
    const banner = new CritBanner({
      slotIndex,
      type,
      label: label ?? (
        type === "fumble"
          ? game.i18n.localize("critical-ruban.ruban.label.criticalFailure")
          : game.i18n.localize("critical-ruban.ruban.label.criticalSuccess")
      ),
      name: nom_pj,
      color: couleur,
      exitEffect: effect ?? BannerManager.getExitEffect(type)
    });

    manager.addBanner(banner);
    CriticalRubanUtils.playRubanSound(type);
  }
}

// Initialize the module
Hooks.once("init", () => CriticalRuban.init());
Hooks.once("ready", () => CriticalRuban.ready());

