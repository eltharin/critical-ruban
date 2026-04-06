import { CriticalRubanUtils } from "./critical-ruban-utils.js";
import { BannerManager } from "./critical-ruban-banner_manager.js";
import { CritBanner } from './critical-ruban-banner.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class BannerPositionPicker extends HandlebarsApplicationMixin(ApplicationV2) {

  currentBannerPositionPreview = null;

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
      template: `modules/${CriticalRubanUtils.MODULE_ID}/templates/banner-position-picker.hbs`
    }
  };

  async _prepareContext() {
    
    return {
      data: this.getData()
    };
  }

  getData() {
    return game.settings.get(CriticalRubanUtils.MODULE_ID, "customPosition");
  }

  static async onPick(event, target) {
    event.preventDefault();
    
    await this.close();
    await this.openPixiBannerPositionPicker();
  }

  static async onReset(event, target) {
    event.preventDefault();

    this.destroyBannerPositionPreview();

    await game.settings.set(CriticalRubanUtils.MODULE_ID, "customPosition", {
      isCustomPos: false,
      bannerPosX: null,
      bannerPosY: null
    });

    ui.notifications.info(
      game.i18n.localize("critical-ruban.positionPicker.resetNotification")
    );

    const app = target.closest(".application")?.app ?? null;
    if (app) app.render(true);
  }

  async close(options) {
    this.destroyBannerPositionPreview();
    return super.close(options);
  }


  









  async openPixiBannerPositionPicker() {
    this.destroyBannerPositionPreview();

    const manager = BannerManager.getManager();
    if (!manager) {
      ui.notifications.error(
        game.i18n.localize("critical-ruban.positionPicker.managerError")
      );
      return;
    }

    const previews = CriticalRubanUtils.BANNER_SLOTS.map((slot, index) => {
    const preview = new CritBanner({
        slotIndex: index,
        type: index === 0 ? "critical" : "fumble",
        label: index === 0
          ? game.i18n.localize("critical-ruban.ruban.label.criticalSuccess")
          : game.i18n.localize("critical-ruban.ruban.label.criticalFailure"),
        name: `${game.i18n.localize("critical-ruban.positionPicker.previewName")} ${index + 1}`,
        color: game.user?.color?.css ?? game.user?.color?.toString?.() ?? game.user?.color ?? "#8b0000",
        exitEffect: CriticalRubanUtils.DEFAULT_EFFECT_ID
      });

      preview.isPreview = true;
      preview.state = "hold";
      preview.stateTime = 0;
      preview.elapsed = 0;
      preview.enterDuration = 0;
      preview.holdDuration = Number.MAX_SAFE_INTEGER;
      preview.exitDuration = 0;
      preview.done = false;

      manager.addBanner(preview);
      return preview;
    });

    const screen = canvas?.app?.renderer?.screen ?? {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const { savedX = 0, savedY = 0 } = this.getData() ?? {};

    const state = {
      x: savedX ?? 0.5,
      y: savedY ?? 0.5
    };

    for (const preview of previews) {
      preview.root.alpha = 1;
      preview.motion.rotation = preview.baseRotation;
      preview.motion.scale.set(preview.baseScale);
    }

    const hiddenWindows = this.hideFoundryWindowsForBannerPlacement();

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "999999";
    overlay.style.cursor = "crosshair";
    overlay.style.background = "transparent";
    overlay.style.pointerEvents = "auto";

    const help = document.createElement("div");
    help.textContent = game.i18n.localize("critical-ruban.positionPicker.help");
    help.style.position = "fixed";
    help.style.left = "50%";
    help.style.top = "20px";
    help.style.transform = "translateX(-50%)";
    help.style.padding = "10px 14px";
    help.style.borderRadius = "10px";
    help.style.background = "rgba(0, 0, 0, 0.78)";
    help.style.color = "white";
    help.style.fontSize = "14px";
    help.style.lineHeight = "1.2";
    help.style.pointerEvents = "none";
    help.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)";

    overlay.appendChild(help);
    document.body.appendChild(overlay);

    function clampPreview(v) {
      return Math.max(0, Math.min(1, v));
    }

    function updatePreviewFromClient(clientX, clientY) {
      state.x = clampPreview(clientX / window.innerWidth);
      state.y = clampPreview(clientY / window.innerHeight);

      const anchorX = screen.width * state.x;
      const anchorY = screen.height * state.y;
      const userScale = (game.settings.get(CriticalRubanUtils.MODULE_ID, "bannerScale") ?? 100) / 100;

      for (let i = 0; i < previews.length; i++) {
        const preview = previews[i];
        const slot = CriticalRubanUtils.BANNER_SLOTS[i] ?? CriticalRubanUtils.BANNER_SLOTS[0];

        const offsetX = (slot.x - 0.5) * screen.width * userScale;
        const offsetY = (slot.y - 0.5) * screen.height * userScale;

        preview.baseX = anchorX + offsetX;
        preview.baseY = anchorY + offsetY;
        preview.root.position.set(preview.baseX, preview.baseY);
      }
    }
      const onPointerMove = (ev) => {
      updatePreviewFromClient(ev.clientX, ev.clientY);
    };

    const onClick = async (ev) => {
      updatePreviewFromClient(ev.clientX, ev.clientY);

      await game.settings.set(CriticalRubanUtils.MODULE_ID, "customPosition", {
        isCustomPos: true,
        bannerPosX: state.x,
        bannerPosY: state.y
      });

      this.destroyBannerPositionPreview();

      ui.notifications.info(
        game.i18n.localize("critical-ruban.positionPicker.saveNotification")
      );

      setTimeout(() => game.settings.sheet.render(true), 0);
    };

    const onKeyDown = async (ev) => {
      if (ev.key !== "Escape") return;

      this.destroyBannerPositionPreview();

      ui.notifications.info(
        game.i18n.localize("critical-ruban.positionPicker.cancelNotification")
      );

      setTimeout(() => game.settings.sheet.render(true), 0);
    };

    overlay.addEventListener("pointermove", onPointerMove);
    overlay.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown, true);

    this.currentBannerPositionPreview = {
      manager,
      banners: previews,
      overlay,
      hiddenWindows,
      cleanup: () => {
        overlay.removeEventListener("pointermove", onPointerMove);
        overlay.removeEventListener("click", onClick);
        window.removeEventListener("keydown", onKeyDown, true);
      }
    };

    ui.notifications.info(
      game.i18n.localize("critical-ruban.positionPicker.help")
    );
  }

  hideFoundryWindowsForBannerPlacement() {
    const hidden = [];

    for (const [key, app] of [...foundry.applications.instances]) {
      hidden.push({
        element : app.element,
        zindex: app.element.style.zIndex,
      });
      
      app.element.style.zIndex = -1;
    }
  
    return hidden;
  }


  restoreFoundryWindowsForBannerPlacement(hiddenAppIds = []) {
    for (const app of hiddenAppIds) {
      app.element.style.zIndex = app.zindex;
    }
  }

  destroyBannerPositionPreview() {
    const preview = this.currentBannerPositionPreview;
    if (!preview) return;

    try {
      preview.cleanup?.();
    } catch (err) {
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur cleanup preview :`, err);
    }

    try {
      if (preview.manager && Array.isArray(preview.banners)) {
        for (const banner of preview.banners) {
          preview.manager.removeBanner(banner);
        }
      }
    } catch (err) {
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur suppression ruban preview :`, err);
    }

    try {
      if (preview.overlay?.parentNode) {
        preview.overlay.parentNode.removeChild(preview.overlay);
      }
    } catch (err) {
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur suppression overlay preview :`, err);
    }

    try {
      this.restoreFoundryWindowsForBannerPlacement(preview.hiddenWindows ?? []);
    } catch (err) {
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur restauration fenêtres :`, err);
    }

    this.currentBannerPositionPreview = null;
  }
}
