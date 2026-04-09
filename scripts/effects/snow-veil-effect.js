import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";

export class SnowVeilEffect extends BaseRubanEffect {
  static effectId = "snowVeil";
  static effectTypes = ["critical"];
  
  getExitDuration(type) {
    return 1200;
  }

  setup(banner) {
    banner.addEffectLayer("frostLines", this.drawFrostLines(banner), {
      parent: "bodyGroup",
      alpha: 0
    });

    banner.addEffectLayer("freezeOverlay", this.drawFreezeOverlay(banner), {
      parent: "bodyGroup",
      alpha: 0
    });

    banner.addEffectLayer("freezeFlash", this.drawFreezeFlash(banner), {
      parent: "bodyGroup",
      alpha: 0
    });
  }

  onHold(banner, t) {
    const pulse = (Math.sin((banner.elapsed / 1000) * 3.0) + 1) * 0.5;

    const frostLines = banner.getEffectLayer("frostLines");
    const freezeOverlay = banner.getEffectLayer("freezeOverlay");
    const freezeFlash = banner.getEffectLayer("freezeFlash");

    if (frostLines) frostLines.alpha = 0.10 + Math.sin(t * Math.PI) * 0.06;
    if (freezeOverlay) freezeOverlay.alpha = 0.28 + t * 0.22;
    if (freezeFlash) freezeFlash.alpha = 0;

    banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, CriticalRubanUtils.COLORS.iceBright, 0.30 + t * 0.16);
    banner.innerGlow.alpha = 0.50 + pulse * 0.06;

