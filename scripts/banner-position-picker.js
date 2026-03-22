const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class BannerPositionPicker extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "critical-ruban-position-picker",
    tag: "form",
    window: {
      title: "critical-ruban.positionPicker.title"
    },
    position: {
      width: 430
    },
    actions: {
      pick: BannerPositionPicker.onPick,
      reset: BannerPositionPicker.onReset
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/banner-position-picker.hbs`
    }
  };

  async _prepareContext() {
    return {
      useCustomPos: game.settings.get(MODULE_ID, "useCustomPos") ?? false
    };
  }

  static async onPick(event, target) {
    event.preventDefault();
    const app = target.closest(".application")?.app ?? null;
    if (app) await app.close();
    await openPixiBannerPositionPicker();
  }

  static async onReset(event, target) {
    event.preventDefault();

    destroyBannerPositionPreview();

    await game.settings.set(MODULE_ID, "bannerPosX", null);
    await game.settings.set(MODULE_ID, "bannerPosY", null);
    await game.settings.set(MODULE_ID, "useCustomPos", false);

    ui.notifications.info(
      game.i18n.localize("critical-ruban.positionPicker.resetNotification")
    );

    const app = target.closest(".application")?.app ?? null;
    if (app) app.render(true);
  }

  async close(options) {
    destroyBannerPositionPreview();
    return super.close(options);
  }
}

globalThis.BannerPositionPicker = BannerPositionPicker;