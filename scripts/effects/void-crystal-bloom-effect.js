import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";

export class VoidCrystalBloomEffect extends BaseRubanEffect {
	static effectId = "voidCrystalBloom";
	static effectTypes = ["critical"];
  
  static vars = {
    bloomColor: 0x7a49ff,
    bloomDark: 0x1c1030,
    bloomDeep: 0x35205f,
    bloomMid: 0x7a49ff,
    bloomBright: 0xb88cff,
    bloomEdge: 0xf3e9ff,
    bloomWhite: 0xffffff,
    bloomCore: 0xe4d2ff
  };
  
  getExitDuration(type) {
    return 1200;
  }

  setup(banner) {
		banner.addEffectLayer("bloomOverlay", this.drawBloomOverlay(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("refractedLines", this.drawRefractedLines(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("sweepBeam", this.drawSweepBeam(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("centralFlash", this.drawCentralFlash(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("bloomField", this.createBloomField(banner), {
			parent: "fx",
			alpha: 1
		});
	}

	onHold(banner, t) {
		const crystals = banner.getEffectLayer("bloomField");
		const overlay = banner.getEffectLayer("bloomOverlay");
		const lines = banner.getEffectLayer("refractedLines");
		const sweep = banner.getEffectLayer("sweepBeam");
		const flash = banner.getEffectLayer("centralFlash");

		if (crystals) {
			crystals.visible = true;
			crystals.alpha = 1;
			this.updateBloomField(crystals, t, banner.elapsed, 1, 0.55);

			for (const entry of crystals._entries ?? []) {
				if (entry.sprite.alpha > 0.02) {
					entry.sprite.rotation += entry.rotSpeed * 0.16;
				}
			}
		}

		if (overlay) {
			overlay.alpha = CriticalRubanUtils.lerp(0.08, 0.38, CriticalRubanUtils.easeInOutQuad(t));
		}

		if (lines) {
			lines.alpha = CriticalRubanUtils.lerp(0.08, 0.18, CriticalRubanUtils.easeInOutQuad(t)) + Math.sin((banner.elapsed / 1000) * 3.8) * 0.03;
		}

		if (sweep) {
			const pulse = ((banner.elapsed / 1000) * 0.85) % 1.0;
			sweep.alpha = 0.04 + Math.sin(CriticalRubanUtils.clamp01(pulse) * Math.PI) * 0.12;
			sweep.x = CriticalRubanUtils.lerp(-banner.mainWidth * 0.55, banner.mainWidth * 0.55, CriticalRubanUtils.clamp01(pulse));
		}

		if (flash) {
			flash.alpha = 0.02 + Math.sin((banner.elapsed / 1000) * 4.2) * 0.02;
			flash.scale.set(1 + Math.sin((banner.elapsed / 1000) * 3.6) * 0.04);
		}

		banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, this.constructor.vars.bloomBright, 0.12 + t * 0.12);
		banner.innerGlow.alpha = 0.54 + Math.sin((banner.elapsed / 1000) * 4.6) * 0.06;

		if (Math.random() < 0.26) {
			this.spawnBloomDust(banner, 1);
		}
	}

	onPrepareExit(banner) {
		banner.resetVisualState();

		const crystals = banner.getEffectLayer("bloomField");
		const overlay = banner.getEffectLayer("bloomOverlay");
		const lines = banner.getEffectLayer("refractedLines");
		const sweep = banner.getEffectLayer("sweepBeam");
		const flash = banner.getEffectLayer("centralFlash");

		if (crystals) {
			crystals.visible = true;
			crystals.alpha = 1;
			this.updateBloomField(crystals, 1, banner.elapsed, 1, 0.60);
		}

		if (overlay) overlay.alpha = 0.38;
		if (lines) lines.alpha = 0.22;
		if (sweep) {
			sweep.alpha = 0.08;
			sweep.x = 0;
		}
		if (flash) {
			flash.alpha = 0.04;
			flash.scale.set(1);
		}

		this.spawnBloomDust(banner, 16);
	}

	onExit(banner, t) {
		const crystals = banner.getEffectLayer("bloomField");
		const overlay = banner.getEffectLayer("bloomOverlay");
		const lines = banner.getEffectLayer("refractedLines");
		const sweep = banner.getEffectLayer("sweepBeam");
		const flash = banner.getEffectLayer("centralFlash");

		if (crystals) {
			crystals.visible = true;
			crystals.alpha = 1;
		}

		if (t < 0.38) {
			const e = CriticalRubanUtils.easeOutCubic(t / 0.38);

			banner.root.alpha = 1;
			banner.root.position.set(banner.baseX, banner.baseY);
			banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.022, e));
			banner.motion.rotation = banner.baseRotation;

			if (crystals) {
				this.updateBloomField(crystals, CriticalRubanUtils.lerp(0.70, 1.0, e), banner.elapsed, CriticalRubanUtils.lerp(1.0, 1.34, e), CriticalRubanUtils.lerp(0.60, 0.95, e));

				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha <= 0.01) continue;
					entry.sprite.rotation += entry.rotSpeed * 0.9;
				}
			}

			if (overlay) overlay.alpha = CriticalRubanUtils.lerp(0.38, 0.56, e);
			if (lines) lines.alpha = CriticalRubanUtils.lerp(0.22, 0.46, e);

			if (sweep) {
				sweep.alpha = CriticalRubanUtils.lerp(0.10, 0.42, e);
				sweep.x = CriticalRubanUtils.lerp(-banner.mainWidth * 0.65, banner.mainWidth * 0.30, e);
			}

			if (flash) {
				flash.alpha = CriticalRubanUtils.lerp(0.04, 0.16, e);
				flash.scale.set(CriticalRubanUtils.lerp(1, 1.18, e));
			}

			banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.52, 0.74, e);
			banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, this.constructor.vars.bloomBright, e * 0.28);
			banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0.18, 0.20);

			if (Math.random() < 0.24) this.spawnBloomDust(banner, 2);
			return;
		}

		if (t < 0.68) {
			const e = CriticalRubanUtils.clamp01((t - 0.38) / 0.30);

			banner.root.alpha = 1;
			banner.root.position.set(banner.baseX, banner.baseY + Math.sin(banner.elapsed * 0.006) * 0.8);
			banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1.022, 1.05, e));
			banner.motion.rotation = banner.baseRotation + Math.sin(banner.elapsed * 0.0032) * 0.006;

