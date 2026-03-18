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
    choices: getExitEffectChoices("critical"),
    default: EXIT_EFFECTS.CURRENT
  });

  game.settings.register(MODULE_ID, "fumbleExitEffect", {
    name: game.i18n.localize("critical-ruban.settings.fumbleExitEffect.name"),
    hint: game.i18n.localize("critical-ruban.settings.fumbleExitEffect.hint"),
    scope: "client",
    config: true,
    type: String,
    choices: getExitEffectChoices("fumble"),
    default: EXIT_EFFECTS.CURRENT
  });
}