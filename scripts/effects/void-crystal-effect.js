import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";


export class VoidCrystalEffect extends BaseRubanEffect {
	static effectId = "voidCrystalFumble";
	static effectTypes = ["fumble"];
  
  static vars = {
    crystalDark: 0x16071f,
    crystalDeep: 0x2b0d46,
    crystalMid: 0x5c20a8,
    crystalBright: 0x8f4dff,
    crystalEdge: 0xe7d7ff,
    voidTint: 0x120716
  };
  
  getExitDuration(type) {
    return 1350;
  }

  setup(banner) {
		banner.addEffectLayer("corruptionOverlay", this.drawCorruptionOverlay(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("veinLines", this.drawVeinLines(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("pulseFlash", this.drawPulseFlash(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("crystalField", this.createCrystalField(banner), {
			parent: "fx",
			alpha: 1
		});

		banner.addEffectLayer("voidRibbonShards", new PIXI.Container(), {
			parent: "fx",
			alpha: 1,
			visible: false
		});
	}

	onHold(banner, t) {
		const crystals = banner.getEffectLayer("crystalField");
		const overlay = banner.getEffectLayer("corruptionOverlay");
		const veins = banner.getEffectLayer("veinLines");
		const flash = banner.getEffectLayer("pulseFlash");

		if (crystals) {
			crystals.visible = true;
			crystals.alpha = 1;
			this.updateCrystalField(crystals, t, banner.elapsed, 1);

			for (const entry of crystals._entries ?? []) {
				if (entry.sprite.alpha > 0.02) {
					entry.sprite.rotation += entry.rotSpeed * 0.35;
				}
			}
		}

		if (overlay) {
			overlay.alpha = CriticalRubanUtils.lerp(0.06, 0.44, CriticalRubanUtils.easeInOutQuad(t));
		}

		if (veins) {
			veins.alpha = 0.06 + CriticalRubanUtils.easeInOutQuad(t) * 0.22 + Math.sin((banner.elapsed / 1000) * 4.4) * 0.03;
		}

		if (flash) {
			const pulse = (Math.sin((banner.elapsed / 1000) * 3.2) + 1) * 0.5;
			flash.alpha = 0.02 + pulse * 0.05;
		}

		banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, this.constructor.vars.crystalMid, 0.10 + t * 0.10);
		banner.innerGlow.alpha = 0.48 + Math.sin((banner.elapsed / 1000) * 4.0) * 0.05;

		if (Math.random() < 0.22) {
			this.spawnCrystalDust(banner, 1);
		}
	}

	onPrepareExit(banner) {
		banner.resetVisualState();

		const crystals = banner.getEffectLayer("crystalField");
		const overlay = banner.getEffectLayer("corruptionOverlay");
		const veins = banner.getEffectLayer("veinLines");
		const flash = banner.getEffectLayer("pulseFlash");

		this.resetVoidRibbonShards(banner);

		if (crystals) {
			crystals.visible = true;
			crystals.alpha = 1;
			this.updateCrystalField(crystals, 1, banner.elapsed, 1);
		}

		if (overlay) overlay.alpha = 0.44;
		if (veins) veins.alpha = 0.26;
		if (flash) flash.alpha = 0;

		banner.bodyGroup.visible = true;

		this.spawnCrystalDust(banner, 14);
	}

	onExit(banner, t, dtMS) {
		const crystals = banner.getEffectLayer("crystalField");
		const overlay = banner.getEffectLayer("corruptionOverlay");
		const veins = banner.getEffectLayer("veinLines");
		const flash = banner.getEffectLayer("pulseFlash");

		if (crystals) {
			crystals.visible = true;
			crystals.alpha = 1;
		}

		if (t < 0.45) {
			const e = CriticalRubanUtils.easeOutCubic(t / 0.45);

			banner.root.alpha = 1;
			banner.root.position.set(banner.baseX, banner.baseY);
			banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.026, e));
			banner.motion.rotation = banner.baseRotation;

			if (crystals) {
				this.updateCrystalField(crystals, CriticalRubanUtils.lerp(0.72, 1.0, e), banner.elapsed, CriticalRubanUtils.lerp(1.0, 1.55, e));

				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha <= 0.01) continue;

					const dirX = Math.sign(entry.baseX || 1);
					const dirY = Math.sign(entry.baseY || 1);

					entry.sprite.x += dirX * CriticalRubanUtils.lerp(0, 8, e);
					entry.sprite.y += dirY * CriticalRubanUtils.lerp(0, 4, e);
					entry.sprite.rotation += entry.rotSpeed * 2.0;
				}
			}

			if (overlay) overlay.alpha = CriticalRubanUtils.lerp(0.44, 0.76, e);
			if (veins) veins.alpha = CriticalRubanUtils.lerp(0.26, 0.54, e);
			if (flash) {
				const flashT = CriticalRubanUtils.clamp01((e - 0.68) / 0.32);
				flash.alpha = Math.sin(flashT * Math.PI) * 0.24;
			}

			banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.44, 0.16, e);
			banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, this.constructor.vars.crystalBright, e * 0.34);
			banner.shine.alpha = CriticalRubanUtils.lerp(banner.shine.alpha, 0, 0.25);

			if (Math.random() < 0.26) this.spawnCrystalDust(banner, 2);
			return;
		}

