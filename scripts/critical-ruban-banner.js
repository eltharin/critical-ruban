function getExitEffect(type) {
  return game.settings.get(MODULE_ID, type === "fumble" ? "fumbleExitEffect" : "criticalExitEffect");
}

function getBannerManager() {
  if (globalThis.__critBannerManager?.isAlive()) return globalThis.__critBannerManager;
  globalThis.__critBannerManager = new BannerManager();
  return globalThis.__critBannerManager;
}

class BannerManager {
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
      console.error(`${MODULE_ID} | Canvas overlay/ticker introuvable.`);
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
    releaseBannerSlot(banner.slotIndex);
  }

  _tick(ticker) {
    const dtMS = typeof ticker?.deltaMS === "number" ? ticker.deltaMS : (1000 / 60);

    for (const banner of [...this.banners]) {
      try {
        banner.update(dtMS);
        if (banner.done) this.removeBanner(banner);
      } catch (err) {
        console.error(`${MODULE_ID} | Erreur animation ruban :`, err);
        this.removeBanner(banner);
      }
    }
  }
}

class CritBanner {
  constructor({ slotIndex, type, label, name, color, exitEffect }) {
    this.slotIndex = slotIndex;
    this.type = type;
    this.label = `${label} : ${name}`;
    this.kind = type === "fumble" ? "fumble" : "critical";
    this.isFumble = this.kind === "fumble";
    this.exitEffect = getValidatedExitEffect(this.kind, exitEffect);
    this.effect = globalThis.CriticalRubanEffects.getRubanEffect(this.exitEffect);

    this.baseColorHex = cssToHex(normalizeHexColor(color) ?? "#8b0000");
    this.mainColor = this.isFumble ? mixHex(this.baseColorHex, COLORS.red, 0.35) : this.baseColorHex;
    this.darkColor = darkenHex(this.mainColor, 0.28);
    this.darkerColor = darkenHex(this.mainColor, 0.45);
    this.lightColor = lightenHex(this.mainColor, 0.20);
    this.accentColor = this.isFumble ? COLORS.red : COLORS.gold;
    this.accentBright = this.isFumble ? COLORS.redBright : COLORS.goldBright;
    this.effectAccent = this.isFumble ? COLORS.ember : COLORS.ice;

    this.enterDuration = this.isFumble ? 480 : 320;
    this.holdDuration = EXIT_TIMINGS[this.exitEffect]?.startDelay ?? 3000;
    this.exitDuration = EXIT_TIMINGS[this.exitEffect]?.totalDuration ?? 900;

    this.state = "enter";
    this.stateTime = 0;
    this.elapsed = 0;
    this.lastDtMS = 16.67;
    this.done = false;

    this.particles = [];
    this.shards = [];
    this.floatSeed = Math.random() * Math.PI * 2;
    this.shineSeed = Math.random() * 2;

    this.freezeOverlay = null;
    this.crackLines = null;
    this.shatterFlash = null;
    this.crystalOverlay = null;
    this.crystalSparkle = null;

    this.shatterPrepared = false;
    this.shatterStarted = false;
    this.shatterSnapshot = null;
    this.shatterSourceBounds = null;

    this.root = new PIXI.Container();
    this.root.sortableChildren = true;
    this.root.eventMode = "none";
    this.root.interactiveChildren = false;
    this.root.alpha = 0.01;

    this.motion = new PIXI.Container();
    this.motion.sortableChildren = true;
    this.root.addChild(this.motion);

    this.fx = new PIXI.Container();
    this.fx.zIndex = 30;
    this.motion.addChild(this.fx);

    this.bodyGroup = new PIXI.Container();
    this.bodyGroup.sortableChildren = true;
    this.bodyGroup.zIndex = 10;
    this.motion.addChild(this.bodyGroup);

    this.measure();
    this.buildDisplay();
    this.applySlot();
    this.effect.setup?.(this);
  }

  attach(manager) {
    this.manager = manager;
  }

  measure() {
    const textStyle = this.getTextStyle();
    const TextCtor = foundry?.canvas?.containers?.PreciseText ?? PIXI.Text;
    const sample = new TextCtor(this.label, textStyle);
    const textWidth = Math.ceil(sample.width || 320);
    const textHeight = Math.ceil(sample.height || 36);
    sample.destroy?.();

    this.badgeSize = 58;
    this.height = Math.max(84, textHeight + 34);
    this.mainWidth = Math.min(Math.max(300, textWidth + this.badgeSize + 78), 1300);
    this.tailWidth = 54;
    this.totalWidth = this.mainWidth + (this.tailWidth * 2);
  }

  getTextStyle() {
    return {
      fontFamily: "Signika, 'Palatino Linotype', serif",
      fontSize: 34,
      fontWeight: "700",
      fill: COLORS.white,
      stroke: 0x1c1308,
      strokeThickness: this.isFumble ? 5 : 4,
      lineJoin: "round",
      letterSpacing: 0.5,
      dropShadow: true,
      dropShadowAlpha: 0.6,
      dropShadowAngle: Math.PI / 2,
      dropShadowBlur: 4,
      dropShadowColor: 0x000000,
      dropShadowDistance: 3
    };
  }

