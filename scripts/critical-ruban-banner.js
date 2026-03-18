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
    this.exitEffect = exitEffect;
    this.isFumble = type === "fumble";
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
    this.done = false;
    this.particles = [];
    this.shards = [];
    this.floatSeed = Math.random() * Math.PI * 2;
    this.shineSeed = Math.random() * 2;

    this.root = new PIXI.Container();
    this.root.sortableChildren = true;
    this.root.eventMode = "none";
    this.root.interactiveChildren = false;
    this.root.alpha = 0.01;

    this.motion = new PIXI.Container();
    this.motion.sortableChildren = true;
    this.root.addChild(this.motion);

    this.fx = new PIXI.Container();
    this.fx.zIndex = 20;
    this.motion.addChild(this.fx);

    this.bodyGroup = new PIXI.Container();
    this.bodyGroup.zIndex = 10;
    this.motion.addChild(this.bodyGroup);

    this.measure();
    this.buildDisplay();
    this.applySlot();
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
    this.badge = this.drawBadge();
    this.text = this.drawText();
    this.topEdge = this.drawTopEdge();
    this.bottomEdge = this.drawBottomEdge();
    this.frostLines = this.drawFrostLines();
    this.flare = this.drawFlare();

    this.leftTail.x = -this.mainWidth / 2 - 14;
    this.rightTail.x = this.mainWidth / 2 + 14;
    this.leftTail.y = 0;
    this.rightTail.y = 0;

    this.bodyGroup.addChild(this.leftTail, this.rightTail, this.body, this.innerGlow, this.shine, this.topEdge, this.bottomEdge, this.badge, this.text, this.frostLines, this.flare);

    this.innerGlow.alpha = 0.55;
    this.shine.alpha = 0.0;
    this.frostLines.alpha = 0.0;
    this.flare.alpha = 0.0;

    this.text.x = -this.mainWidth / 2 + 86;
    this.text.y = -this.text.height / 2;
    this.badge.x = -this.mainWidth / 2 + 16;
    this.badge.y = -this.badgeSize / 2;
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

    // contour extérieur doré / sombre
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

    // corps principal
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

    // forme externe
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

    // remplissage interne
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

    // pli intérieur plus naturel
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

    // reflet doux haut
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

    if (this.state === "enter") {
      this.updateEnter();
      if (this.stateTime >= this.enterDuration) this.changeState("hold");
    } else if (this.state === "hold") {
      this.updateHold();
      if (this.stateTime >= this.holdDuration) this.changeState("exit");
    } else if (this.state === "exit") {
      this.updateExit();
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

  updateHold() {
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

    this.frostLines.alpha = this.exitEffect === EXIT_EFFECTS.FROZEN_GLORY ? 0.10 + Math.sin(t * Math.PI) * 0.06 : 0;
    this.flare.alpha = this.exitEffect === EXIT_EFFECTS.BLAZING_GLORY ? 0.08 + Math.sin(t * Math.PI) * 0.08 : 0;
  }

  updateExit() {
    const t = clamp01(this.stateTime / this.exitDuration);
    switch (this.exitEffect) {
      default:
        this.updateCurrentExit(t);
        break;
    }
  }

  updateCurrentExit(t) {
    const e = easeInCubic(t);
    this.root.alpha = 1 - e;
    this.root.position.set(this.baseX + lerp(0, 40, e), this.baseY + lerp(0, -10, e));
    this.motion.scale.set(this.baseScale * lerp(1, 1.04, e));
    this.motion.rotation = this.baseRotation + lerp(0, this.isFumble ? -0.03 : 0.02, e);
    this.innerGlow.alpha = lerp(0.5, 0.15, e);
    this.shine.alpha = lerp(this.shine.alpha, 0, 0.3);
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
      p.sprite.rotation += p.vr;
      const scale = lerp(p.scaleFrom, p.scaleTo, t);
      p.sprite.scale.set(scale);
      p.sprite.alpha = p.startAlpha * (1 - easeInQuad(t));
      if (p.age >= p.life) {
        p.sprite.destroy();
        this.particles.splice(i, 1);
      }
    }
  }

  destroy() {
    for (const p of this.particles) p.sprite.destroy?.();
    for (const s of this.shards) s.sprite.destroy?.();
    this.root.destroy({ children: true });
  }
}