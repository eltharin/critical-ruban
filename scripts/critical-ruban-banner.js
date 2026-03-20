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
    const dtMS = typeof ticker?.deltaMS === "number" ? ticker.deltaMS : 1000 / 60;

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
    this.kind = type === "fumble" ? "fumble" : "critical";
    this.isFumble = this.kind === "fumble";
    this.label = `${label} : ${name}`;

    this.exitEffect = globalThis.CriticalRubanEffects.validateEffect(this.kind, exitEffect);
    this.effect = globalThis.CriticalRubanEffects.getRubanEffect(this.exitEffect);

    this.baseColorHex = cssToHex(normalizeHexColor(color) ?? "#8b0000");
    this.mainColor = this.isFumble ? mixHex(this.baseColorHex, COLORS.red, 0.35) : this.baseColorHex;
    this.darkColor = darkenHex(this.mainColor, 0.28);
    this.darkerColor = darkenHex(this.mainColor, 0.45);
    this.lightColor = lightenHex(this.mainColor, 0.20);
    this.accentColor = this.isFumble ? COLORS.red : COLORS.gold;

    const timing = globalThis.CriticalRubanEffects.getTiming(this.exitEffect);

    this.enterDuration = this.isFumble ? 480 : 320;
    this.holdDuration = timing.startDelay;
    this.exitDuration = timing.totalDuration;

    this.state = "enter";
    this.stateTime = 0;
    this.elapsed = 0;
    this.lastDtMS = 16.67;
    this.done = false;

    this.particles = [];
    this.effectLayers = new Map();

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
    this.fx.sortableChildren = true;
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
    this.totalWidth = this.mainWidth + this.tailWidth * 2;
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

    this.leftTail.x = -this.mainWidth / 2 - 14;
    this.rightTail.x = this.mainWidth / 2 + 14;

    this.bodyGroup.addChild(
      this.leftTail,
      this.rightTail,
      this.body,
      this.innerGlow,
      this.shine,
      this.topEdge,
      this.bottomEdge,
      this.badge,
      this.text
    );

    this.innerGlow.alpha = 0.55;
    this.shine.alpha = 0;

    this.text.x = -this.mainWidth / 2 + 86;
    this.text.y = -this.text.height / 2;
    this.badge.x = -this.mainWidth / 2 + 16;
    this.badge.y = -this.badgeSize / 2;
  }

  addEffectLayer(key, displayObject, {
    parent = "bodyGroup",
    index = null,
    alpha = 1,
    visible = true
  } = {}) {
    const target = this[parent];
    if (!target) throw new Error(`Unknown parent container: ${parent}`);

    displayObject.alpha = alpha;
    displayObject.visible = visible;

    if (Number.isInteger(index)) {
      target.addChildAt(displayObject, Math.max(0, Math.min(index, target.children.length)));
    } else {
      target.addChild(displayObject);
    }

    this.effectLayers.set(key, displayObject);
    return displayObject;
  }

  getEffectLayer(key) {
    return this.effectLayers.get(key) ?? null;
  }

  removeEffectLayer(key, destroy = true) {
    const layer = this.effectLayers.get(key);
    if (!layer) return;
    layer.parent?.removeChild(layer);
    if (destroy) layer.destroy?.({ children: true });
    this.effectLayers.delete(key);
  }

  clearEffectLayers() {
    for (const key of [...this.effectLayers.keys()]) {
      this.removeEffectLayer(key, true);
    }
  }

  ensureCommonFxLayers() {}

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

    for (const layer of this.effectLayers.values()) {
      layer.visible = true;
      layer.alpha = 0;
    }
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

  spawnParticle(data = {}) {
    const {
      parent = "fx",
      shape = "circle",
      x = 0,
      y = 0,
      radius = 2,
      color = COLORS.white,
      alpha = 1,
      vx = 0,
      vy = 0,
      vr = 0,
      life = 600,
      scaleFrom = 1,
      scaleTo = 0.2
    } = data;

    const target = this[parent];
    if (!target) throw new Error(`Unknown particle parent container: ${parent}`);

    const sprite = new PIXI.Graphics();

    if (shape === "star") {
      gStar(sprite, 0, 0, 4, radius * 2.4, radius, color, alpha);
    } else {
      gCircle(sprite, 0, 0, radius, color, alpha);
    }

    sprite.x = x;
    sprite.y = y;
    target.addChild(sprite);

    this.particles.push({
      sprite,
      age: 0,
      life,
      vx,
      vy,
      vr,
      scaleFrom,
      scaleTo,
      startAlpha: alpha
    });

    return sprite;
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

    return { texture: rt, bounds };
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
      localPts.push(points[i] - shard.x, points[i + 1] - shard.y);
    }

    const mask = new PIXI.Graphics();
    gPoly(mask, localPts, COLORS.white, 1);

    const edge = new PIXI.Graphics();
    gPoly(edge, localPts, null, 1, 1.25, COLORS.iceBright, 0.65);

    const gloss = new PIXI.Graphics();
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

    gPoly(gloss, glossPts, COLORS.white, 0.10);

    shard.addChild(sprite);
    shard.addChild(mask);
    shard.addChild(edge);
    shard.addChild(gloss);
    sprite.mask = mask;

    return { shard, cx, cy };
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
    const glow = 0.48 + Math.sin((this.elapsed / 1000) * 4.8 + this.floatSeed) * 0.08;
    const shinePulse = ((this.elapsed / 1000) + this.shineSeed) % 1.85;
    const shineT = clamp01((shinePulse - 0.15) / 0.55);

    this.root.position.set(this.baseX, this.baseY + bob);
    this.root.alpha = 1;
    this.motion.scale.set(this.baseScale);
    this.motion.rotation = this.baseRotation + (this.isFumble ? Math.sin((this.elapsed / 1000) * 6.2) * 0.004 : 0);

    this.innerGlow.alpha = glow;
    this.shine.alpha = shinePulse > 0.15 && shinePulse < 0.70 ? Math.sin(shineT * Math.PI) * 0.30 : 0;
    this.shine.x = lerp(-this.mainWidth * 0.7, this.mainWidth * 0.7, easeInOutQuad(shineT));

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
      if (!p?.sprite || p.sprite.destroyed) {
        this.particles.splice(i, 1);
        continue;
      }

      p.age += dtMS;
      const t = clamp01(p.age / p.life);

      p.sprite.x += p.vx * (dtMS / 1000);
      p.sprite.y += p.vy * (dtMS / 1000);
      p.sprite.rotation += p.vr ?? 0;

      const scale = lerp(p.scaleFrom ?? 1, p.scaleTo ?? 0.3, t);
      p.sprite.scale.set(scale);
      p.sprite.alpha = (p.startAlpha ?? 1) * (1 - easeInQuad(t));

      if (p.age >= p.life) {
        try {
          p.sprite.parent?.removeChild(p.sprite);

          // Optionnel mais propre pour un Graphics
          if (typeof p.sprite.clear === "function") p.sprite.clear();

          p.sprite.visible = false;
          p.sprite.renderable = false;
        } catch (err) {
          console.warn(`${MODULE_ID} | Erreur nettoyage particule expirée :`, err);
        }

        this.particles.splice(i, 1);
      }
    }
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    try {
      this.effect.onDestroy?.(this);
    } catch (err) {
      console.warn(`${MODULE_ID} | Erreur onDestroy effet :`, err);
    }

    for (const p of this.particles) {
      try {
        if (!p?.sprite || p.sprite.destroyed) continue;

        p.sprite.parent?.removeChild(p.sprite);
        if (typeof p.sprite.clear === "function") p.sprite.clear();
        p.sprite.visible = false;
        p.sprite.renderable = false;
      } catch (err) {
        console.warn(`${MODULE_ID} | Erreur nettoyage particule :`, err);
      }
    }
    this.particles = [];

    try {
      this.clearEffectLayers();
    } catch (err) {
      console.warn(`${MODULE_ID} | Erreur clearEffectLayers :`, err);
    }

    try {
      this.root.parent?.removeChild(this.root);
      this.root.destroy({ children: true });
    } catch (err) {
      console.warn(`${MODULE_ID} | Erreur destruction root :`, err);
    }
  }
}