  buildDisplay() {
    this.leftTail = this.drawTail(true);
    this.rightTail = this.drawTail(false);
    this.body = this.drawBody();
    this.innerGlow = this.drawInnerGlow();
    this.shine = this.drawShine();
    this.topEdge = this.drawTopEdge();
    this.bottomEdge = this.drawBottomEdge();
    this.badge = this.drawBadge();
    this.text = this.drawText();
    this.frostLines = this.drawFrostLines();
    this.flare = this.drawFlare();
    this.freezeOverlay = this.drawFreezeOverlay();
    this.crackLines = this.drawCrackLines();
    this.shatterFlash = this.drawShatterFlash();
    this.crystalOverlay = this.drawCrystalOverlay();
    this.crystalSparkle = this.drawCrystalSparkle();

    this.leftTail.x = -this.mainWidth / 2 - 14;
    this.rightTail.x = this.mainWidth / 2 + 14;
    this.leftTail.y = 0;
    this.rightTail.y = 0;

    this.bodyGroup.addChild(
      this.leftTail,
      this.rightTail,
      this.body,
      this.innerGlow,
      this.shine,
      this.crystalOverlay,
      this.crystalSparkle,
      this.topEdge,
      this.bottomEdge,
      this.badge,
      this.text,
      this.frostLines,
      this.flare,
      this.freezeOverlay,
      this.crackLines,
      this.shatterFlash
    );

    this.innerGlow.alpha = 0.55;
    this.shine.alpha = 0.0;
    this.frostLines.alpha = 0.0;
    this.flare.alpha = 0.0;
    this.freezeOverlay.alpha = 0.0;
    this.crackLines.alpha = 0.0;
    this.shatterFlash.alpha = 0.0;
    this.crystalOverlay.alpha = 0.0;
    this.crystalSparkle.alpha = 0.0;

    this.text.x = -this.mainWidth / 2 + 86;
    this.text.y = -this.text.height / 2;
    this.badge.x = -this.mainWidth / 2 + 16;
    this.badge.y = -this.badgeSize / 2;
  }

  ensureCommonFxLayers() {}

  ensureFrozenFxLayers() {
    this.freezeOverlay.visible = true;
    this.crackLines.visible = true;
    this.shatterFlash.visible = true;
  }

  ensureCrystalFxLayers() {
    this.crystalOverlay.visible = true;
    this.crystalSparkle.visible = true;
  }

  resetVisualState() {
    this.root.alpha = 1;
    this.root.position.set(this.baseX, this.baseY);
    this.motion.scale.set(this.baseScale);
    this.motion.rotation = this.baseRotation;
    this.motion.tint = 0xffffff;

    this.bodyGroup.visible = true;
    this.bodyGroup.alpha = 1;

    this.innerGlow.alpha = 0.55;
    this.shine.alpha = 0;
    this.frostLines.alpha = 0;
    this.flare.alpha = 0;
    this.freezeOverlay.alpha = 0;
    this.crackLines.alpha = 0;
    this.shatterFlash.alpha = 0;
    this.crystalOverlay.alpha = 0;
    this.crystalSparkle.alpha = 0;

    this.freezeOverlay.visible = true;
    this.crackLines.visible = true;
    this.shatterFlash.visible = true;
    this.crystalOverlay.visible = true;
    this.crystalSparkle.visible = true;
  }

  drawBody() {
    const g = new PIXI.Graphics();

    const x = -this.mainWidth / 2;
    const y = -this.height / 2;
    const w = this.mainWidth;
    const h = this.height;

    const topInset = 18;
    const sideBulge = 10;
    const lowerDip = 8;

    g.lineStyle(3, this.accentColor, 0.95);
    g.beginFill(this.darkColor, 1);

    g.moveTo(x + topInset, y);
    g.bezierCurveTo(
      x - sideBulge, y + h * 0.10,
      x - sideBulge, y + h * 0.90,
      x + topInset, y + h
    );

    g.lineTo(x + w - topInset, y + h);

    g.bezierCurveTo(
      x + w + sideBulge, y + h * 0.90,
      x + w + sideBulge, y + h * 0.10,
      x + w - topInset, y
    );

    g.bezierCurveTo(
      x + w * 0.72, y + lowerDip,
      x + w * 0.28, y + lowerDip,
      x + topInset, y
    );

    g.endFill();

    g.beginFill(this.mainColor, 1);

    const ix = x + 4;
    const iy = y + 4;
    const iw = w - 8;
    const ih = h - 8;
    const iTopInset = 14;

    g.moveTo(ix + iTopInset, iy);

    g.bezierCurveTo(
      ix - 4, iy + ih * 0.12,
      ix - 4, iy + ih * 0.88,
      ix + iTopInset, iy + ih
    );

    g.lineTo(ix + iw - iTopInset, iy + ih);

    g.bezierCurveTo(
      ix + iw + 4, iy + ih * 0.88,
      ix + iw + 4, iy + ih * 0.12,
      ix + iw - iTopInset, iy
    );

    g.bezierCurveTo(
      ix + iw * 0.72, iy + 6,
      ix + iw * 0.28, iy + 6,
      ix + iTopInset, iy
    );

    g.endFill();

    return g;
  }

  drawInnerGlow() {
    const g = new PIXI.Graphics();
    const x = -this.mainWidth / 2 + 8;
    const y = -this.height / 2 + 8;
    gRoundRect(g, x, y, this.mainWidth - 16, (this.height - 16) * 0.56, 12, this.lightColor, 0.33);
    return g;
  }

  drawTopEdge() {
    const g = new PIXI.Graphics();
    const x = -this.mainWidth / 2 + 12;
    const y = -this.height / 2 + 8;
    gRoundRect(g, x, y, this.mainWidth - 24, 6, 4, COLORS.white, 0.18);
    return g;
  }

  drawBottomEdge() {
    const g = new PIXI.Graphics();
    const x = -this.mainWidth / 2 + 10;
    const y = this.height / 2 - 12;
    gRoundRect(g, x, y, this.mainWidth - 20, 6, 4, this.darkerColor, 0.7);
    return g;
  }