		if (t < 0.78) {
			const e = CriticalRubanUtils.clamp01((t - 0.45) / 0.33);

			banner.root.alpha = 1;
			banner.root.position.set(
				banner.baseX + CriticalRubanUtils.randomBetween(-3.2, 3.2),
				banner.baseY + CriticalRubanUtils.randomBetween(-2.0, 2.0)
			);
			banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1.026, 1.05, e));
			banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.randomBetween(-0.015, 0.015);

			if (crystals) {
				this.updateCrystalField(crystals, 1, banner.elapsed, CriticalRubanUtils.lerp(1.55, 1.90, e));

				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha <= 0.01) continue;

					const pulse = 1 + Math.sin(banner.elapsed * 0.018 + entry.baseX * 0.03) * 0.10;
					entry.sprite.scale.x *= pulse;
					entry.sprite.scale.y *= pulse;
					entry.sprite.rotation += entry.rotSpeed * 3.6;
				}
			}

			if (overlay) overlay.alpha = CriticalRubanUtils.lerp(0.76, 0.96, e);
			if (veins) veins.alpha = CriticalRubanUtils.lerp(0.54, 0.78, e);
			if (flash) flash.alpha = Math.sin(e * Math.PI * 2) * 0.14;

			banner.motion.tint = CriticalRubanUtils.mixHex(this.constructor.vars.crystalMid, this.constructor.vars.crystalBright, e * 0.34);

			if (Math.random() < 0.38) this.spawnCrystalDust(banner, 3);
			return;
		}

		const e = CriticalRubanUtils.clamp01((t - 0.78) / 0.22);
		let ribbonShards = banner.getEffectLayer("voidRibbonShards");

		if (!ribbonShards?._shards?.length) {
			this.createVoidShatterShards(banner);
			ribbonShards = banner.getEffectLayer("voidRibbonShards");

			banner.bodyGroup.visible = false;

			if (overlay) overlay.visible = false;
			if (veins) veins.visible = false;
			if (flash) flash.visible = false;

			if (crystals) {
				for (const entry of crystals._entries ?? []) {
					if (entry.sprite.alpha <= 0.01) continue;

					const angle = Math.atan2(entry.baseY, entry.baseX) +CriticalRubanUtils.randomBetween(-0.9, 0.9);
					const speed =CriticalRubanUtils.randomBetween(140, 360);

					entry.burstVX = Math.cos(angle) * speed;
					entry.burstVY = Math.sin(angle) * speed -CriticalRubanUtils.randomBetween(30, 120);
					entry.burstSpin =CriticalRubanUtils.randomBetween(-0.18, 0.18);
				}
			}

			this.spawnCrystalDust(banner, 28);
		}

		banner.root.alpha = 1;
		banner.root.position.set(banner.baseX, banner.baseY);
		banner.motion.scale.set(banner.baseScale);
		banner.motion.rotation = banner.baseRotation;

		const frameDtMS = dtMS ?? banner.lastDtMS ?? 16.67;
		const dt = frameDtMS / 1000;

		if (ribbonShards?._shards) {
			ribbonShards.visible = true;
			ribbonShards.alpha = 1;

			for (const s of ribbonShards._shards) {
				if (s.delay > 0) {
					s.delay -= frameDtMS;
					continue;
				}

				s.vy += s.gravity * dt;
				s.sprite.x += s.vx * dt;
				s.sprite.y += s.vy * dt;
				s.sprite.rotation += s.spin;
				s.sprite.alpha = 1 - CriticalRubanUtils.easeInQuad(e) * 0.18;
			}
		}

		if (crystals) {
			for (const entry of crystals._entries ?? []) {
				if (entry.sprite.alpha <= 0.01) continue;

				entry.burstVY += 420 * dt;
				entry.sprite.x += entry.burstVX * dt;
				entry.sprite.y += entry.burstVY * dt;
				entry.sprite.rotation += entry.burstSpin;

				const burstScale = CriticalRubanUtils.lerp(
					entry.targetScale * 1.90 * entry.growthBias,
					entry.targetScale * 0.92,
					e
				);

				entry.sprite.scale.set(Math.max(0.01, burstScale));
				entry.sprite.alpha = CriticalRubanUtils.lerp(Math.max(0.82, entry.targetAlpha), 0, e);
			}
		}

		if (Math.random() < 0.60) this.spawnCrystalDust(banner, 4);
	}

	onDestroy(banner) {
		banner.motion.tint = 0xffffff;
		this.resetVoidRibbonShards(banner);
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

  drawCorruptionOverlay(banner) {
    const c = new PIXI.Container();

    const outerGlow = new PIXI.Graphics();
    this.drawBodyShape(outerGlow, banner, {
      inset: -10,
      fill: this.constructor.vars.crystalBright,
      fillAlpha: 0.08
    });

    const outerGlow2 = new PIXI.Graphics();
    this.drawBodyShape(outerGlow2, banner, {
      inset: -4,
      fill: this.constructor.vars.crystalBright,
      fillAlpha: 0.035
    });

    const bodyDark = new PIXI.Graphics();
    this.drawBodyShape(bodyDark, banner, {
      inset: 2,
      fill: this.constructor.vars.voidTint,
      fillAlpha: 0.44
    });

    const bodyPurple = new PIXI.Graphics();
    this.drawBodyShape(bodyPurple, banner, {
      inset: 3,
      fill: this.constructor.vars.crystalDeep,
      fillAlpha: 0.38
    });

    const bodyVeil = new PIXI.Graphics();
    this.drawBodyShape(bodyVeil, banner, {
      inset: 10,
      fill: this.constructor.vars.crystalBright,
      fillAlpha: 0.12
    });

    const makeTail = (isLeft) => {
      const tail = new PIXI.Container();

      const glow = new PIXI.Graphics();
      this.drawTailShape(glow, banner, isLeft, {
        inset: -8,
        fill: this.constructor.vars.crystalBright,
        fillAlpha: 0.06
      });

      const dark = new PIXI.Graphics();
      this.drawTailShape(dark, banner, isLeft, {
        inset: 2,
        fill: this.constructor.vars.voidTint,
        fillAlpha: 0.40
      });

      const purple = new PIXI.Graphics();
      this.drawTailShape(purple, banner, isLeft, {
        inset: 3,
        fill: this.constructor.vars.crystalDeep,
        fillAlpha: 0.34
      });

      const shine = new PIXI.Graphics();
      this.drawTailShape(shine, banner, isLeft, {
        inset: 8,
        fill: this.constructor.vars.crystalBright,
        fillAlpha: 0.08
      });

      tail.addChild(glow, dark, purple, shine);
      return tail;
    };

    const left = makeTail(true);
    const right = makeTail(false);

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    c.addChild(outerGlow, outerGlow2, bodyDark, bodyPurple, bodyVeil, left, right);
    return c;
  }

  drawVeinLines(banner) {
    const g = new PIXI.Graphics();

    CriticalRubanUtils.gLineStyle(g, 2, this.constructor.vars.crystalEdge, 0.24);

    const x0 = -banner.mainWidth / 2 + 16;
    const x1 = banner.mainWidth / 2 - 16;
    const y0 = -banner.height / 2 + 12;
    const y1 = banner.height / 2 - 12;

    g.moveTo(x0 + 24, -6);
    g.lineTo(x0 + 78, -18);
    g.lineTo(x0 + 132, -2);
    g.lineTo(x0 + 168, 14);

    g.moveTo(-30, y0 + 4);
    g.lineTo(-8, -10);
    g.lineTo(18, 8);
    g.lineTo(30, y1 - 10);

    g.moveTo(56, -2);
    g.lineTo(104, -18);
    g.lineTo(150, -6);
    g.lineTo(190, 10);

    g.moveTo(x1 - 36, 18);
    g.lineTo(x1 - 84, 8);
    g.lineTo(x1 - 132, 18);

    return g;
  }

  buildCrystalVariant(size, color, alpha) {
    const variants = [
      [
        0, -size * 1.40,
        size * 0.36, -size * 0.54,
        size * 0.72, -size * 0.02,
        size * 0.16, size * 1.12,
        -size * 0.28, size * 0.86,
        -size * 0.62, size * 0.08,
        -size * 0.34, -size * 0.72
      ],
      [
        -size * 0.14, -size * 1.12,
        size * 0.34, -size * 0.90,
        size * 0.92, -size * 0.08,
        size * 0.48, size * 0.78,
        -size * 0.04, size * 1.18,
        -size * 0.58, size * 0.50,
        -size * 0.84, -size * 0.16,
        -size * 0.44, -size * 0.92
      ],
      [
        0, -size * 1.56,
        size * 0.26, -size * 0.72,
        size * 0.60, -size * 0.16,
        size * 0.24, size * 1.06,
        -size * 0.20, size * 0.94,
        -size * 0.54, size * 0.18,
        -size * 0.24, -size * 0.82
      ],
      [
        0, -size * 1.24,
        size * 0.52, -size * 0.60,
        size * 1.00, -size * 0.02,
        size * 0.32, size * 0.94,
        -size * 0.12, size * 1.16,
        -size * 0.62, size * 0.30,
        -size * 0.92, -size * 0.18,
        -size * 0.26, -size * 0.96
      ]
    ];

    const pts = variants[Math.floor(Math.random() * variants.length)];
    const g = new PIXI.Graphics();

    g.lineStyle(2, this.constructor.vars.crystalEdge, 0.24);
    g.beginFill(color, alpha);
    g.drawPolygon(pts);
    g.endFill();

    const inner = [];
    for (let i = 0; i < pts.length; i += 2) {
      inner.push(pts[i] * 0.56, pts[i + 1] * 0.56);
    }

    g.beginFill(0xd8bfff, 0.20);
    g.drawPolygon(inner);
    g.endFill();

    g.lineStyle(1.2, 0xffffff, 0.18);
    g.moveTo(pts[0], pts[1]);
    g.lineTo(pts[2], pts[3]);
    g.lineTo(pts[4], pts[5]);

    return g;
  }

  createCrystalCluster(x, y, size) {
    const c = new PIXI.Container();

    const main = this.buildCrystalVariant(
      size,
      Math.random() < 0.5 ? this.constructor.vars.crystalBright : this.constructor.vars.crystalMid,
      0.96
    );
    main.rotation =CriticalRubanUtils.randomBetween(-0.35, 0.35);
    c.addChild(main);

    const childCount = Math.floor(CriticalRubanUtils.randomBetween(1, 4));
    for (let i = 0; i < childCount; i++) {
      const shard = this.buildCrystalVariant(
        size *CriticalRubanUtils.randomBetween(0.34, 0.74),
        Math.random() < 0.5 ? this.constructor.vars.crystalBright : this.constructor.vars.crystalMid,
       CriticalRubanUtils.randomBetween(0.68, 0.90)
      );

      const angle =CriticalRubanUtils.randomBetween(-2.8, 1.6);
      const dist =CriticalRubanUtils.randomBetween(size * 0.20, size * 0.82);

      shard.x = Math.cos(angle) * dist;
      shard.y = Math.sin(angle) * dist;
      shard.rotation =CriticalRubanUtils.randomBetween(-1.2, 1.2);

      c.addChild(shard);
    }

    const glow = new PIXI.Graphics();
    glow.beginFill(0xdabaff, 0.18);
    glow.drawCircle(0, 0, size * 0.34);
    glow.endFill();
    c.addChild(glow);

    c.x = x;
    c.y = y;
    c.rotation =CriticalRubanUtils.randomBetween(-0.45, 0.45);

    return c;
  }

  createCrystalField(banner) {
    const container = new PIXI.Container();
    const entries = [];

    const count = Math.floor(CriticalRubanUtils.randomBetween(30, 40));

    for (let i = 0; i < count; i++) {
      const x =CriticalRubanUtils.randomBetween(-banner.totalWidth * 0.44, banner.totalWidth * 0.44);
      const y =CriticalRubanUtils.randomBetween(-banner.height * 0.34, banner.height * 0.34);

      const edgeBias = Math.abs(x) / (banner.totalWidth * 0.44);
      const size =CriticalRubanUtils.randomBetween(10, 22) + edgeBias *CriticalRubanUtils.randomBetween(2, 8);

      const cluster = this.createCrystalCluster(x, y, size);
      cluster.alpha = 0;
      cluster.scale.set(0.12);

      container.addChild(cluster);
      entries.push({
        sprite: cluster,
        baseX: x,
        baseY: y,
        baseRotation: cluster.rotation,
        appearAt:CriticalRubanUtils.randomBetween(0.00, 0.88),
        appearWindow:CriticalRubanUtils.randomBetween(0.07, 0.18),
        targetScale:CriticalRubanUtils.randomBetween(0.88, 1.18),
        targetAlpha:CriticalRubanUtils.randomBetween(0.74, 1.0),
        driftX: Math.sign(x || 1) *CriticalRubanUtils.randomBetween(1.0, 6.0),
        driftY:CriticalRubanUtils.randomBetween(-3.0, 3.0),
        rotSpeed:CriticalRubanUtils.randomBetween(0.0015, 0.0050),
        growthBias:CriticalRubanUtils.randomBetween(0.9, 1.2),
        burstVX: 0,
        burstVY: 0,
        burstSpin: 0
      });
    }

    entries.sort((a, b) => a.appearAt - b.appearAt);
    container._entries = entries;
    return container;
  }

  updateCrystalField(crystals, progress, elapsed, growthMultiplier = 1) {
    const entries = crystals?._entries ?? [];
    const time = elapsed ?? 0;

    for (const entry of entries) {
      const localT = CriticalRubanUtils.clamp01((progress - entry.appearAt) / entry.appearWindow);

      if (localT <= 0) {
        entry.sprite.alpha = 0;
        entry.sprite.scale.set(0.12);
        entry.sprite.x = entry.baseX;
        entry.sprite.y = entry.baseY;
        entry.sprite.rotation = entry.baseRotation;
        continue;
      }

      const e = CriticalRubanUtils.easeOutBackSoft(localT);
      const baseScale = CriticalRubanUtils.lerp(0.12, entry.targetScale * growthMultiplier * entry.growthBias, e);

      entry.sprite.alpha = entry.targetAlpha * CriticalRubanUtils.clamp01(localT);
      entry.sprite.scale.set(baseScale);

      const pulse = 1 + Math.sin(time * 0.004 + entry.baseX * 0.022 + entry.baseY * 0.03) * 0.035;
      entry.sprite.scale.x *= pulse;
      entry.sprite.scale.y *= pulse;

      entry.sprite.rotation = entry.baseRotation + Math.sin(time * entry.rotSpeed) * 0.10;
      entry.sprite.x = entry.baseX + Math.sin(time * 0.0017 + entry.baseY * 0.03) * entry.driftX;
      entry.sprite.y = entry.baseY + Math.cos(time * 0.0015 + entry.baseX * 0.02) * entry.driftY;
    }
  }

  drawPulseFlash(banner) {
    const c = new PIXI.Container();

    const body = new PIXI.Graphics();
    this.drawBodyShape(body, banner, {
      inset: 0,
      fill: this.constructor.vars.crystalEdge,
      fillAlpha: 0.24
    });

    const left = new PIXI.Graphics();
    this.drawTailShape(left, banner, true, {
      inset: 0,
      fill: this.constructor.vars.crystalEdge,
      fillAlpha: 0.18
    });

    const right = new PIXI.Graphics();
    this.drawTailShape(right, banner, false, {
      inset: 0,
      fill: this.constructor.vars.crystalEdge,
      fillAlpha: 0.18
    });

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    const star = new PIXI.Graphics();
    CriticalRubanUtils.gStar(star, 0, 0, 4, 24, 9, 0xffffff, 0.18);

    c.addChild(body, left, right, star);
    return c;
  }

  spawnCrystalDust(banner, count = 10) {
    for (let i = 0; i < count; i++) {
      const purple = Math.random() < 0.50 ? this.constructor.vars.crystalBright : (Math.random() < 0.5 ? this.constructor.vars.crystalMid : 0xc7a4ff);

      banner.spawnParticle({
        parent: "fx",
        x:CriticalRubanUtils.randomBetween(-banner.totalWidth * 0.46, banner.totalWidth * 0.46),
        y:CriticalRubanUtils.randomBetween(-banner.height * 0.40, banner.height * 0.40),
        radius:CriticalRubanUtils.randomBetween(2.4, 6.0),
        color: purple,
        alpha:CriticalRubanUtils.randomBetween(0.58, 0.98),
        vx:CriticalRubanUtils.randomBetween(-120, 120),
        vy:CriticalRubanUtils.randomBetween(-120, 70),
        vr:CriticalRubanUtils.randomBetween(-0.05, 0.05),
        life:CriticalRubanUtils.randomBetween(420, 980),
        scaleFrom:CriticalRubanUtils.randomBetween(0.9, 1.2),
        scaleTo: 0.18
      });
    }
  }

  getVoidShatterPolygons(banner) {
    const bodyL = -banner.mainWidth / 2;
    const totalL = -banner.totalWidth / 2;
    const totalR = banner.totalWidth / 2;
    const yT = -banner.height / 2;
    const yB = banner.height / 2;
    const bx = (r) => bodyL + banner.mainWidth * r;

    return [
      [totalL + 10, -24, totalL + 30, -18, totalL + 40, -2, totalL + 16, 4],
      [totalL + 16, 4, totalL + 40, -2, totalL + 28, 18, totalL + 8, 22],

      [bx(0.02), yT + 8, bx(0.14), yT + 6, bx(0.12), -12, bx(0.02), -4],
      [bx(0.14), yT + 6, bx(0.28), yT + 6, bx(0.26), -10, bx(0.12), -12],
      [bx(0.28), yT + 6, bx(0.42), yT + 7, bx(0.40), -8, bx(0.26), -10],
      [bx(0.42), yT + 7, bx(0.58), yT + 7, bx(0.56), -8, bx(0.40), -8],
      [bx(0.58), yT + 7, bx(0.72), yT + 8, bx(0.70), -6, bx(0.56), -8],
      [bx(0.72), yT + 8, bx(0.86), yT + 8, bx(0.84), -2, bx(0.70), -6],
      [bx(0.86), yT + 8, bx(0.98), yT + 10, bx(0.96), 2, bx(0.84), -2],

      [bx(0.02), -4, bx(0.12), -12, bx(0.11), 10, bx(0.02), 10],
      [bx(0.12), -12, bx(0.26), -10, bx(0.25), 10, bx(0.11), 10],
      [bx(0.26), -10, bx(0.40), -8, bx(0.39), 10, bx(0.25), 10],
      [bx(0.40), -8, bx(0.56), -8, bx(0.55), 10, bx(0.39), 10],
      [bx(0.56), -8, bx(0.70), -6, bx(0.69), 10, bx(0.55), 10],
      [bx(0.70), -6, bx(0.84), -2, bx(0.83), 12, bx(0.69), 10],
      [bx(0.84), -2, bx(0.96), 2, bx(0.95), 12, bx(0.83), 12],

      [bx(0.02), 10, bx(0.11), 10, bx(0.10), yB - 10, bx(0.01), yB - 8],
      [bx(0.11), 10, bx(0.25), 10, bx(0.24), yB - 8, bx(0.10), yB - 10],
      [bx(0.25), 10, bx(0.39), 10, bx(0.38), yB - 8, bx(0.24), yB - 8],
      [bx(0.39), 10, bx(0.55), 10, bx(0.54), yB - 8, bx(0.38), yB - 8],
      [bx(0.55), 10, bx(0.69), 10, bx(0.68), yB - 8, bx(0.54), yB - 8],
      [bx(0.69), 10, bx(0.83), 12, bx(0.82), yB - 6, bx(0.68), yB - 8],
      [bx(0.83), 12, bx(0.96), 10, bx(0.95), yB - 4, bx(0.82), yB - 6],

      [totalR - 10, -24, totalR - 30, -18, totalR - 40, -2, totalR - 16, 4],
      [totalR - 16, 4, totalR - 40, -2, totalR - 28, 18, totalR - 8, 22]
    ];
  }

  createVoidShatterShards(banner) {
    const existing = banner.getEffectLayer("voidRibbonShards");
    if (existing?._shards?.length) return existing._shards;

    const snapshot = banner.captureBodyGroupTexture();
    if (!snapshot?.texture || !snapshot?.bounds) return [];

    const layer = banner.getEffectLayer("voidRibbonShards") ?? new PIXI.Container();

    if (!banner.getEffectLayer("voidRibbonShards")) {
      banner.addEffectLayer("voidRibbonShards", layer, {
        parent: "fx",
        alpha: 1,
        visible: true
      });
    }

    layer.removeChildren();
    layer.visible = true;
    layer.alpha = 1;

    const pieces = [];
    const polys = this.getVoidShatterPolygons(banner);

    for (const pts of polys) {
      const { shard, cx, cy } = banner.createTexturedShard(pts, snapshot.texture, snapshot.bounds);
      layer.addChild(shard);

      const angle = Math.atan2(cy, cx) +CriticalRubanUtils.randomBetween(-0.45, 0.45);
      const speed =CriticalRubanUtils.randomBetween(180, 420);
      const spin =CriticalRubanUtils.randomBetween(-0.16, 0.16);

      pieces.push({
        sprite: shard,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed -CriticalRubanUtils.randomBetween(40, 140),
        gravity:CriticalRubanUtils.randomBetween(280, 520),
        spin,
        delay:CriticalRubanUtils.randomBetween(0, 20)
      });
    }

    layer._shards = pieces;
    layer._snapshot = snapshot.texture;
    return pieces;
  }

  resetVoidRibbonShards(banner) {
    const shardLayer = banner.getEffectLayer("voidRibbonShards");
    if (!shardLayer) return;

    for (const s of shardLayer._shards ?? []) {
      try {
        s.sprite.destroy?.();
      } catch (_err) {}
    }

    shardLayer.removeChildren();
    shardLayer._shards = [];
    if (shardLayer._snapshot) {
      try {
        shardLayer._snapshot.destroy(true);
      } catch (_err) {}
    }
    shardLayer._snapshot = null;
    shardLayer.visible = false;
    shardLayer.alpha = 1;
  }
}
