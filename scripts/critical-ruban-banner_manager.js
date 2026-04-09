
import { CriticalRubanUtils } from "./critical-ruban-utils.js";



export class BannerManager {
  static instance = null;

  static getExitEffect(type) {
    return game.settings.get(CriticalRubanUtils.MODULE_ID, type === "fumble" ? "fumbleExitEffect" : "criticalExitEffect");
  }

  static getManager() {
    if (BannerManager.instance?.isAlive()) return BannerManager.instance;
    BannerManager.instance = new BannerManager();
    return BannerManager.instance;
  }

  constructor() {
    this.parent = canvas?.overlay ?? canvas?.interface ?? canvas?.stage ?? canvas?.app?.stage ?? null;
    this.ticker = canvas?.app?.ticker ?? PIXI?.Ticker?.shared ?? null;
    this.root = new PIXI.Container();
    this.root.sortableChildren = true;
    this.root.eventMode = "none";
    this.root.interactiveChildren = false;
    this.root.zIndex = 999999;
    this.banners = new Set();
    this._boundTick = this._tick.bind(this);

    if (!this.parent || !this.ticker) {
      console.error(`${CriticalRubanUtils.MODULE_ID} | Canvas overlay/ticker introuvable.`);
      return;
    }

    this.parent.addChild(this.root);
    this.ticker.add(this._boundTick);
  }

  isAlive() {
    return !!this.root && !this.root.destroyed && !!this.parent && !!this.ticker;
  }

  addBanner(banner) {
    this.banners.add(banner);
    this.root.addChild(banner.root);
    banner.attach(this);
  }

  removeBanner(banner) {
    if (!this.banners.has(banner)) return;
    this.banners.delete(banner);
    banner.destroy();
    CriticalRubanUtils.releaseBannerSlot(banner.slotIndex);
  }

  _tick() {
    const dtMS = typeof this.ticker?.deltaMS === "number" ? this.ticker.deltaMS : 1000 / 60;

    for (const banner of [...this.banners]) {
      try {
        banner.update(dtMS);
        if (banner.done) this.removeBanner(banner);
      } catch (err) {
        console.error(`${CriticalRubanUtils.MODULE_ID} | Erreur animation ruban :`, err);
        this.removeBanner(banner);
      }
    }
  }
}