  drawTail(isLeft) {
    const g = new PIXI.Graphics();
    const sign = isLeft ? -1 : 1;

    const h = this.height * 0.76;
    const halfH = h / 2;
    const w = this.tailWidth + 18;

    g.lineStyle(3, this.accentColor, 0.9);
    g.beginFill(this.darkColor, 1);

    g.moveTo(0, -halfH);

    g.bezierCurveTo(
      sign * (w * 0.20), -halfH - 2,
      sign * (w * 0.72), -halfH + 2,
      sign * w, -halfH + 12
    );

    g.lineTo(sign * (w - 16), 0);
    g.lineTo(sign * w, halfH - 12);

    g.bezierCurveTo(
      sign * (w * 0.72), halfH - 2,
      sign * (w * 0.20), halfH + 2,
      0, halfH
    );

    g.bezierCurveTo(
      sign * 10, halfH * 0.40,
      sign * 10, -halfH * 0.40,
      0, -halfH
    );

    g.endFill();

    g.beginFill(this.mainColor, 1);

    g.moveTo(sign * 4, -halfH + 4);

    g.bezierCurveTo(
      sign * (w * 0.18), -halfH + 1,
      sign * (w * 0.66), -halfH + 6,
      sign * (w - 8), -halfH + 14
    );

    g.lineTo(sign * (w - 22), 0);
    g.lineTo(sign * (w - 8), halfH - 14);

    g.bezierCurveTo(
      sign * (w * 0.66), halfH - 6,
      sign * (w * 0.18), halfH - 1,
      sign * 4, halfH - 4
    );

    g.bezierCurveTo(
      sign * 12, halfH * 0.32,
      sign * 12, -halfH * 0.32,
      sign * 4, -halfH + 4
    );

    g.endFill();

    const fold = new PIXI.Graphics();
    fold.beginFill(this.darkerColor, 0.42);

    fold.moveTo(sign * 8, -halfH * 0.16);
    fold.bezierCurveTo(
      sign * 18, -halfH * 0.10,
      sign * 30, -halfH * 0.05,
      sign * 42, 0
    );
    fold.bezierCurveTo(
      sign * 30, halfH * 0.05,
      sign * 18, halfH * 0.10,
      sign * 8, halfH * 0.16
    );
    fold.bezierCurveTo(
      sign * 14, halfH * 0.08,
      sign * 14, -halfH * 0.08,
      sign * 8, -halfH * 0.16
    );

    fold.endFill();
    g.addChild(fold);

    const gloss = new PIXI.Graphics();
    gloss.beginFill(COLORS.white, 0.08);

    gloss.moveTo(sign * 8, -halfH + 10);
    gloss.bezierCurveTo(
      sign * 24, -halfH + 4,
      sign * (w * 0.42), -halfH + 6,
      sign * (w * 0.62), -halfH + 16
    );
    gloss.bezierCurveTo(
      sign * (w * 0.36), -halfH + 14,
      sign * 22, -halfH + 16,
      sign * 8, -halfH + 20
    );

    gloss.endFill();
    g.addChild(gloss);

    return g;
  }

  drawBadge() {
    const c = new PIXI.Container();

    const iconPath = this.isFumble
      ? `modules/${MODULE_ID}/assets/fumble.svg`
      : "icons/svg/d20.svg";

    const icon = PIXI.Sprite.from(iconPath);
    icon.anchor.set(0.5);
    icon.x = this.badgeSize / 2;
    icon.y = this.badgeSize / 2;
    icon.tint = 0xffffff;

    const fitIcon = () => {
      const maxW = 60;
      const maxH = 60;

      const tw = icon.texture?.width || 1;
      const th = icon.texture?.height || 1;
      const scale = Math.min(maxW / tw, maxH / th);

      icon.scale.set(scale);
    };

    if (icon.texture?.baseTexture?.valid) {
      fitIcon();
    } else {
      icon.texture.baseTexture.once("loaded", fitIcon);
    }

    c.addChild(icon);
    return c;
  }

  drawText() {
    const TextCtor = foundry?.canvas?.containers?.PreciseText ?? PIXI.Text;
    return new TextCtor(this.label, this.getTextStyle());
  }

  drawShine() {
    const g = new PIXI.Graphics();
    const shineWidth = 140;
    gRoundRect(g, -shineWidth / 2, -this.height / 2 + 8, shineWidth, this.height - 16, 12, COLORS.white, 0.22);
    g.rotation = -0.24;
    return g;
  }

  drawFrostLines() {
    const g = new PIXI.Graphics();
    const x0 = -this.mainWidth / 2 + 18;
    const x1 = this.mainWidth / 2 - 18;
    const y0 = -this.height / 2 + 16;
    const y1 = this.height / 2 - 16;

    gLineStyle(g, 2, COLORS.iceBright, 0.55);
    g.moveTo(x0 + 28, 0);
    g.lineTo(x0 + 85, -18);
    g.lineTo(x0 + 132, 6);
    g.moveTo(x1 - 20, -12);
    g.lineTo(x1 - 88, 8);
    g.lineTo(x1 - 140, -4);
    g.moveTo(18, y0 + 8);
    g.lineTo(0, -4);
    g.lineTo(-18, y1 - 10);
    return g;
  }

  drawFlare() {
    const g = new PIXI.Graphics();
    gEllipse(g, 0, 0, this.mainWidth * 0.32, this.height * 0.72, this.isFumble ? COLORS.redBright : COLORS.goldBright, 0.22);
    return g;
  }