			if (crystals) {
				this.updateBloomField(crystals, 1, banner.elapsed, CriticalRubanUtils.lerp(1.34, 1.56, e), CriticalRubanUtils.lerp(0.95, 1.15, e));

				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha <= 0.01) continue;

					const pulse = 1 + Math.sin(banner.elapsed * 0.016 + entry.baseX * 0.024) * 0.06;
					entry.sprite.scale.x *= pulse;
					entry.sprite.scale.y *= pulse;
					entry.sprite.rotation += entry.rotSpeed * 1.2;
				}
			}

			if (overlay) overlay.alpha = CriticalRubanUtils.lerp(0.56, 0.70, e);
			if (lines) lines.alpha = CriticalRubanUtils.lerp(0.46, 0.58, e);

			if (sweep) {
				sweep.alpha = CriticalRubanUtils.lerp(0.42, 0.18, e);
				sweep.x = CriticalRubanUtils.lerp(banner.mainWidth * 0.30, banner.mainWidth * 0.72, e);
			}

			if (flash) {
				flash.alpha = Math.sin(e * Math.PI) * 0.34;
				flash.scale.set(CriticalRubanUtils.lerp(1.18, 1.55, e));
			}

			banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.74, 0.92, e);
			banner.motion.tint = CriticalRubanUtils.mixHex(this.constructor.vars.bloomBright, this.constructor.vars.bloomWhite, e * 0.22);
			banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0.26, 0.20);

			if (Math.random() < 0.32) this.spawnBloomDust(banner, 3);
			return;
		}

		const e = CriticalRubanUtils.clamp01((t - 0.68) / 0.32);

		banner.root.alpha = 1 - CriticalRubanUtils.easeInQuad(e);
		banner.root.position.set(
			banner.baseX + CriticalRubanUtils.lerp(0, 22, e),
			banner.baseY + CriticalRubanUtils.lerp(0, -16, e)
		);
		banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1.05, 1.10, e));
		banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(0, 0.014, e);

		banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.92, 0.0, e);
		banner.bodyGroup.alpha = CriticalRubanUtils.lerp(1, 0.10, e);
		banner.shine.alpha = CriticalRubanUtils.lerp(0.26, 0.0, e);
		banner.motion.tint = CriticalRubanUtils.mixHex(this.constructor.vars.bloomWhite, this.constructor.vars.bloomCore, e * 0.14);

		if (overlay) overlay.alpha = CriticalRubanUtils.lerp(0.70, 0.04, e);
		if (lines) lines.alpha = CriticalRubanUtils.lerp(0.58, 0.00, e);

		if (sweep) {
			sweep.alpha = CriticalRubanUtils.lerp(0.18, 0.00, e);
			sweep.x = CriticalRubanUtils.lerp(banner.mainWidth * 0.72, banner.mainWidth * 1.05, e);
		}

		if (flash) {
			flash.alpha = CriticalRubanUtils.lerp(0.18, 0.00, e);
			flash.scale.set(CriticalRubanUtils.lerp(1.55, 1.90, e));
		}

		if (crystals) {
			for (const entry of crystals._entries ?? []) {
				if (entry.sprite.alpha <= 0.01) continue;

				const riseScale = CriticalRubanUtils.lerp(
					entry.targetScale * 1.56 * entry.growthBias,
					entry.targetScale * 0.86,
					e
				);

				entry.sprite.scale.set(Math.max(0.01, riseScale));
				entry.sprite.alpha = CriticalRubanUtils.lerp(entry.targetAlpha, 0, e);
				entry.sprite.y -= 0.22 + entry.floatLift * 0.014;
				entry.sprite.rotation += entry.rotSpeed * 1.8;
			}
		}

		if (Math.random() < 0.44) this.spawnBloomDust(banner, 4);
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

  drawBloomOverlay(banner) {
    const c = new PIXI.Container();

    const auraOuter = new PIXI.Graphics();
    this.drawBodyShape(auraOuter, banner, {
      inset: -12,
      fill: this.constructor.vars.bloomBright,
      fillAlpha: 0.10
    });

    const auraInner = new PIXI.Graphics();
    this.drawBodyShape(auraInner, banner, {
      inset: -4,
      fill: this.constructor.vars.bloomWhite,
      fillAlpha: 0.05
    });

    const bodyDeep = new PIXI.Graphics();
    this.drawBodyShape(bodyDeep, banner, {
      inset: 2,
      fill: this.constructor.vars.bloomDark,
      fillAlpha: 0.16
    });

    const bodyMid = new PIXI.Graphics();
    this.drawBodyShape(bodyMid, banner, {
      inset: 3,
      fill: this.constructor.vars.bloomDeep,
      fillAlpha: 0.16
    });

    const bodyGlow = new PIXI.Graphics();
    this.drawBodyShape(bodyGlow, banner, {
      inset: 10,
      fill: this.constructor.vars.bloomBright,
      fillAlpha: 0.12
    });

    const bodyCore = new PIXI.Graphics();
    this.drawBodyShape(bodyCore, banner, {
      inset: 16,
      fill: this.constructor.vars.bloomWhite,
      fillAlpha: 0.06
    });

    const makeTail = (isLeft) => {
      const tail = new PIXI.Container();

      const glow = new PIXI.Graphics();
      this.drawTailShape(glow, banner, isLeft, {
        inset: -8,
        fill: this.constructor.vars.bloomBright,
        fillAlpha: 0.08
      });

      const mid = new PIXI.Graphics();
      this.drawTailShape(mid, banner, isLeft, {
        inset: 3,
        fill: this.constructor.vars.bloomDeep,
        fillAlpha: 0.14
      });

      const shine = new PIXI.Graphics();
      this.drawTailShape(shine, banner, isLeft, {
        inset: 8,
        fill: this.constructor.vars.bloomWhite,
        fillAlpha: 0.07
      });

      tail.addChild(glow, mid, shine);
      return tail;
    };

    const left = makeTail(true);
    const right = makeTail(false);

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    c.addChild(auraOuter, auraInner, bodyDeep, bodyMid, bodyGlow, bodyCore, left, right);
    return c;
  }

  drawRefractedLines(banner) {
    const g = new PIXI.Graphics();

    CriticalRubanUtils.gLineStyle(g, 2, this.constructor.vars.bloomEdge, 0.28);

    const x0 = -banner.mainWidth / 2 + 18;
    const x1 = banner.mainWidth / 2 - 18;
    const y0 = -banner.height / 2 + 14;
    const y1 = banner.height / 2 - 14;

    g.moveTo(x0 + 12, -8);
    g.lineTo(x0 + 56, -18);
    g.lineTo(x0 + 104, -6);
    g.lineTo(x0 + 152, 10);

    g.moveTo(-28, y0 + 4);
    g.lineTo(0, -8);
    g.lineTo(24, 4);
    g.lineTo(40, y1 - 10);

    g.moveTo(52, -4);
    g.lineTo(96, -18);
    g.lineTo(138, -10);
    g.lineTo(182, 8);

    g.moveTo(x1 - 34, 16);
    g.lineTo(x1 - 78, 4);
    g.lineTo(x1 - 126, 16);

    return g;
  }

  drawSweepBeam(banner) {
    const c = new PIXI.Container();

    const beam1 = new PIXI.Graphics();
    CriticalRubanUtils.gRoundRect(
      beam1,
      -90,
      -banner.height / 2 - 8,
      78,
      banner.height + 16,
      18,
      this.constructor.vars.bloomWhite,
      0.20
    );
    beam1.rotation = -0.18;

    const beam2 = new PIXI.Graphics();
    CriticalRubanUtils.gRoundRect(
      beam2,
      -54,
      -banner.height / 2 - 10,
      52,
      banner.height + 20,
      14,
      this.constructor.vars.bloomBright,
      0.18
    );
    beam2.rotation = -0.18;

    const core = new PIXI.Graphics();
    CriticalRubanUtils.gRoundRect(
      core,
      -16,
      -banner.height / 2 - 6,
      20,
      banner.height + 12,
      10,
      this.constructor.vars.bloomWhite,
      0.24
    );
    core.rotation = -0.18;

    c.addChild(beam1, beam2, core);
    return c;
  }

  drawCentralFlash(banner) {
    const c = new PIXI.Container();

    const star = new PIXI.Graphics();
    CriticalRubanUtils.gStar(star, 0, 0, 6, 36, 12, this.constructor.vars.bloomWhite, 0.24);

    const ring = new PIXI.Graphics();
    CriticalRubanUtils.gCircle(ring, 0, 0, 28, null, 1, 2, this.constructor.vars.bloomEdge, 0.36);

    const core = new PIXI.Graphics();
    CriticalRubanUtils.gCircle(core, 0, 0, 14, this.constructor.vars.bloomCore, 0.28);

    c.addChild(star, ring, core);
    return c;
  }

  buildCrystalVariant(size, color, alpha) {
    const variants = [
      [
        0, -size * 1.45,
        size * 0.28, -size * 0.78,
        size * 0.58, -size * 0.20,
        size * 0.18, size * 1.08,
        -size * 0.18, size * 0.94,
        -size * 0.48, size * 0.18,
        -size * 0.22, -size * 0.84
      ],
      [
        -size * 0.10, -size * 1.10,
        size * 0.30, -size * 0.92,
        size * 0.82, -size * 0.04,
        size * 0.42, size * 0.78,
        -size * 0.04, size * 1.14,
        -size * 0.52, size * 0.44,
        -size * 0.76, -size * 0.16,
        -size * 0.36, -size * 0.92
      ],
      [
        0, -size * 1.62,
        size * 0.22, -size * 0.84,
        size * 0.52, -size * 0.18,
        size * 0.22, size * 1.00,
        -size * 0.14, size * 0.92,
        -size * 0.44, size * 0.12,
        -size * 0.18, -size * 0.90
      ],
      [
        0, -size * 1.22,
        size * 0.46, -size * 0.64,
        size * 0.88, -size * 0.04,
        size * 0.30, size * 0.94,
        -size * 0.08, size * 1.12,
        -size * 0.56, size * 0.28,
        -size * 0.84, -size * 0.10,
        -size * 0.22, -size * 0.94
      ]
    ];

    const pts = variants[Math.floor(Math.random() * variants.length)];
    const g = new PIXI.Graphics();

    g.lineStyle(2, this.constructor.vars.bloomEdge, 0.34);
    g.beginFill(color, alpha);
    g.drawPolygon(pts);
    g.endFill();

    const inner = [];
    for (let i = 0; i < pts.length; i += 2) {
      inner.push(pts[i] * 0.56, pts[i + 1] * 0.56);
    }

    g.beginFill(this.constructor.vars.bloomWhite, 0.18);
    g.drawPolygon(inner);
    g.endFill();

    g.lineStyle(1.3, this.constructor.vars.bloomWhite, 0.24);
    g.moveTo(pts[0], pts[1]);
    g.lineTo(pts[2], pts[3]);
    g.lineTo(pts[4], pts[5]);

    return g;
  }

  createBloomCluster(x, y, size) {
    const c = new PIXI.Container();

    const main = this.buildCrystalVariant(
      size,
      Math.random() < 0.5 ? this.constructor.vars.bloomBright : this.constructor.vars.bloomMid,
      0.90
    );
    main.rotation =CriticalRubanUtils.randomBetween(-0.22, 0.22);
    c.addChild(main);

    const childCount = Math.floor(CriticalRubanUtils.randomBetween(1, 3));
    for (let i = 0; i < childCount; i++) {
      const shard = this.buildCrystalVariant(
        size * CriticalRubanUtils.randomBetween(0.30, 0.62),
        Math.random() < 0.5 ? this.constructor.vars.bloomCore : 0xc7a8ff,
       CriticalRubanUtils.randomBetween(0.52, 0.78)
      );

      const angle =CriticalRubanUtils.randomBetween(-2.4, 1.4);
      const dist =CriticalRubanUtils.randomBetween(size * 0.18, size * 0.68);

      shard.x = Math.cos(angle) * dist;
      shard.y = Math.sin(angle) * dist;
      shard.rotation =CriticalRubanUtils.randomBetween(-0.8, 0.8);

      c.addChild(shard);
    }

    const glow = new PIXI.Graphics();
    glow.beginFill(this.constructor.vars.bloomCore, 0.16);
    glow.drawCircle(0, 0, size * 0.36);
    glow.endFill();
    c.addChild(glow);

    c.x = x;
    c.y = y;
    c.rotation =CriticalRubanUtils.randomBetween(-0.28, 0.28);

    return c;
  }

  createBloomField(banner) {
    const container = new PIXI.Container();
    const entries = [];

    const count = Math.floor(CriticalRubanUtils.randomBetween(22, 30));

    for (let i = 0; i < count; i++) {
      const x =CriticalRubanUtils.randomBetween(-banner.totalWidth * 0.40, banner.totalWidth * 0.40);
      const y =CriticalRubanUtils.randomBetween(-banner.height * 0.30, banner.height * 0.30);

      const centerBias = 1 - Math.abs(x) / (banner.totalWidth * 0.40);
      const size =CriticalRubanUtils.randomBetween(8, 17) + centerBias *CriticalRubanUtils.randomBetween(1, 4);

      const cluster = this.createBloomCluster(x, y, size);
      cluster.alpha = 0;
      cluster.scale.set(0.10);

      container.addChild(cluster);
      entries.push({
        sprite: cluster,
        baseX: x,
        baseY: y,
        baseRotation: cluster.rotation,
        appearAt:CriticalRubanUtils.randomBetween(0.00, 0.80),
        appearWindow:CriticalRubanUtils.randomBetween(0.08, 0.16),
        targetScale:CriticalRubanUtils.randomBetween(0.84, 1.10),
        targetAlpha:CriticalRubanUtils.randomBetween(0.58, 0.90),
        driftX:CriticalRubanUtils.randomBetween(1.0, 4.0),
        driftY:CriticalRubanUtils.randomBetween(1.0, 3.6),
        floatLift:CriticalRubanUtils.randomBetween(3.0, 10.0),
        rotSpeed:CriticalRubanUtils.randomBetween(0.0010, 0.0032),
        growthBias:CriticalRubanUtils.randomBetween(0.92, 1.12)
      });
    }

    entries.sort((a, b) => a.appearAt - b.appearAt);
    container._entries = entries;
    return container;
  }

  updateBloomField(crystals, progress, elapsed, growthMultiplier = 1, liftMultiplier = 1) {
    const entries = crystals?._entries ?? [];
    const time = elapsed ?? 0;

    for (const entry of entries) {
      const localT = CriticalRubanUtils.clamp01((progress - entry.appearAt) / entry.appearWindow);

      if (localT <= 0) {
        entry.sprite.alpha = 0;
        entry.sprite.scale.set(0.10);
        entry.sprite.x = entry.baseX;
        entry.sprite.y = entry.baseY;
        entry.sprite.rotation = entry.baseRotation;
        continue;
      }

      const e = CriticalRubanUtils.easeOutBackSoft(localT);
      const baseScale = CriticalRubanUtils.lerp(0.10, entry.targetScale * growthMultiplier * entry.growthBias, e);

      entry.sprite.alpha = entry.targetAlpha * CriticalRubanUtils.clamp01(localT);
      entry.sprite.scale.set(baseScale);

      const pulse = 1 + Math.sin(time * 0.004 + entry.baseX * 0.018 + entry.baseY * 0.024) * 0.030;
      entry.sprite.scale.x *= pulse;
      entry.sprite.scale.y *= pulse;

      entry.sprite.rotation = entry.baseRotation + Math.sin(time * entry.rotSpeed) * 0.06;
      entry.sprite.x = entry.baseX + Math.sin(time * 0.0016 + entry.baseY * 0.02) * entry.driftX;
      entry.sprite.y = entry.baseY - Math.sin(time * 0.0018 + entry.baseX * 0.016) * entry.driftY - progress * entry.floatLift * liftMultiplier;
    }
  }

  spawnBloomDust(banner, count = 10) {
    for (let i = 0; i < count; i++) {
      const colorRoll = Math.random();
      const color = colorRoll < 0.42 ? this.constructor.vars.bloomWhite : (colorRoll < 0.74 ? this.constructor.vars.bloomBright : this.constructor.vars.bloomCore);

      banner.spawnParticle({
        parent: "fx",
        x:CriticalRubanUtils.randomBetween(-banner.totalWidth * 0.42, banner.totalWidth * 0.42),
        y:CriticalRubanUtils.randomBetween(-banner.height * 0.34, banner.height * 0.24),
        radius:CriticalRubanUtils.randomBetween(1.8, 4.8),
        color,
        alpha:CriticalRubanUtils.randomBetween(0.52, 0.94),
        vx:CriticalRubanUtils.randomBetween(-90, 90),
        vy:CriticalRubanUtils.randomBetween(-90, 20),
        vr:CriticalRubanUtils.randomBetween(-0.05, 0.05),
        life:CriticalRubanUtils.randomBetween(360, 920),
        scaleFrom:CriticalRubanUtils.randomBetween(0.8, 1.1),
        scaleTo: 0.10
      });
    }
  }
}
