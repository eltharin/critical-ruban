import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";


export class FrozenShatterEffectLegacy extends BaseRubanEffect {
  static effectId = "frozenShatter";
  static effectTypes = ["fumble"];
    
  getExitDuration(type) {
    return 1350;
  }

  drawFrostLines(banner) {
    const g = new PIXI.Graphics();
    const x0 = -banner.mainWidth / 2 + 18;
    const x1 = banner.mainWidth / 2 - 18;
    const y0 = -banner.height / 2 + 16;
    const y1 = banner.height / 2 - 16;

    CriticalRubanUtils.gLineStyle(g, 2, CriticalRubanUtils.COLORS.iceBright, 0.55);
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

  drawFreezeOverlay(banner) {
    const g = new PIXI.Container();

    const frostColor = CriticalRubanUtils.mixHex(CriticalRubanUtils.COLORS.ice, 0x1e3a5f, 0.80);
    const deepFrost = 0x1E3A5F;

    const x = -banner.mainWidth / 2;
    const y = -banner.height / 2;
    const w = banner.mainWidth;
    const h = banner.height;
    const topInset = 18;
    const sideBulge = 10;

    const bodyBase = new PIXI.Graphics();
    bodyBase.beginFill(deepFrost, 0.50);
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
    bodyFrost.beginFill(frostColor, 0.50);
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
    gloss.beginFill(CriticalRubanUtils.COLORS.white, 0.14);
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
      const th = banner.height * 0.76;
      const halfH = th / 2;
      const tw = banner.tailWidth + 18;

      const tailBase = new PIXI.Graphics();
      tailBase.beginFill(deepFrost, 0.50);
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
      tailFrost.beginFill(frostColor, 0.50);
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
      tailShine.beginFill(CriticalRubanUtils.COLORS.white, 0.09);
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

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    g.addChild(bodyBase, bodyFrost, gloss, left, right);
    return g;
  }

  drawCrackLines(banner) {
    const g = new PIXI.Graphics();
    CriticalRubanUtils.gLineStyle(g, 2, CriticalRubanUtils.COLORS.iceBright, 0.9);

    const xL = -banner.totalWidth / 2;
    const xR = banner.totalWidth / 2;
    const yT = -banner.height / 2;
    const yB = banner.height / 2;

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

  drawShatterFlash(banner) {
    const g = new PIXI.Container();
    const body = new PIXI.Graphics();

    const x = -banner.mainWidth / 2;
    const y = -banner.height / 2;
    const w = banner.mainWidth;
    const h = banner.height;
    const topInset = 18;
    const sideBulge = 10;

    body.beginFill(CriticalRubanUtils.COLORS.white, 0.32);
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
      const th = banner.height * 0.76;
      const halfH = th / 2;
      const tw = banner.tailWidth + 18;

      t.beginFill(CriticalRubanUtils.COLORS.white, 0.24);
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

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    g.addChild(body, left, right);
    return g;
  }

  spawnIceDust(banner, count = 18) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        x: CriticalRubanUtils.randomBetween(-banner.totalWidth * 0.45, banner.totalWidth * 0.45),
        y: CriticalRubanUtils.randomBetween(-banner.height * 0.38, banner.height * 0.38),
        radius: CriticalRubanUtils.randomBetween(1.5, 4.5),
        color: CriticalRubanUtils.COLORS.iceBright,
        alpha: CriticalRubanUtils.randomBetween(0.35, 0.9),
        vx: CriticalRubanUtils.randomBetween(-90, 90),
        vy: CriticalRubanUtils.randomBetween(-120, 20),
        life: CriticalRubanUtils.randomBetween(250, 650),
        scaleFrom: 1,
        scaleTo: 0.3
      });
    }
  }

  getShatterPolygons(banner) {
    const bodyL = -banner.mainWidth / 2;
    const totalL = -banner.totalWidth / 2;
    const totalR = banner.totalWidth / 2;
    const yT = -banner.height / 2;
    const yB = banner.height / 2;
    const bx = (r) => bodyL + banner.mainWidth * r;

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

  createShatterShards(banner) {
    const existing = banner.getEffectLayer("frozenShards");
    if (existing) return existing._shards ?? [];

    const snapshot = banner.captureBodyGroupTexture();
    if (!snapshot?.texture || !snapshot?.bounds) return [];

    const shardContainer = new PIXI.Container();
    banner.addEffectLayer("frozenShards", shardContainer, { parent: "fx", alpha: 1, visible: true });

    const pieces = [];
    const polys = this.getShatterPolygons(banner);

    for (const pts of polys) {
      const { shard, cx } = banner.createTexturedShard(pts, snapshot.texture, snapshot.bounds);
      shardContainer.addChild(shard);

      const dir = Math.sign(cx) || (Math.random() > 0.5 ? 1 : -1);
      const isTail = Math.abs(cx) > (banner.mainWidth / 2);

      pieces.push({
        sprite: shard,
        vx: CriticalRubanUtils.randomBetween(12, 42) * dir * (isTail ? 1.35 : 1),
        vy: CriticalRubanUtils.randomBetween(15, 45),
        gravity: CriticalRubanUtils.randomBetween(580, 760),
        delay: CriticalRubanUtils.randomBetween(0, 35)
      });
    }

    shardContainer._shards = pieces;
    shardContainer._snapshot = snapshot.texture;
    return pieces;
  }

  setup(banner) {
    banner.addEffectLayer("frostLines", this.drawFrostLines(banner), { parent: "bodyGroup", alpha: 0 });
    banner.addEffectLayer("freezeOverlay", this.drawFreezeOverlay(banner), { parent: "bodyGroup", alpha: 0 });
    banner.addEffectLayer("crackLines", this.drawCrackLines(banner), { parent: "bodyGroup", alpha: 0 });
    banner.addEffectLayer("shatterFlash", this.drawShatterFlash(banner), { parent: "bodyGroup", alpha: 0 });
  }

  onHold(banner, t) {
    const frostLines = banner.getEffectLayer("frostLines");
    if (frostLines) frostLines.alpha = 0.10 + Math.sin(t * Math.PI) * 0.06;
  }

  onPrepareExit(banner) {
    banner.resetVisualState();
    banner.bodyGroup.visible = true;
    banner.bodyGroup.alpha = 1;

    const frozenShards = banner.getEffectLayer("frozenShards");
    if (frozenShards) {
      for (const s of frozenShards._shards ?? []) s.sprite.destroy?.();
      if (frozenShards._snapshot) frozenShards._snapshot.destroy(true);
      banner.removeEffectLayer("frozenShards");
    }

    this.spawnIceDust(banner, 12);
  }

  onExit(banner, t, dtMS) {
    const freezeT = CriticalRubanUtils.clamp01(t / 0.42);
    const shatterT = CriticalRubanUtils.clamp01((t - 0.42) / 0.58);

    const frostLines = banner.getEffectLayer("frostLines");
    const freezeOverlay = banner.getEffectLayer("freezeOverlay");
    const crackLines = banner.getEffectLayer("crackLines");
    const shatterFlash = banner.getEffectLayer("shatterFlash");

    if (t <= 0.42) {
      const e = CriticalRubanUtils.easeOutCubic(freezeT);
      const flashT = CriticalRubanUtils.clamp01((freezeT - 0.84) / 0.16);

      if (shatterFlash) shatterFlash.alpha = Math.sin(flashT * Math.PI) * 0.35;
      banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, CriticalRubanUtils.COLORS.ice, e * 0.35);

      banner.root.alpha = 1;
      banner.root.position.set(banner.baseX, banner.baseY);
      banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.015, e));
      banner.motion.rotation = banner.baseRotation;

      banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.48, 0.18, e);
      banner.bodyGroup.alpha = CriticalRubanUtils.lerp(1, 0.7, e);
      banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0, 0.25);

      if (frostLines) frostLines.alpha = CriticalRubanUtils.lerp(0.08, 0.72, e);
      if (freezeOverlay) freezeOverlay.alpha = CriticalRubanUtils.lerp(0, 1.15, e);
      if (crackLines) crackLines.alpha = CriticalRubanUtils.lerp(0, 1.25, Math.max(0, freezeT - 0.28) / 0.72);

      if (Math.random() < 0.18) this.spawnIceDust(banner, 1);
      return;
    }

    let frozenShards = banner.getEffectLayer("frozenShards");
    if (!frozenShards) {
      this.createShatterShards(banner);
      frozenShards = banner.getEffectLayer("frozenShards");

      banner.bodyGroup.visible = false;
      if (freezeOverlay) freezeOverlay.visible = false;
      if (crackLines) crackLines.visible = false;
      if (shatterFlash) shatterFlash.visible = false;

      this.spawnIceDust(banner, 18);
    }

    const shards = frozenShards?._shards ?? [];

    banner.root.alpha = 1 - CriticalRubanUtils.easeInQuad(shatterT) * 0.08;
    banner.root.position.set(banner.baseX, banner.baseY);
    banner.motion.scale.set(banner.baseScale);
    banner.motion.rotation = banner.baseRotation;

    const dt = (dtMS ?? banner.lastDtMS ?? 16.67) / 1000;

    for (const s of shards) {
      if (s.delay > 0) {
        s.delay -= (dtMS ?? banner.lastDtMS ?? 16.67);
        continue;
      }

      s.vy += s.gravity * dt;
      s.sprite.x += s.vx * dt;
      s.sprite.y += s.vy * dt;
      s.sprite.alpha = 1 - CriticalRubanUtils.easeInQuad(shatterT);
    }
  }

  onDestroy(banner) {
    const frozenShards = banner.getEffectLayer("frozenShards");
    if (frozenShards?._snapshot) frozenShards._snapshot.destroy(true);
  }
}