  drawFreezeOverlay() {
    const g = new PIXI.Container();

    const frostColor = mixHex(COLORS.ice, 0x1e3a5f, 0.55);
    const deepFrost = 0x0b1f33;

    const x = -this.mainWidth / 2;
    const y = -this.height / 2;
    const w = this.mainWidth;
    const h = this.height;

    const topInset = 18;
    const sideBulge = 10;

    const bodyBase = new PIXI.Graphics();
    bodyBase.beginFill(deepFrost, 0.34);
    bodyBase.moveTo(x + topInset, y + 2);
    bodyBase.bezierCurveTo(
      x - sideBulge + 2, y + h * 0.10,
      x - sideBulge + 2, y + h * 0.90,
      x + topInset, y + h - 2
    );
    bodyBase.lineTo(x + w - topInset, y + h - 2);
    bodyBase.bezierCurveTo(
      x + w + sideBulge - 2, y + h * 0.90,
      x + w + sideBulge - 2, y + h * 0.10,
      x + w - topInset, y + 2
    );
    bodyBase.bezierCurveTo(
      x + w * 0.72, y + 8,
      x + w * 0.28, y + 8,
      x + topInset, y + 2
    );
    bodyBase.endFill();

    const bodyFrost = new PIXI.Graphics();
    bodyFrost.beginFill(frostColor, 0.28);
    bodyFrost.moveTo(x + topInset, y + 2);
    bodyFrost.bezierCurveTo(
      x - sideBulge + 2, y + h * 0.10,
      x - sideBulge + 2, y + h * 0.90,
      x + topInset, y + h - 2
    );
    bodyFrost.lineTo(x + w - topInset, y + h - 2);
    bodyFrost.bezierCurveTo(
      x + w + sideBulge - 2, y + h * 0.90,
      x + w + sideBulge - 2, y + h * 0.10,
      x + w - topInset, y + 2
    );
    bodyFrost.bezierCurveTo(
      x + w * 0.72, y + 8,
      x + w * 0.28, y + 8,
      x + topInset, y + 2
    );
    bodyFrost.endFill();

    const gloss = new PIXI.Graphics();
    gloss.beginFill(COLORS.white, 0.14);
    gloss.moveTo(x + 24, y + 10);
    gloss.bezierCurveTo(
      x + w * 0.28, y + 4,
      x + w * 0.42, y + 8,
      x + w * 0.48, y + 16
    );
    gloss.lineTo(x + w * 0.24, y + 22);
    gloss.bezierCurveTo(
      x + w * 0.18, y + 18,
      x + 38, y + 16,
      x + 24, y + 10
    );
    gloss.endFill();

    const makeTailOverlay = (isLeft) => {
      const c = new PIXI.Container();
      const sign = isLeft ? -1 : 1;
      const th = this.height * 0.76;
      const halfH = th / 2;
      const tw = this.tailWidth + 18;

      const tailBase = new PIXI.Graphics();
      tailBase.beginFill(deepFrost, 0.30);
      tailBase.moveTo(sign * 4, -halfH + 4);
      tailBase.bezierCurveTo(
        sign * (tw * 0.18), -halfH + 1,
        sign * (tw * 0.66), -halfH + 6,
        sign * (tw - 8), -halfH + 14
      );
      tailBase.lineTo(sign * (tw - 22), 0);
      tailBase.lineTo(sign * (tw - 8), halfH - 14);
      tailBase.bezierCurveTo(
        sign * (tw * 0.66), halfH - 6,
        sign * (tw * 0.18), halfH - 1,
        sign * 4, halfH - 4
      );
      tailBase.bezierCurveTo(
        sign * 12, halfH * 0.32,
        sign * 12, -halfH * 0.32,
        sign * 4, -halfH + 4
      );
      tailBase.endFill();

      const tailFrost = new PIXI.Graphics();
      tailFrost.beginFill(frostColor, 0.24);
      tailFrost.moveTo(sign * 4, -halfH + 4);
      tailFrost.bezierCurveTo(
        sign * (tw * 0.18), -halfH + 1,
        sign * (tw * 0.66), -halfH + 6,
        sign * (tw - 8), -halfH + 14
      );
      tailFrost.lineTo(sign * (tw - 22), 0);
      tailFrost.lineTo(sign * (tw - 8), halfH - 14);
      tailFrost.bezierCurveTo(
        sign * (tw * 0.66), halfH - 6,
        sign * (tw * 0.18), halfH - 1,
        sign * 4, halfH - 4
      );
      tailFrost.bezierCurveTo(
        sign * 12, halfH * 0.32,
        sign * 12, -halfH * 0.32,
        sign * 4, -halfH + 4
      );
      tailFrost.endFill();

      const tailShine = new PIXI.Graphics();
      tailShine.beginFill(COLORS.white, 0.09);
      tailShine.moveTo(sign * 8, -halfH + 10);
      tailShine.bezierCurveTo(
        sign * 24, -halfH + 4,
        sign * (tw * 0.42), -halfH + 6,
        sign * (tw * 0.58), -halfH + 16
      );
      tailShine.lineTo(sign * 18, -halfH + 20);
      tailShine.endFill();

      c.addChild(tailBase, tailFrost, tailShine);
      return c;
    };

    const left = makeTailOverlay(true);
    const right = makeTailOverlay(false);

    left.x = -this.mainWidth / 2 - 14;
    right.x = this.mainWidth / 2 + 14;

    g.addChild(bodyBase, bodyFrost, gloss, left, right);
    return g;
  }

  drawCrackLines() {
    const g = new PIXI.Graphics();
    gLineStyle(g, 2, COLORS.iceBright, 0.9);

    const xL = -this.totalWidth / 2;
    const xR = this.totalWidth / 2;
    const yT = -this.height / 2;
    const yB = this.height / 2;

    g.moveTo(-56, yT + 8);
    g.lineTo(-20, -10);
    g.lineTo(-4, 2);
    g.lineTo(12, 18);
    g.lineTo(34, yB - 12);

    g.moveTo(-20, -10);
    g.lineTo(-92, -22);
    g.lineTo(-152, -8);

    g.moveTo(-4, 2);
    g.lineTo(58, -8);
    g.lineTo(126, -24);

    g.moveTo(12, 18);
    g.lineTo(-24, 30);
    g.lineTo(-90, 20);

    g.moveTo(34, yB - 22);
    g.lineTo(92, yB - 30);
    g.lineTo(156, yB - 16);

    g.moveTo(xL + 54, -8);
    g.lineTo(xL + 98, -22);
    g.lineTo(xL + 146, -12);

    g.moveTo(xR - 54, 14);
    g.lineTo(xR - 98, 28);
    g.lineTo(xR - 148, 18);

    return g;
  }

