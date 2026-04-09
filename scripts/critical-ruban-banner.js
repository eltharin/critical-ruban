import { effectManager } from "./effects/effect-manager.js";
import { CriticalRubanUtils } from "./critical-ruban-utils.js";

export class CritBanner {
  constructor({ slotIndex, type, label, name, color, exitEffect }) {
    this.slotIndex = slotIndex;
    this.type = type;
        
    this.label = `${label} : ${name}`;

    this.exitEffect = effectManager.validateForType(this.type, exitEffect);
    this.effect = effectManager.get(this.exitEffect);

    this.baseColorHex = CriticalRubanUtils.cssToHex(CriticalRubanUtils.normalizeHexColor(color) ?? "#8b0000");
    this.mainColor = this.isType("fumble") ? CriticalRubanUtils.mixHex(this.baseColorHex, CriticalRubanUtils.COLORS.red, 0.35) : this.baseColorHex;
    this.darkColor = CriticalRubanUtils.darkenHex(this.mainColor, 0.28);
    this.darkerColor = CriticalRubanUtils.darkenHex(this.mainColor, 0.45);
    this.lightColor = CriticalRubanUtils.lightenHex(this.mainColor, 0.20);
    this.accentColor = this.isType("fumble") ? CriticalRubanUtils.COLORS.red : CriticalRubanUtils.COLORS.gold;

    this.enterDuration = this.effect.getEnterDuration(type);
    this.holdDuration = this.effect.getHoldDuration(type);
    this.exitDuration = this.effect.getExitDuration(type);

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

  isType(type) {
    return this.type === type;
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

    this.badgeSize = Math.max(84, textHeight + 34);
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
      fill: CriticalRubanUtils.COLORS.white,
      stroke: 0x1c1308,
      strokeThickness: this.isType("fumble") ? 5 : 4,
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
    CriticalRubanUtils.gRoundRect(g, x, y, this.mainWidth - 16, (this.height - 16) * 0.56, 12, this.lightColor, 0.33);
    return g;
  }

  drawTopEdge() {
    const g = new PIXI.Graphics();
    const x = -this.mainWidth / 2 + 12;
    const y = -this.height / 2 + 8;
    CriticalRubanUtils.gRoundRect(g, x, y, this.mainWidth - 24, 6, 4, CriticalRubanUtils.COLORS.white, 0.18);
    return g;
  }

  drawBottomEdge() {
    const g = new PIXI.Graphics();
    const x = -this.mainWidth / 2 + 10;
    const y = this.height / 2 - 12;
    CriticalRubanUtils.gRoundRect(g, x, y, this.mainWidth - 20, 6, 4, this.darkerColor, 0.7);
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
    gloss.beginFill(CriticalRubanUtils.COLORS.white, 0.08);
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

    const iconPath = this.isType("fumble")
      ? `modules/${CriticalRubanUtils.MODULE_ID}/assets/fumble.svg`
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
    CriticalRubanUtils.gRoundRect(g, -shineWidth / 2, -this.height / 2 + 8, shineWidth, this.height - 16, 12, CriticalRubanUtils.COLORS.white, 0.22);
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
      color = CriticalRubanUtils.COLORS.white,
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
      CriticalRubanUtils.gStar(sprite, 0, 0, 4, radius * 2.4, radius, color, alpha);
    } else {
      CriticalRubanUtils.gCircle(sprite, 0, 0, radius, color, alpha);
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
      -this.bodyGroup.width/2,
      -this.bodyGroup.height / 2,
      this.bodyGroup.width,
      this.bodyGroup.height
    );

    const rt = PIXI.RenderTexture.create({
      width: this.bodyGroup.width+2,
      height: this.bodyGroup.height+2,
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

  createTexturedShard(points, texture, sourceBounds, borderColor = null) {
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

    const pad = 0;

    const rawFrameX = Math.floor(minX - (-this.bodyGroup.width/2) - pad);
    const rawFrameY = Math.floor(minY - (-this.bodyGroup.height/2) - pad);
    const rawFrameW = Math.ceil(maxX - minX + pad * 2);
    const rawFrameH = Math.ceil(maxY - minY + pad * 2);

    const base = texture.baseTexture;
    const frameX = Math.max(0, Math.min(rawFrameX, this.bodyGroup.width));
    const frameY = Math.max(0, Math.min(rawFrameY, this.bodyGroup.height));
    const frameW = Math.max(1, Math.min(rawFrameW - (frameX - rawFrameX), this.bodyGroup.width - frameX));
    const frameH = Math.max(1, Math.min(rawFrameH - (frameY - rawFrameY), this.bodyGroup.height - frameY));

    const shiftX = frameX - rawFrameX;
    const shiftY = frameY - rawFrameY;

    const frame = new PIXI.Rectangle(frameX, frameY, frameW, frameH);
    const croppedTexture = new PIXI.Texture(base, frame);

    const shard = new PIXI.Container();
    shard.x = minX - pad;
    shard.y = minY - pad;

    const localPts = [];
    for (let i = 0; i < points.length; i += 2) {
      localPts.push(points[i] - shard.x - shiftX, points[i + 1] - shard.y - shiftY);
    }

    const sprite = new PIXI.Sprite(croppedTexture);
    sprite.x = 0;
    sprite.y = 0;

    const mask = new PIXI.Graphics();
    CriticalRubanUtils.gPoly(mask, localPts, CriticalRubanUtils.COLORS.white, 1);

    const gloss = new PIXI.Graphics();
    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
    const glossPts = [];

    for (let i = 0; i < localPts.length; i += 2) {
      const px = localPts[i];
      const py = localPts[i + 1];
      const localCx = cx - shard.x - shiftX;
      const localCy = cy - shard.y - shiftY;

      glossPts.push(
        CriticalRubanUtils.lerp(localCx, px, 0.58),
        CriticalRubanUtils.lerp(localCy, py, 0.58)
      );
    }

    CriticalRubanUtils.gPoly(gloss, glossPts, CriticalRubanUtils.COLORS.white, 0.10);

    
    shard.addChild(sprite);
    shard.addChild(mask);
    shard.addChild(gloss);
    sprite.mask = mask;

    return { shard, cx, cy };
  }

  applySlot() {
    const screen = canvas?.app?.renderer?.screen ?? {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const slot = CriticalRubanUtils.BANNER_SLOTS[this.slotIndex] ?? CriticalRubanUtils.BANNER_SLOTS[0];
    const userScale = (game.settings.get(CriticalRubanUtils.MODULE_ID, "bannerScale") ?? 100) / 100;
    const {isCustomPos = false, bannerPosX = 0, bannerPosY = 0} = game.settings.get(CriticalRubanUtils.MODULE_ID, "customPosition") || {};

    let anchorX = 0.5;
    let anchorY = 0.5;

    if (isCustomPos && bannerPosX !== null && bannerPosY !== null) {
      anchorX = bannerPosX;
      anchorY = bannerPosY;
    }

    const offsetX = (slot.x - 0.5) * screen.width * userScale;
    const offsetY = (slot.y - 0.5) * screen.height * userScale;

    this.baseX = screen.width * anchorX + offsetX;
    this.baseY = screen.height * anchorY + offsetY;
    this.baseScale = slot.scale * userScale;
    this.baseRotation = slot.rotation;

    this.root.position.set(this.baseX, this.baseY);
    this.motion.scale.set(this.baseScale);
    this.motion.rotation = this.baseRotation;
  }

  update(dtMS) {
    if (this.isPreview) {
      this.elapsed += dtMS;
      this.stateTime += dtMS;
      this.lastDtMS = dtMS;

      const glow = 0.48 + Math.sin((this.elapsed / 1000) * 4.8 + this.floatSeed) * 0.08;
      const shinePulse = ((this.elapsed / 1000) + this.shineSeed) % 1.85;
      const shineT = CriticalRubanUtils.clamp01((shinePulse - 0.15) / 0.55);

      this.root.alpha = 1;
      this.motion.scale.set(this.baseScale);
      this.motion.rotation = this.baseRotation;
      this.motion.tint = 0xffffff;

      this.innerGlow.alpha = glow;
      this.shine.alpha = shinePulse > 0.15 && shinePulse < 0.70
        ? Math.sin(shineT * Math.PI) * 0.30
        : 0;
      this.shine.x = CriticalRubanUtils.lerp(-this.mainWidth * 0.7, this.mainWidth * 0.7, CriticalRubanUtils.easeInOutQuad(shineT));

      this.effect.onHold?.(this, 0, dtMS);
      this.updateParticles(dtMS);
      return;
    }

    this.elapsed += dtMS;
    this.stateTime += dtMS;
    this.lastDtMS = dtMS;

    if (this.state === "enter") {
      this.updateEnter(dtMS);
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

  updateEnter(dtMS) {
    const t = CriticalRubanUtils.clamp01(this.stateTime / this.enterDuration);
    this.effect.onEnter?.(this, t, dtMS);
  }

  updateHold(dtMS) {
    const t = CriticalRubanUtils.clamp01(this.stateTime / this.holdDuration);
    this.effect.onHold?.(this, t, dtMS);
  }

  updateExit(dtMS) {
    const t = CriticalRubanUtils.clamp01(this.stateTime / this.exitDuration);
    this.effect.onExit?.(this, t, dtMS);
  }

  updateParticles(dtMS) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (!p?.sprite || p.sprite.destroyed) {
        this.particles.splice(i, 1);
        continue;
      }

      p.age += dtMS;
      const t = CriticalRubanUtils.clamp01(p.age / p.life);

      p.sprite.x += p.vx * (dtMS / 1000);
      p.sprite.y += p.vy * (dtMS / 1000);
      p.sprite.rotation += p.vr ?? 0;
            const scale = CriticalRubanUtils.lerp(p.scaleFrom ?? 1, p.scaleTo ?? 0.3, t);
      p.sprite.scale.set(scale);
      p.sprite.alpha = (p.startAlpha ?? 1) * (1 - CriticalRubanUtils.easeInQuad(t));

      if (p.age >= p.life) {
        try {
          p.sprite.parent?.removeChild(p.sprite);

          // Optionnel mais propre pour un Graphics
          if (typeof p.sprite.clear === "function") p.sprite.clear();

          p.sprite.visible = false;
          p.sprite.renderable = false;
        } catch (err) {
          console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur nettoyage particule expirée :`, err);
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
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur onDestroy effet :`, err);
    }

    for (const p of this.particles) {
      try {
        if (!p?.sprite || p.sprite.destroyed) continue;

        p.sprite.parent?.removeChild(p.sprite);
        if (typeof p.sprite.clear === "function") p.sprite.clear();
        p.sprite.visible = false;
        p.sprite.renderable = false;
      } catch (err) {
        console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur nettoyage particule :`, err);
      }
    }
    this.particles = [];

    try {
      this.clearEffectLayers();
    } catch (err) {
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur clearEffectLayers :`, err);
    }

    try {
      this.root.parent?.removeChild(this.root);
      this.root.destroy({ children: true });
    } catch (err) {
      console.warn(`${CriticalRubanUtils.MODULE_ID} | Erreur destruction root :`, err);
    }
  }
}
