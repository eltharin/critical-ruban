function registerSettings() {
  game.settings.register(MODULE_ID, "enableBanner", {
    name: game.i18n.localize("critical-ruban.settings.enableBanner.name"),
    hint: game.i18n.localize("critical-ruban.settings.enableBanner.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "enableSound", {
    name: game.i18n.localize("critical-ruban.settings.enableSound.name"),
    hint: game.i18n.localize("critical-ruban.settings.enableSound.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, "soundVolume", {
    name: game.i18n.localize("critical-ruban.settings.soundVolume.name"),
    hint: game.i18n.localize("critical-ruban.settings.soundVolume.hint"),
    scope: "client",
    config: true,
    type: Number,
    range: { min: 0, max: 100, step: 5 },
    default: 80
  });

  game.settings.register(MODULE_ID, "criticalSoundPath", {
    name: game.i18n.localize("critical-ruban.settings.criticalSoundPath.name"),
    hint: game.i18n.localize("critical-ruban.settings.criticalSoundPath.hint"),
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "",
    filePicker: "audio"
  });

  game.settings.register(MODULE_ID, "fumbleSoundPath", {
    name: game.i18n.localize("critical-ruban.settings.fumbleSoundPath.name"),
    hint: game.i18n.localize("critical-ruban.settings.fumbleSoundPath.hint"),
    scope: "world",
    config: true,
    restricted: true,
    type: String,
    default: "",
    filePicker: "audio"
  });

  game.settings.register(MODULE_ID, "criticalExitEffect", {
    name: game.i18n.localize("critical-ruban.settings.criticalExitEffect.name"),
    hint: game.i18n.localize("critical-ruban.settings.criticalExitEffect.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: globalThis.CriticalRubanEffects.getChoicesForType("critical"),
    default: DEFAULT_EFFECT_ID
  });

  game.settings.register(MODULE_ID, "fumbleExitEffect", {
    name: game.i18n.localize("critical-ruban.settings.fumbleExitEffect.name"),
    hint: game.i18n.localize("critical-ruban.settings.fumbleExitEffect.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: globalThis.CriticalRubanEffects.getChoicesForType("fumble"),
    default: DEFAULT_EFFECT_ID
  });

  game.settings.register(MODULE_ID, "bannerScale", {
    name: game.i18n.localize("critical-ruban.settings.bannerScale.name"),
    hint: game.i18n.localize("critical-ruban.settings.bannerScale.hint"),
    scope: "client",
    config: true,
    type: Number,
    range: { min: 50, max: 120, step: 5 },
    default: 100
  });

  game.settings.register(MODULE_ID, "bannerPosX", {
    scope: "client",
    config: false,
    type: Number,
    default: null
  });

  game.settings.register(MODULE_ID, "bannerPosY", {
    scope: "client",
    config: false,
    type: Number,
    default: null
  });

  game.settings.register(MODULE_ID, "useCustomPos", {
    name: game.i18n.localize("critical-ruban.settings.useCustomPos.name"),
    hint: game.i18n.localize("critical-ruban.settings.useCustomPos.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, "pickPositionButton", {
    name: game.i18n.localize("critical-ruban.settings.pickPosition.name"),
    hint: game.i18n.localize("critical-ruban.settings.pickPosition.hint"),
    scope: "client",
    config: true,
    type: Boolean,
    default: false,
    onChange: () => {}
  });
}

Hooks.on("renderSettingsConfig", (app, html) => {
  const settingInput = html.querySelector(`[name="${MODULE_ID}.pickPositionButton"]`);
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

    // ferme la fenêtre des settings avant le mode placement
    await app.close();

    // laisse le temps au DOM de se fermer proprement
    requestAnimationFrame(() => {
      openPixiBannerPositionPicker();
    });
  });

  settingInput.remove();

  const label = formGroup.querySelector("label");
  if (label) {
    label.insertAdjacentElement("afterend", button);
  } else {
    formGroup.appendChild(button);
  }
});