  drawShatterFlash() {
    const g = new PIXI.Container();

    const body = new PIXI.Graphics();

    const x = -this.mainWidth / 2;
    const y = -this.height / 2;
    const w = this.mainWidth;
    const h = this.height;

    const topInset = 18;
    const sideBulge = 10;

    body.beginFill(COLORS.white, 0.32);
    body.moveTo(x + topInset, y + 2);
    body.bezierCurveTo(
      x - sideBulge + 2, y + h * 0.10,
      x - sideBulge + 2, y + h * 0.90,
      x + topInset, y + h - 2
    );
    body.lineTo(x + w - topInset, y + h - 2);
    body.bezierCurveTo(
      x + w + sideBulge - 2, y + h * 0.90,
      x + w + sideBulge - 2, y + h * 0.10,
      x + w - topInset, y + 2
    );
    body.bezierCurveTo(
      x + w * 0.72, y + 8,
      x + w * 0.28, y + 8,
      x + topInset, y + 2
    );
    body.endFill();

    const makeTailFlash = (isLeft) => {
      const t = new PIXI.Graphics();
      const sign = isLeft ? -1 : 1;
      const th = this.height * 0.76;
      const halfH = th / 2;
      const tw = this.tailWidth + 18;

      t.beginFill(COLORS.white, 0.24);
      t.moveTo(sign * 4, -halfH + 4);
      t.bezierCurveTo(
        sign * (tw * 0.18), -halfH + 1,
        sign * (tw * 0.66), -halfH + 6,
        sign * (tw - 8), -halfH + 14
      );
      t.lineTo(sign * (tw - 22), 0);
      t.lineTo(sign * (tw - 8), halfH - 14);
      t.bezierCurveTo(
        sign * (tw * 0.66), halfH - 6,
        sign * (tw * 0.18), halfH - 1,
        sign * 4, halfH - 4
      );
      t.bezierCurveTo(
        sign * 12, halfH * 0.32,
        sign * 12, -halfH * 0.32,
        sign * 4, -halfH + 4
      );
      t.endFill();
      return t;
    };

    const left = makeTailFlash(true);
    const right = makeTailFlash(false);

    left.x = -this.mainWidth / 2 - 14;
    right.x = this.mainWidth / 2 + 14;

    g.addChild(body, left, right);
    return g;
  }

  drawCrystalOverlay() {
    const g = new PIXI.Container();

    const body = new PIXI.Graphics();
    const crystalColor = mixHex(COLORS.ice, COLORS.white, 0.45);

    const x = -this.mainWidth / 2;
    const y = -this.height / 2;
    const w = this.mainWidth;
    const h = this.height;

    const topInset = 18;
    const sideBulge = 10;

    body.beginFill(crystalColor, 0.18);
    body.moveTo(x + topInset, y + 2);
    body.bezierCurveTo(
      x - sideBulge + 2, y + h * 0.10,
      x - sideBulge + 2, y + h * 0.90,
      x + topInset, y + h - 2
    );
    body.lineTo(x + w - topInset, y + h - 2);
    body.bezierCurveTo(
      x + w + sideBulge - 2, y + h * 0.90,
      x + w + sideBulge - 2, y + h * 0.10,
      x + w - topInset, y + 2
    );
    body.bezierCurveTo(
      x + w * 0.72, y + 8,
      x + w * 0.28, y + 8,
      x + topInset, y + 2
    );
    body.endFill();

    const makeTailOverlay = (isLeft) => {
      const t = new PIXI.Graphics();
      const sign = isLeft ? -1 : 1;
      const th = this.height * 0.76;
      const halfH = th / 2;
      const tw = this.tailWidth + 18;

      t.beginFill(crystalColor, 0.16);
      t.moveTo(sign * 4, -halfH + 4);
      t.bezierCurveTo(
        sign * (tw * 0.18), -halfH + 1,
        sign * (tw * 0.66), -halfH + 6,
        sign * (tw - 8), -halfH + 14
      );
      t.lineTo(sign * (tw - 22), 0);
      t.lineTo(sign * (tw - 8), halfH - 14);
      t.bezierCurveTo(
        sign * (tw * 0.66), halfH - 6,
        sign * (tw * 0.18), halfH - 1,
        sign * 4, halfH - 4
      );
      t.bezierCurveTo(
        sign * 12, halfH * 0.32,
        sign * 12, -halfH * 0.32,
        sign * 4, -halfH + 4
      );
      t.endFill();
      return t;
    };

    const left = makeTailOverlay(true);
    const right = makeTailOverlay(false);

    left.x = -this.mainWidth / 2 - 14;
    right.x = this.mainWidth / 2 + 14;

    g.addChild(body, left, right);
    return g;
  }

  drawCrystalSparkle() {
    const c = new PIXI.Container();

    const bar1 = new PIXI.Graphics();
    bar1.beginFill(COLORS.white, 0.16);
    bar1.drawRoundedRect(-this.mainWidth * 0.20, -this.height * 0.22, this.mainWidth * 0.28, 8, 4);
    bar1.endFill();

    const bar2 = new PIXI.Graphics();
    bar2.beginFill(COLORS.iceBright, 0.12);
    bar2.drawRoundedRect(-this.mainWidth * 0.02, -this.height * 0.08, this.mainWidth * 0.22, 6, 3);
    bar2.endFill();

    const star = new PIXI.Graphics();
    gStar(star, this.mainWidth * 0.16, -this.height * 0.12, 4, 8, 3, COLORS.white, 0.18);

    c.addChild(bar1, bar2, star);
    return c;
  }

  spawnIceDust(count = 18) {
    for (let i = 0; i < count; i++) {
      const sprite = new PIXI.Graphics();
      const r = randomBetween(1.5, 4.5);
      gCircle(sprite, 0, 0, r, COLORS.iceBright, randomBetween(0.35, 0.9));

      sprite.x = randomBetween(-this.totalWidth * 0.45, this.totalWidth * 0.45);
      sprite.y = randomBetween(-this.height * 0.38, this.height * 0.38);
      this.fx.addChild(sprite);

      this.particles.push({
        sprite,
        age: 0,
        life: randomBetween(250, 650),
        vx: randomBetween(-90, 90),
        vy: randomBetween(-120, 20),
        vr: 0,
        scaleFrom: 1,
        scaleTo: 0.3,
        startAlpha: randomBetween(0.45, 0.95)
      });
    }
  }

  spawnCrystalDust(count = 8) {
    for (let i = 0; i < count; i++) {
      const p = new PIXI.Graphics();
      gCircle(p, 0, 0, randomBetween(1.4, 2.8), COLORS.white, 0.9);

      p.x = randomBetween(-this.mainWidth / 2 + 20, this.mainWidth / 2 - 20);
      p.y = randomBetween(-10, 12);

      this.fx.addChild(p);

      this.particles.push({
        sprite: p,
        age: 0,
        life: randomBetween(420, 820),
        vx: randomBetween(-12, 12),
        vy: randomBetween(-90, -40),
        vr: 0,
        scaleFrom: 1,
        scaleTo: 0.15,
        startAlpha: 0.85
      });
    }
  }

