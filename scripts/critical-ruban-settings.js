import { effectManager } from "./effects/effect-manager.js";
import { CriticalRubanUtils } from "./critical-ruban-utils.js";
import { BannerPositionPicker } from "./banner-position-picker.js";


export class SettingsManager {
  static registerSettings() {
    game.settings.register(CriticalRubanUtils.MODULE_ID, "enableBanner", {
      name: game.i18n.localize("critical-ruban.settings.enableBanner.name"),
      hint: game.i18n.localize("critical-ruban.settings.enableBanner.hint"),
      scope: "client",
      config: true,
      type: Boolean,
      default: true
    });

    game.settings.register(CriticalRubanUtils.MODULE_ID, "enableSound", {
      name: game.i18n.localize("critical-ruban.settings.enableSound.name"),
      hint: game.i18n.localize("critical-ruban.settings.enableSound.hint"),
      scope: "client",
      config: true,
      type: Boolean,
      default: true
    });

    game.settings.register(CriticalRubanUtils.MODULE_ID, "soundVolume", {
      name: game.i18n.localize("critical-ruban.settings.soundVolume.name"),
      hint: game.i18n.localize("critical-ruban.settings.soundVolume.hint"),
      scope: "client",
      config: true,
      type: Number,
      range: { min: 0, max: 100, step: 5 },
      default: 80
    });

    game.settings.register(CriticalRubanUtils.MODULE_ID, "criticalSoundPath", {
      name: game.i18n.localize("critical-ruban.settings.criticalSoundPath.name"),
      hint: game.i18n.localize("critical-ruban.settings.criticalSoundPath.hint"),
      scope: "world",
      config: true,
      restricted: true,
      type: String,
      default: "",
      filePicker: "audio"
    });

    game.settings.register(CriticalRubanUtils.MODULE_ID, "fumbleSoundPath", {
      name: game.i18n.localize("critical-ruban.settings.fumbleSoundPath.name"),
      hint: game.i18n.localize("critical-ruban.settings.fumbleSoundPath.hint"),
      scope: "world",
      config: true,
      restricted: true,
      type: String,
      default: "",
      filePicker: "audio"
    });

    game.settings.register(CriticalRubanUtils.MODULE_ID, "criticalExitEffect", {
      name: game.i18n.localize("critical-ruban.settings.criticalExitEffect.name"),
      hint: game.i18n.localize("critical-ruban.settings.criticalExitEffect.hint"),
      scope: "world",
      config: true,
      restricted: true,
      type: String,
      choices: effectManager.getChoicesForType("critical"),
      default: CriticalRubanUtils.DEFAULT_EFFECT_ID
    });

    game.settings.register(CriticalRubanUtils.MODULE_ID, "fumbleExitEffect", {
      name: game.i18n.localize("critical-ruban.settings.fumbleExitEffect.name"),
      hint: game.i18n.localize("critical-ruban.settings.fumbleExitEffect.hint"),
      scope: "world",
      config: true,
      restricted: true,
      type: String,
      choices: effectManager.getChoicesForType("fumble"),
      default: CriticalRubanUtils.DEFAULT_EFFECT_ID
    });

    game.settings.register(CriticalRubanUtils.MODULE_ID, "bannerScale", {
      name: game.i18n.localize("critical-ruban.settings.bannerScale.name"),
      hint: game.i18n.localize("critical-ruban.settings.bannerScale.hint"),
      scope: "client",
      config: true,
      type: Number,
      range: { min: 50, max: 120, step: 5 },
      default: 100
    });


    game.settings.register(CriticalRubanUtils.MODULE_ID, "customPosition", {
      name: game.i18n.localize("critical-ruban.settings.useCustomPos.name"),
      hint: game.i18n.localize("critical-ruban.settings.useCustomPos.hint"),
      scope: "client",
      config: false,
      type: Object,
      default: false
    });

    game.settings.registerMenu(CriticalRubanUtils.MODULE_ID, "customPosition", {
      name: game.i18n.localize("critical-ruban.settings.pickPosition.name"),
      label: game.i18n.localize("critical-ruban.settings.pickPosition.name"),
      hint: game.i18n.localize("critical-ruban.settings.pickPosition.hint"),
      scope: "client",
      type: BannerPositionPicker,
      restricted: true,
    });
  }
  /*
  Hooks.on("renderSettingsConfig", (app, html) => {
    const settingInput = html.querySelector(`[name="${CriticalRubanUtils.MODULE_ID}.pickPositionButton"]`);
    if (!settingInput) return;

    const formGroup = settingInput.closest(".form-group");
    if (!formGroup) return;

    const existingButton = formGroup.querySelector(".crit-ruban-pick-btn");
    if (existingButton) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "crit-ruban-pick-btn";
    button.innerHTML = `
      <i class="fas fa-crosshairs"></i>
      ${game.i18n.localize("critical-ruban.settings.pickPosition.label")}
    `;

    button.addEventListener("click", async (event) => {
      event.preventDefault();

      await app.close();

      requestAnimationFrame(() => {
        openPixiBannerPositionPicker();
      });
    });

    const label = formGroup.querySelector("label");
    if (label) {
      label.insertAdjacentElement("afterend", button);
    } else {
      formGroup.appendChild(button);
    }
  });*/
}