    if (Math.random() < 0.38) this.spawnIceDust(banner, 3);
  }

  onPrepareExit(banner) {
    banner.resetVisualState();
    banner.bodyGroup.visible = true;
    banner.bodyGroup.alpha = 1;

    const frostLines = banner.getEffectLayer("frostLines");
    const freezeOverlay = banner.getEffectLayer("freezeOverlay");
    const freezeFlash = banner.getEffectLayer("freezeFlash");

    if (frostLines) frostLines.alpha = 0.14;
    if (freezeOverlay) freezeOverlay.alpha = 0.44;
    if (freezeFlash) freezeFlash.alpha = 0;

    this.spawnIceDust(banner, 36);
  }

  onExit(banner, t) {
    const freezeT = CriticalRubanUtils.clamp01(t / 0.38);
    const fadeT = CriticalRubanUtils.clamp01((t - 0.38) / 0.62);

    const frostLines = banner.getEffectLayer("frostLines");
    const freezeOverlay = banner.getEffectLayer("freezeOverlay");
    const freezeFlash = banner.getEffectLayer("freezeFlash");

    if (t <= 0.38) {
      const e = CriticalRubanUtils.easeOutCubic(freezeT);
      const flashT = CriticalRubanUtils.clamp01((freezeT - 0.78) / 0.22);

      banner.root.alpha = 1;
      banner.root.position.set(banner.baseX, banner.baseY);
      banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.018, e));
      banner.motion.rotation = banner.baseRotation;

      banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, CriticalRubanUtils.COLORS.ice, e * 0.42);
      banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.48, 0.24, e);
      banner.bodyGroup.alpha = CriticalRubanUtils.lerp(1, 0.82, e);
      banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0, 0.24);

      if (frostLines) frostLines.alpha = CriticalRubanUtils.lerp(0.14, 0.60, e);
      if (freezeOverlay) freezeOverlay.alpha = CriticalRubanUtils.lerp(0.44, 0.92, e);
      if (freezeFlash) freezeFlash.alpha = Math.sin(flashT * Math.PI) * 0.34;

      if (Math.random() < 0.16) this.spawnIceDust(banner, 1);
      return;
    }

    const e = CriticalRubanUtils.easeInQuad(fadeT);

    banner.root.alpha = 1 - e;
    banner.root.position.set(
      banner.baseX + CriticalRubanUtils.lerp(0, 28, e),
      banner.baseY + CriticalRubanUtils.lerp(0, -10, e)
    );
    banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1.018, 1.05, e));
    banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(0, 0.012, e);

    banner.motion.tint = CriticalRubanUtils.mixHex(CriticalRubanUtils.COLORS.ice, CriticalRubanUtils.COLORS.iceBright, fadeT * 0.18);
    banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.24, 0.0, e);
    banner.bodyGroup.alpha = CriticalRubanUtils.lerp(0.82, 0.16, e);
    banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0, 0.28);

    if (frostLines) frostLines.alpha = CriticalRubanUtils.lerp(0.60, 0, e);
    if (freezeOverlay) freezeOverlay.alpha = CriticalRubanUtils.lerp(0.92, 0.06, e);
    if (freezeFlash) freezeFlash.alpha = 0;

    if (Math.random() < (fadeT < 0.45 ? 0.40 : 0.18)) {
      this.spawnIceDust(banner, 2);
    }
  }

  onDestroy(banner) {
    banner.motion.tint = 0xffffff;
  }


  makeBannerBodyPath(banner, inset = 0) {
    const x = -banner.mainWidth / 2 + inset;
    const y = -banner.height / 2 + inset;
    const w = banner.mainWidth - inset * 2;
    const h = banner.height - inset * 2;
    const topInset = Math.max(8, 18 - inset * 0.35);
    const sideBulge = Math.max(4, 10 - inset * 0.20);
    const lowerDip = Math.max(3, 8 - inset * 0.15);
    return { x, y, w, h, topInset, sideBulge, lowerDip };
  }

  drawBodyShape(g, banner, {
    inset = 0,
    fill = null,
    fillAlpha = 1,
    lineWidth = 0,
    lineColor = 0x000000,
    lineAlpha = 1
  } = {}) {
    const { x, y, w, h, topInset, sideBulge, lowerDip } = this.makeBannerBodyPath(banner, inset);

    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fill !== null) g.beginFill(fill, fillAlpha);

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

    if (fill !== null) g.endFill();
    return g;
  }

  drawTailShape(g, banner, isLeft, {
    inset = 0,
    fill = null,
    fillAlpha = 1,
    lineWidth = 0,
    lineColor = 0x000000,
    lineAlpha = 1
  } = {}) {
    const sign = isLeft ? -1 : 1;
    const h = banner.height * 0.76 - inset * 0.8;
    const halfH = h / 2;
    const w = banner.tailWidth + 18 - inset * 0.45;

    if (lineWidth > 0) g.lineStyle(lineWidth, lineColor, lineAlpha);
    if (fill !== null) g.beginFill(fill, fillAlpha);

    g.moveTo(sign * Math.max(0, 4 - inset * 0.3), -halfH + Math.max(0, 4 - inset * 0.3));
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
      sign * Math.max(0, 4 - inset * 0.3), halfH - Math.max(0, 4 - inset * 0.3)
    );
    g.bezierCurveTo(
      sign * 12, halfH * 0.32,
      sign * 12, -halfH * 0.32,
      sign * Math.max(0, 4 - inset * 0.3), -halfH + Math.max(0, 4 - inset * 0.3)
    );

    if (fill !== null) g.endFill();
    return g;
  }

  drawFreezeOverlay(banner) {
    const c = new PIXI.Container();
    const frostColor = CriticalRubanUtils.mixHex(CriticalRubanUtils.COLORS.iceBright, 0x2b4f7a, 0.70);
    const deepFrost = 0x173250;
    const rim = CriticalRubanUtils.mixHex(CriticalRubanUtils.COLORS.white, CriticalRubanUtils.COLORS.iceBright, 0.55);

    // Aura proche de la silhouette réelle du ruban
    const auraBody = new PIXI.Graphics();
    this.drawBodyShape(auraBody, banner, {
      inset: -10,
      fill: CriticalRubanUtils.COLORS.iceBright,
      fillAlpha: 0.18
    });

    const auraBody2 = new PIXI.Graphics();
    this.drawBodyShape(auraBody2, banner, {
      inset: -4,
      fill: CriticalRubanUtils.COLORS.white,
      fillAlpha: 0.08
    });

    const makeAuraTail = (isLeft) => {
      const tail = new PIXI.Container();

      const outer = new PIXI.Graphics();
      this.drawTailShape(outer, banner, isLeft, {
        inset: -10,
        fill: CriticalRubanUtils.COLORS.iceBright,
        fillAlpha: 0.16
      });

      const inner = new PIXI.Graphics();
      this.drawTailShape(inner, banner, isLeft, {
        inset: -4,
        fill: CriticalRubanUtils.COLORS.white,
        fillAlpha: 0.07
      });

      tail.addChild(outer, inner);
      return tail;
    };

    const auraLeft = makeAuraTail(true);
    const auraRight = makeAuraTail(false);

    auraLeft.x = -banner.mainWidth / 2 - 14;
    auraRight.x = banner.mainWidth / 2 + 14;

    const bodyBase = new PIXI.Graphics();
    this.drawBodyShape(bodyBase, banner, {
      inset: 2,
      fill: deepFrost,
      fillAlpha: 0.44
    });

    const bodyFrost = new PIXI.Graphics();
    this.drawBodyShape(bodyFrost, banner, {
      inset: 2,
      fill: frostColor,
      fillAlpha: 0.52,
      lineWidth: 2,
      lineColor: rim,
      lineAlpha: 0.28
    });

    const bodyShine = new PIXI.Graphics();
    this.drawBodyShape(bodyShine, banner, {
      inset: 10,
      fill: CriticalRubanUtils.COLORS.white,
      fillAlpha: 0.16
    });

    const makeTail = (isLeft) => {
      const tail = new PIXI.Container();

      const base = new PIXI.Graphics();
      this.drawTailShape(base, banner, isLeft, {
        inset: 2,
        fill: deepFrost,
        fillAlpha: 0.36
      });

      const frost = new PIXI.Graphics();
      this.drawTailShape(frost, banner, isLeft, {
        inset: 2,
        fill: frostColor,
        fillAlpha: 0.44,
        lineWidth: 2,
        lineColor: rim,
        lineAlpha: 0.24
      });

      const shine = new PIXI.Graphics();
      this.drawTailShape(shine, banner, isLeft, {
        inset: 8,
        fill: CriticalRubanUtils.COLORS.white,
        fillAlpha: 0.10
      });

      tail.addChild(base, frost, shine);
      return tail;
    };

    const left = makeTail(true);
    const right = makeTail(false);

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    c.addChild(
      auraBody,
      auraBody2,
      auraLeft,
      auraRight,
      bodyBase,
      bodyFrost,
      bodyShine,
      left,
      right
    );

    return c;
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

  drawFreezeFlash(banner) {
    const c = new PIXI.Container();

    const body = new PIXI.Graphics();
    this.drawBodyShape(body, banner, {
      inset: 0,
      fill: CriticalRubanUtils.COLORS.white,
      fillAlpha: 0.56
    });

    const left = new PIXI.Graphics();
    this.drawTailShape(left, banner, true, {
      inset: 0,
      fill: CriticalRubanUtils.COLORS.white,
      fillAlpha: 0.42
    });

    const right = new PIXI.Graphics();
    this.drawTailShape(right, banner, false, {
      inset: 0,
      fill: CriticalRubanUtils.COLORS.white,
      fillAlpha: 0.34
    });

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    const star = new PIXI.Graphics();
    CriticalRubanUtils.gStar(star, 0, 0, 4, 22, 8, CriticalRubanUtils.COLORS.white, 0.28);

    c.addChild(body, left, right, star);
    return c;
  }

  spawnIceDust(banner, count = 8) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        x:CriticalRubanUtils.randomBetween(-banner.mainWidth / 2 - 10, banner.mainWidth / 2 + 10),
        y:CriticalRubanUtils.randomBetween(-banner.height * 0.75, banner.height * 0.20),
        radius:CriticalRubanUtils.randomBetween(1.4, 3.4),
        color: Math.random() < 0.72 ? CriticalRubanUtils.COLORS.white : CriticalRubanUtils.COLORS.iceBright,
        alpha:CriticalRubanUtils.randomBetween(0.70, 1.0),
        vx:CriticalRubanUtils.randomBetween(-14, 14),
        vy:CriticalRubanUtils.randomBetween(20, 72),
        vr:CriticalRubanUtils.randomBetween(-0.03, 0.03),
        life:CriticalRubanUtils.randomBetween(900, 1700),
        scaleFrom:CriticalRubanUtils.randomBetween(0.9, 1.2),
        scaleTo: 0.10
      });
    }
  }

  onExit(banner, t) {
      const freezeT = CriticalRubanUtils.clamp01(t / 0.38);
      const fadeT = CriticalRubanUtils.clamp01((t - 0.38) / 0.62);

      const frostLines = banner.getEffectLayer("frostLines");
      const freezeOverlay = banner.getEffectLayer("freezeOverlay");
      const freezeFlash = banner.getEffectLayer("freezeFlash");

      if (t <= 0.38) {
        const e = CriticalRubanUtils.easeOutCubic(freezeT);
        const flashT = CriticalRubanUtils.clamp01((freezeT - 0.78) / 0.22);

        banner.root.alpha = 1;
        banner.root.position.set(banner.baseX, banner.baseY);
        banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.018, e));
        banner.motion.rotation = banner.baseRotation;

        banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, CriticalRubanUtils.COLORS.ice, e * 0.42);
        banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.48, 0.24, e);
        banner.bodyGroup.alpha = CriticalRubanUtils.lerp(1, 0.82, e);
        banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0, 0.24);

        if (frostLines) frostLines.alpha = CriticalRubanUtils.lerp(0.14, 0.60, e);
        if (freezeOverlay) freezeOverlay.alpha = CriticalRubanUtils.lerp(0.44, 0.92, e);
        if (freezeFlash) freezeFlash.alpha = Math.sin(flashT * Math.PI) * 0.34;

        if (Math.random() < 0.16) this.spawnIceDust(banner, 1);
        return;
      }

      const e = CriticalRubanUtils.easeInQuad(fadeT);

      banner.root.alpha = 1 - e;
      banner.root.position.set(
        banner.baseX + CriticalRubanUtils.lerp(0, 28, e),
        banner.baseY + CriticalRubanUtils.lerp(0, -10, e)
      );
      banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1.018, 1.05, e));
      banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(0, 0.012, e);

      banner.motion.tint = CriticalRubanUtils.mixHex(CriticalRubanUtils.COLORS.ice, CriticalRubanUtils.COLORS.iceBright, fadeT * 0.18);
      banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.24, 0.0, e);
      banner.bodyGroup.alpha = CriticalRubanUtils.lerp(0.82, 0.16, e);
      banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0, 0.28);

      if (frostLines) frostLines.alpha = CriticalRubanUtils.lerp(0.60, 0, e);
      if (freezeOverlay) freezeOverlay.alpha = CriticalRubanUtils.lerp(0.92, 0.06, e);
      if (freezeFlash) freezeFlash.alpha = 0;

      if (Math.random() < (fadeT < 0.45 ? 0.40 : 0.18)) {
        this.spawnIceDust(banner, 2);
      }
    }

  onDestroy(banner) {
      banner.motion.tint = 0xffffff;
    }
}