  getShatterPolygons() {
    const bodyL = -this.mainWidth / 2;
    const totalL = -this.totalWidth / 2;
    const totalR = this.totalWidth / 2;
    const yT = -this.height / 2;
    const yB = this.height / 2;

    const bx = (r) => bodyL + this.mainWidth * r;

    return [
      [totalL + 10, -22, totalL + 28, -18, totalL + 40, -4, totalL + 20, 0],
      [totalL + 20, 0, totalL + 40, -4, totalL + 30, 12, totalL + 10, 20],

      [bx(0.02), yT + 8, bx(0.16), yT + 6, bx(0.14), -10, bx(0.04), -4],
      [bx(0.16), yT + 6, bx(0.30), yT + 6, bx(0.28), -8, bx(0.14), -10],
      [bx(0.30), yT + 6, bx(0.44), yT + 7, bx(0.42), -6, bx(0.28), -8],
      [bx(0.44), yT + 7, bx(0.58), yT + 7, bx(0.56), -6, bx(0.42), -6],
      [bx(0.58), yT + 7, bx(0.72), yT + 8, bx(0.70), -4, bx(0.56), -6],
      [bx(0.72), yT + 8, bx(0.86), yT + 8, bx(0.84), -2, bx(0.70), -4],
      [bx(0.86), yT + 8, bx(0.98), yT + 10, bx(0.96), 0, bx(0.84), -2],

      [bx(0.02), -2, bx(0.16), -10, bx(0.15), 12, bx(0.02), 10],
      [bx(0.16), -10, bx(0.30), -8, bx(0.29), 10, bx(0.15), 12],
      [bx(0.30), -8, bx(0.44), -6, bx(0.43), 10, bx(0.29), 10],
      [bx(0.44), -6, bx(0.58), -4, bx(0.57), 10, bx(0.43), 10],
      [bx(0.58), -4, bx(0.72), -4, bx(0.71), 10, bx(0.57), 10],
      [bx(0.72), -4, bx(0.86), -2, bx(0.85), 12, bx(0.71), 10],
      [bx(0.86), -2, bx(0.98), 0, bx(0.97), 12, bx(0.85), 12],

      [bx(0.02), 10, bx(0.15), 12, bx(0.13), yB - 10, bx(0.01), yB - 8],
      [bx(0.15), 12, bx(0.29), 10, bx(0.27), yB - 8, bx(0.13), yB - 10],
      [bx(0.29), 10, bx(0.43), 10, bx(0.41), yB - 8, bx(0.27), yB - 8],
      [bx(0.43), 10, bx(0.57), 10, bx(0.55), yB - 8, bx(0.41), yB - 8],
      [bx(0.57), 10, bx(0.71), 10, bx(0.69), yB - 8, bx(0.55), yB - 8],
      [bx(0.71), 10, bx(0.85), 12, bx(0.83), yB - 6, bx(0.69), yB - 8],
      [bx(0.85), 12, bx(0.98), 10, bx(0.96), yB - 4, bx(0.83), yB - 6],

      [totalR - 10, -22, totalR - 28, -18, totalR - 40, -4, totalR - 20, 0],
      [totalR - 20, 0, totalR - 40, -4, totalR - 30, 12, totalR - 10, 20]
    ];
  }

  captureBodyGroupTexture() {
    const renderer = canvas?.app?.renderer;
    if (!renderer) return null;

    const bounds = new PIXI.Rectangle(
      -this.totalWidth / 2 - 8,
      -this.height / 2 - 8,
      this.totalWidth + 16,
      this.height + 16
    );

    const rt = PIXI.RenderTexture.create({
      width: Math.ceil(bounds.width),
      height: Math.ceil(bounds.height),
      resolution: renderer.resolution || window.devicePixelRatio || 1
    });

    const temp = new PIXI.Container();
    temp.sortableChildren = true;
    temp.addChild(this.bodyGroup);

    const oldPos = { x: this.bodyGroup.x, y: this.bodyGroup.y };
    this.bodyGroup.position.set(-bounds.x, -bounds.y);

    renderer.render(temp, { renderTexture: rt, clear: true });

    temp.removeChild(this.bodyGroup);
    this.motion.addChild(this.bodyGroup);
    this.bodyGroup.position.set(oldPos.x, oldPos.y);

    this.shatterSourceBounds = bounds;
    return rt;
  }

  createTexturedShard(points, texture, sourceBounds) {
    const xs = [];
    const ys = [];

    for (let i = 0; i < points.length; i += 2) {
      xs.push(points[i]);
      ys.push(points[i + 1]);
    }

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const pad = 3;

    const frameX = Math.floor(minX - sourceBounds.x - pad);
    const frameY = Math.floor(minY - sourceBounds.y - pad);
    const frameW = Math.ceil(maxX - minX + pad * 2);
    const frameH = Math.ceil(maxY - minY + pad * 2);

    const base = texture.baseTexture;
    const frame = new PIXI.Rectangle(frameX, frameY, frameW, frameH);
    const croppedTexture = new PIXI.Texture(base, frame);

    const shard = new PIXI.Container();
    shard.x = minX - pad;
    shard.y = minY - pad;

    const sprite = new PIXI.Sprite(croppedTexture);
    sprite.x = 0;
    sprite.y = 0;

    const localPts = [];
    for (let i = 0; i < points.length; i += 2) {
      localPts.push(
        points[i] - shard.x,
        points[i + 1] - shard.y
      );
    }

    const mask = new PIXI.Graphics();
    gPoly(mask, localPts, COLORS.white, 1);

    const edge = new PIXI.Graphics();
    gPoly(edge, localPts, null, 1, 1.25, COLORS.iceBright, 0.65);

    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;

    const glossPts = [];
    for (let i = 0; i < localPts.length; i += 2) {
      const px = localPts[i];
      const py = localPts[i + 1];
      const localCx = cx - shard.x;
      const localCy = cy - shard.y;

      glossPts.push(
        lerp(localCx, px, 0.58),
        lerp(localCy, py, 0.58)
      );
    }

    const gloss = new PIXI.Graphics();
    gPoly(gloss, glossPts, COLORS.white, 0.10);

    shard.addChild(sprite);
    shard.addChild(mask);
    shard.addChild(edge);
    shard.addChild(gloss);

    sprite.mask = mask;

    this.fx.addChild(shard);

    return { shard, cx, cy };
  }

  createShatterShards() {
    if (this.shards.length) return;

    if (!this.shatterSnapshot) {
      this.shatterSnapshot = this.captureBodyGroupTexture();
    }
    if (!this.shatterSnapshot || !this.shatterSourceBounds) return;

    const pieces = [];
    const polys = this.getShatterPolygons();
    const bounds = this.shatterSourceBounds;

    for (const pts of polys) {
      const { shard, cx } = this.createTexturedShard(pts, this.shatterSnapshot, bounds);

      const dir = Math.sign(cx) || (Math.random() > 0.5 ? 1 : -1);
      const isTail = Math.abs(cx) > (this.mainWidth / 2);

      pieces.push({
        sprite: shard,
        vx: randomBetween(12, 42) * dir * (isTail ? 1.35 : 1),
        vy: randomBetween(15, 45),
        gravity: randomBetween(580, 760),
        delay: randomBetween(0, 35)
      });
    }

    this.shards = pieces;
  }

  applySlot() {
    const screen = canvas?.app?.renderer?.screen ?? { width: window.innerWidth, height: window.innerHeight };
    const slot = BANNER_SLOTS[this.slotIndex] ?? BANNER_SLOTS[0];
    this.baseX = screen.width * slot.x;
    this.baseY = screen.height * slot.y;
    this.baseScale = slot.scale;
    this.baseRotation = slot.rotation;
    this.root.position.set(this.baseX, this.baseY);
    this.motion.scale.set(this.baseScale);
    this.motion.rotation = this.baseRotation;
  }

  update(dtMS) {
    this.elapsed += dtMS;
    this.stateTime += dtMS;
    this.lastDtMS = dtMS;

    if (this.state === "enter") {
      this.updateEnter();
      if (this.stateTime >= this.enterDuration) this.changeState("hold");
    } else if (this.state === "hold") {
      this.updateHold(dtMS);
      if (this.stateTime >= this.holdDuration) this.changeState("exit");
    } else if (this.state === "exit") {
      this.updateExit(dtMS);
      if (this.stateTime >= this.exitDuration) this.done = true;
    }

    this.updateParticles(dtMS);
  }

  changeState(next) {
    this.state = next;
    this.stateTime = 0;
    if (next === "exit") this.prepareExit();
  }

  prepareExit() {
    this.effect.onPrepareExit?.(this);
  }

  updateEnter() {
    const t = clamp01(this.stateTime / this.enterDuration);
    const e = this.isFumble ? easeOutBackSoft(t) : easeOutCubic(t);
    const offsetX = lerp(this.isFumble ? -145 : -120, 0, e);
    const offsetY = lerp(this.isFumble ? 6 : -8, 0, e);
    const scale = lerp(this.isFumble ? 0.88 : 0.9, 1, e);
    const alpha = lerp(0, 1, easeOutCubic(t));
    const rot = this.baseRotation + lerp(this.isFumble ? -0.025 : -0.015, 0, e);

    const shake = this.isFumble ? Math.sin(t * Math.PI * 7) * (1 - t) * 8 : 0;

    this.root.position.set(this.baseX + offsetX + shake, this.baseY + offsetY);
    this.motion.scale.set(this.baseScale * scale);
    this.motion.rotation = rot;
    this.root.alpha = alpha;
    this.updateCommonFX(t, true);
  }

  updateHold(dtMS) {
    const t = clamp01(this.stateTime / this.holdDuration);
    const bob = Math.sin((this.elapsed / 1000) * 2.6 + this.floatSeed) * 1.2;
    const glow = 0.48 + (Math.sin((this.elapsed / 1000) * 4.8 + this.floatSeed) * 0.08);
    const shinePulse = ((this.elapsed / 1000) + this.shineSeed) % 1.85;
    const shineT = clamp01((shinePulse - 0.15) / 0.55);

    this.root.position.set(this.baseX, this.baseY + bob);
    this.root.alpha = 1;
    this.motion.scale.set(this.baseScale);
    this.motion.rotation = this.baseRotation + (this.isFumble ? Math.sin((this.elapsed / 1000) * 6.2) * 0.004 : 0);

    this.innerGlow.alpha = glow;
    this.shine.alpha = shinePulse > 0.15 && shinePulse < 0.70 ? (Math.sin(shineT * Math.PI) * 0.30) : 0;
    this.shine.x = lerp(-this.mainWidth * 0.7, this.mainWidth * 0.7, easeInOutQuad(shineT));

    this.frostLines.alpha = 0;
    this.flare.alpha = 0;
    this.crystalOverlay.alpha = 0;
    this.crystalSparkle.alpha = 0;
    this.motion.tint = 0xffffff;

    this.effect.onHold?.(this, t, dtMS);
  }

  updateExit(dtMS) {
    const t = clamp01(this.stateTime / this.exitDuration);
    this.effect.onExit?.(this, t, dtMS);
  }

  updateCurrentExitBase(t) {
    const e = easeInCubic(t);
    this.root.alpha = 1 - e;
    this.root.position.set(this.baseX + lerp(0, 40, e), this.baseY + lerp(0, -10, e));
    this.motion.scale.set(this.baseScale * lerp(1, 1.04, e));
    this.motion.rotation = this.baseRotation + lerp(0, this.isFumble ? -0.03 : 0.02, e);
    this.innerGlow.alpha = lerp(0.5, 0.15, e);
    this.shine.alpha = lerp(this.shine.alpha, 0, 0.3);
    this.crystalOverlay.alpha = 0;
    this.crystalSparkle.alpha = 0;
  }

  prepareFrozenShatter() {
    this.resetVisualState();
    this.shatterPrepared = true;
    this.shatterStarted = false;
    this.freezeOverlay.visible = true;
    this.crackLines.visible = true;
    this.shatterFlash.visible = true;

    if (this.shatterSnapshot) {
      this.shatterSnapshot.destroy(true);
      this.shatterSnapshot = null;
    }
    this.shatterSourceBounds = null;

    for (const s of this.shards) s.sprite.destroy?.();
    this.shards = [];

    this.spawnIceDust(12);
  }

  updateFrozenShatterExitEffect(t, dtMS) {
    const freezeT = clamp01(t / 0.42);
    const shatterT = clamp01((t - 0.42) / 0.58);

    if (t <= 0.42) {
      const e = easeOutCubic(freezeT);
      const flashT = clamp01((freezeT - 0.84) / 0.16);

      this.shatterFlash.alpha = Math.sin(flashT * Math.PI) * 0.35;
      this.motion.tint = mixHex(0xffffff, COLORS.ice, e * 0.35);

      this.root.alpha = 1;
      this.root.position.set(this.baseX, this.baseY);
      this.motion.scale.set(this.baseScale * lerp(1, 1.015, e));
      this.motion.rotation = this.baseRotation;

      this.innerGlow.alpha = lerp(0.48, 0.18, e);
      this.bodyGroup.alpha = lerp(1, 0.7, e);
      this.shine.alpha = lerp(this.shine.alpha, 0, 0.25);
      this.frostLines.alpha = lerp(0.08, 0.72, e);
      this.freezeOverlay.alpha = lerp(0.0, 1.15, e);
      this.crackLines.alpha = lerp(0.0, 1.25, Math.max(0, freezeT - 0.28) / 0.72);

      if (Math.random() < 0.18) this.spawnIceDust(1);
      return;
    }

    if (!this.shatterStarted) {
      this.shatterStarted = true;
      this.motion.tint = 0xffffff;
      this.shatterFlash.alpha = 0;
      this.freezeOverlay.alpha = 0;
      this.crackLines.alpha = 0;

      this.createShatterShards();
      this.bodyGroup.visible = false;
      this.freezeOverlay.visible = false;
      this.crackLines.visible = false;
      this.shatterFlash.visible = false;

      this.spawnIceDust(18);
    }

    this.root.alpha = 1 - easeInQuad(shatterT) * 0.08;
    this.root.position.set(this.baseX, this.baseY);
    this.motion.scale.set(this.baseScale);
    this.motion.rotation = this.baseRotation;

    const dt = (dtMS ?? this.lastDtMS ?? 16.67) / 1000;

    for (const s of this.shards) {
      if (s.delay > 0) {
        s.delay -= (dtMS ?? this.lastDtMS ?? 16.67);
        continue;
      }

      s.vy += s.gravity * dt;
      s.sprite.x += s.vx * dt;
      s.sprite.y += s.vy * dt;
      s.sprite.alpha = 1 - easeInQuad(shatterT);
    }
  }

  cleanupFrozenShatter() {
    for (const s of this.shards) s.sprite.destroy?.();
    this.shards = [];

    if (this.shatterSnapshot) {
      this.shatterSnapshot.destroy(true);
      this.shatterSnapshot = null;
    }
  }

  prepareCrystalize() {
    this.resetVisualState();
    this.crystalOverlay.alpha = 0.6;
    this.crystalSparkle.alpha = 0.35;
  }

  updateCrystalizeHoldEffect(t, dtMS) {
    const pulse = (Math.sin((this.elapsed / 1000) * 4.2) + 1) * 0.5;
    this.crystalOverlay.alpha = lerp(0.10, 0.48, t);
    this.crystalSparkle.alpha = 0.12 + pulse * 0.18;
    this.motion.tint = mixHex(0xffffff, COLORS.ice, 0.22 + t * 0.10);
    this.innerGlow.alpha = 0.48 + pulse * 0.08;

    if (this.crystalSparkle.children[0]) {
      this.crystalSparkle.children[0].x = lerp(-this.mainWidth * 0.10, this.mainWidth * 0.18, pulse);
    }
    if (this.crystalSparkle.children[1]) {
      this.crystalSparkle.children[1].x = lerp(-this.mainWidth * 0.04, this.mainWidth * 0.10, 1 - pulse);
    }

    if (Math.random() < 0.04) this.spawnCrystalDust(1);
  }

  updateCrystalizeExitEffect(t, dtMS) {
    const e = easeOutCubic(t);

    this.root.alpha = 1 - e * 0.15;
    this.root.position.set(this.baseX, this.baseY - lerp(0, 10, e));
    this.motion.scale.set(this.baseScale * lerp(1, 1.05, e));
    this.motion.rotation = this.baseRotation;

    this.motion.tint = mixHex(0xffffff, COLORS.iceBright, 0.20 * (1 - t));
    this.crystalOverlay.alpha = lerp(0.6, 0, e);
    this.crystalSparkle.alpha = lerp(0.40, 0, e);
    this.innerGlow.alpha = lerp(0.5, 0, e);
    this.shine.alpha = lerp(this.shine.alpha, 0, 0.25);

    if (Math.random() < 0.18) this.spawnCrystalDust(1);
  }

  cleanupCrystalize() {
    this.crystalOverlay.alpha = 0;
    this.crystalSparkle.alpha = 0;
    this.motion.tint = 0xffffff;
  }

  updateCommonFX(t, entering = false) {
    this.innerGlow.alpha = lerp(0.2, 0.55, t);
    if (entering) {
      this.shine.alpha = Math.sin(t * Math.PI) * 0.18;
      this.shine.x = lerp(-50, 14, t);
    }
  }

  updateParticles(dtMS) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dtMS;
      const t = clamp01(p.age / p.life);
      p.sprite.x += p.vx * (dtMS / 1000);
      p.sprite.y += p.vy * (dtMS / 1000);
      p.sprite.rotation += p.vr ?? 0;

      const scale = lerp(p.scaleFrom ?? 1, p.scaleTo ?? 0.3, t);
      p.sprite.scale.set(scale);
      p.sprite.alpha = (p.startAlpha ?? 1) * (1 - easeInQuad(t));

      if (p.age >= p.life) {
        p.sprite.destroy?.();
        this.particles.splice(i, 1);
      }
    }
  }

  destroy() {
    this.effect.onDestroy?.(this);

    for (const p of this.particles) p.sprite.destroy?.();
    this.particles = [];

    if (this.shatterSnapshot) {
      this.shatterSnapshot.destroy(true);
      this.shatterSnapshot = null;
    }

    this.root.destroy({ children: true });
  }
}