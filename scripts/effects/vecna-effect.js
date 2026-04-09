import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";

export class VecnaEffect extends BaseRubanEffect {
	static effectId = "vecnaSmoke";
	static effectTypes = ["fumble"];
  
  static vars = {
    ink: 0x09060f,
    inkDeep: 0x04020a,
    purple: 0x3b1a78,
    purpleBright: 0x7c3aed,
    magenta: 0xa21caf,
    pale: 0xd8c4ff
  };
  
  getExitDuration(type) {
    return 1300;
  }

  setup(banner) {
		banner.addEffectLayer("vecnaVeil", this.drawVecnaVeil(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("vecnaCorruption", this.drawCorruptionLines(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("vecnaFlash", this.drawFlashLayer(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("vecnaMass", this.createSmokeMass(banner), {
			parent: "fx",
			alpha: 0
		});
	}

	onHold(banner, t) {
		const pulse = (Math.sin((banner.elapsed / 1000) * 3.8) + 1) * 0.5;

		const veil = banner.getEffectLayer("vecnaVeil");
		const corruption = banner.getEffectLayer("vecnaCorruption");
		const flash = banner.getEffectLayer("vecnaFlash");
		const mass = banner.getEffectLayer("vecnaMass");

		if (veil) {
			veil.alpha = 0.08 + pulse * 0.06;
		}

		if (corruption) {
			corruption.alpha = 0.04 + pulse * 0.08;
		}

		if (flash) {
			flash.alpha = 0.02 + pulse * 0.04;
		}

		if (mass) {
			mass.alpha = 0.12 + pulse * 0.08;
			this.updateSmokeMass(mass, banner, "hold");
		}

		banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, 0x3b1a78, 0.06 + pulse * 0.08);
		banner.innerGlow.alpha = 0.38 + pulse * 0.06;

		if (Math.random() < 0.18) this.spawnSmokeParticle(banner, 1);
		if (Math.random() < 0.14) this.spawnAnimatedWisp(banner, 1);
	}

	onPrepareExit(banner) {
		banner.resetVisualState();
		banner.bodyGroup.visible = true;
		banner.bodyGroup.alpha = 1;

		const veil = banner.getEffectLayer("vecnaVeil");
		const corruption = banner.getEffectLayer("vecnaCorruption");
		const flash = banner.getEffectLayer("vecnaFlash");
		const mass = banner.getEffectLayer("vecnaMass");

		if (veil) veil.alpha = 0.12;
		if (corruption) corruption.alpha = 0.10;
		if (flash) flash.alpha = 0.06;
		if (mass) {
			mass.alpha = 0.18;
			this.updateSmokeMass(mass, banner, "prepare");
		}

		this.spawnSmokeParticle(banner, 8);
		this.spawnAnimatedWisp(banner, 6);
	}

	onExit(banner, t) {
		const gatherT = CriticalRubanUtils.clamp01(t / 0.42);
		const swallowT = CriticalRubanUtils.clamp01((t - 0.42) / 0.58);

		const veil = banner.getEffectLayer("vecnaVeil");
		const corruption = banner.getEffectLayer("vecnaCorruption");
		const flash = banner.getEffectLayer("vecnaFlash");
		const mass = banner.getEffectLayer("vecnaMass");

		if (t <= 0.42) {
			const e = CriticalRubanUtils.easeOutCubic(gatherT);

			banner.root.alpha = 1;
			banner.root.position.set(banner.baseX, banner.baseY);
			banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.024, e));
			banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(0, -0.011, e);
			banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, 0x7c3aed, 0.14 * e);
			banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.38, 0.16, e);
			banner.bodyGroup.alpha = CriticalRubanUtils.lerp(1, 0.94, e);

			if (veil) veil.alpha = CriticalRubanUtils.lerp(0.12, 0.18, e);
			if (corruption) corruption.alpha = CriticalRubanUtils.lerp(0.10, 0.20, e);
			if (flash) flash.alpha = CriticalRubanUtils.lerp(0.06, 0.12, e);
			if (mass) {
				mass.alpha = CriticalRubanUtils.lerp(0.18, 0.28, e);
				this.updateSmokeMass(mass, banner, "exit", CriticalRubanUtils.lerp(1, 0.46, e));
			}

			if (Math.random() < 0.24) this.spawnSmokeParticle(banner, 2);
			if (Math.random() < 0.18) this.spawnAnimatedWisp(banner, 1);
			return;
		}

		const e = CriticalRubanUtils.easeInQuad(swallowT);

		banner.root.alpha = 1 - e;
		banner.root.position.set(
			banner.baseX,
			banner.baseY + CriticalRubanUtils.lerp(0, -3, e)
		);
		banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1.024, 0.94, e));
		banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(-0.011, 0.018, e);
		banner.motion.tint = CriticalRubanUtils.mixHex(0x7c3aed, 0x09060f, e * 0.68);
		banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.16, 0, e);
		banner.bodyGroup.alpha = CriticalRubanUtils.lerp(0.94, 0.0, e * 1.1);

		if (veil) veil.alpha = CriticalRubanUtils.lerp(0.18, 0.04, e);
		if (corruption) corruption.alpha = CriticalRubanUtils.lerp(0.20, 0.0, e);
		if (flash) flash.alpha = CriticalRubanUtils.lerp(0.12, 0.0, e);
		if (mass) {
			mass.alpha = CriticalRubanUtils.lerp(0.28, 0.0, e * 1.2);
			this.updateSmokeMass(mass, banner, "exit", CriticalRubanUtils.lerp(0.46, 0.02, e));
		}

		if (Math.random() < 0.32) this.spawnSmokeParticle(banner, 2);
		if (Math.random() < 0.22) this.spawnAnimatedWisp(banner, 2);
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

  drawVecnaVeil(banner) {
    const c = new PIXI.Container();

    const bodyBack = new PIXI.Graphics();
    this.drawBodyShape(bodyBack, banner, {
      inset: -6,
      fill: this.constructor.vars.inkDeep,
      fillAlpha: 0.24
    });

    const bodyCore = new PIXI.Graphics();
    this.drawBodyShape(bodyCore, banner, {
      inset: 1,
      fill: this.constructor.vars.ink,
      fillAlpha: 0.16,
      lineWidth: 2,
      lineColor: this.constructor.vars.purpleBright,
      lineAlpha: 0.08
    });

    const left = new PIXI.Graphics();
    this.drawTailShape(left, banner, true, {
      inset: -4,
      fill: this.constructor.vars.inkDeep,
      fillAlpha: 0.18
    });

    const right = new PIXI.Graphics();
    this.drawTailShape(right, banner, false, {
      inset: -4,
      fill: this.constructor.vars.inkDeep,
      fillAlpha: 0.18
    });

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    c.addChild(bodyBack, bodyCore, left, right);
    return c;
  }

  drawCorruptionLines(banner) {
    const g = new PIXI.Graphics();
    CriticalRubanUtils.gLineStyle(g, 2, this.constructor.vars.purpleBright, 0.18);

    const x0 = -banner.mainWidth / 2 + 22;
    const x1 = banner.mainWidth / 2 - 22;

    g.moveTo(x0 + 8, -4);
    g.lineTo(x0 + 38, -14);
    g.lineTo(x0 + 68, -4);

    g.moveTo(-16, -12);
    g.lineTo(0, 14);
    g.lineTo(18, -8);

    g.moveTo(x1 - 52, 10);
    g.lineTo(x1 - 24, -12);
    g.lineTo(x1, 8);

    return g;
  }

  drawFlashLayer(banner) {
    const c = new PIXI.Container();

    const ring = new PIXI.Graphics();
    CriticalRubanUtils.gCircle(ring, 0, 0, 24, null, 1, 2, this.constructor.vars.purpleBright, 0.12);

    const core = new PIXI.Graphics();
    CriticalRubanUtils.gCircle(core, 0, 0, 12, this.constructor.vars.pale, 0.08);
    
    c.addChild(ring, core);
    return c;
  }

  makeAnimatedWisp(size = 18, color = this.constructor.vars.purpleBright, alpha = 0.82) {
    const c = new PIXI.Container();

    const glow = new PIXI.Graphics();
    CriticalRubanUtils.gCircle(glow, 0, 0, size * 1.4, color, alpha * 0.24);

    const core = new PIXI.Graphics();
    CriticalRubanUtils.gCircle(core, 0, 0, size, color, alpha);

    c.addChild(glow, core);

    c._wispData = {
      baseSize: size,
      color,
      baseAlpha: alpha,
      pulsePhase:CriticalRubanUtils.randomBetween(0, Math.PI * 2),
      pulseSpeed:CriticalRubanUtils.randomBetween(2.8, 4.2),
      driftX:CriticalRubanUtils.randomBetween(0.8, 2.2),
      driftY:CriticalRubanUtils.randomBetween(0.6, 1.8),
      rotSpeed:CriticalRubanUtils.randomBetween(0.012, 0.028)
    };

    return c;
  }

  animateWisps(layer, elapsedMS) {
    if (!layer?._wisps?.length) return;
    const t = elapsedMS / 1000;

    for (const wisp of layer._wisps) {
      const d = wisp._wispData;
      const pulse = (Math.sin(t * d.pulseSpeed + d.pulsePhase) + 1) * 0.5;

      wisp.scale.set(0.88 + pulse * 0.24);
      wisp.alpha = d.baseAlpha * (0.74 + pulse * 0.26);
      wisp.rotation += d.rotSpeed;

      wisp.x = Math.sin(t * 1.4 + d.pulsePhase) * d.driftX;
      wisp.y = Math.cos(t * 1.6 + d.pulsePhase) * d.driftY;
    }
  }

  createSmokeMass(banner) {
    const c = new PIXI.Container();
    c._wisps = [];

    const count = 7;
    for (let i = 0; i < count; i++) {
      const wisp = this.makeAnimatedWisp(
       CriticalRubanUtils.randomBetween(14, 24),
        i % 2 === 0 ? this.constructor.vars.purpleBright : this.constructor.vars.magenta,
       CriticalRubanUtils.randomBetween(0.68, 0.88)
      );

      const angle = (i / count) * Math.PI * 2 +CriticalRubanUtils.randomBetween(-0.18, 0.18);
      const radius = CriticalRubanUtils.randomBetween(banner.mainWidth * 0.38, banner.mainWidth * 0.68);

      wisp.x = Math.cos(angle) * radius;
      wisp.y = Math.sin(angle) * radius;

      c._wisps.push(wisp);
      c.addChild(wisp);
    }

    return c;
  }

  updateSmokeMass(layer, banner, phase = "hold", intensity = 1) {
    if (!layer?._wisps?.length) return;

    this.animateWisps(layer, banner.elapsed);

    const t = banner.elapsed / 1000;
    for (const wisp of layer._wisps) {
      const d = wisp._wispData;

      let radiusMul = 1;
      let speedMul = 1;

      if (phase === "prepare") {
        radiusMul = 0.94;
        speedMul = 1.2;
      } else if (phase === "exit") {
        radiusMul = intensity;
        speedMul = 1 + (1 - intensity) * 2;
      }

      const baseRadius = banner.mainWidth * 0.52;
      const radius = baseRadius * radiusMul;
      const angle = Math.atan2(wisp.y, wisp.x) + t * d.rotSpeed * speedMul;

      wisp.x = Math.cos(angle) * radius;
      wisp.y = Math.sin(angle) * radius;
    }
  }

  spawnSmokeParticle(banner, count = 1) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        shape: "circle",
        x:CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.48, banner.mainWidth * 0.48),
        y:CriticalRubanUtils.randomBetween(-banner.height * 0.38, banner.height * 0.22),
        radius:CriticalRubanUtils.randomBetween(1.6, 3.6),
        color: Math.random() < 0.6 ? this.constructor.vars.purpleBright : this.constructor.vars.pale,
        alpha:CriticalRubanUtils.randomBetween(0.38, 0.78),
        vx:CriticalRubanUtils.randomBetween(-28, 28),
        vy:CriticalRubanUtils.randomBetween(-46, -12),
        vr:CriticalRubanUtils.randomBetween(-0.04, 0.04),
        life:CriticalRubanUtils.randomBetween(340, 720),
        scaleFrom: 1,
        scaleTo: 0.16
      });
    }
  }

  spawnAnimatedWisp(banner, count = 1) {
    for (let i = 0; i < count; i++) {
      const wisp = this.makeAnimatedWisp(
       CriticalRubanUtils.randomBetween(12, 20),
        Math.random() < 0.5 ? this.constructor.vars.purpleBright : this.constructor.vars.magenta,
       CriticalRubanUtils.randomBetween(0.52, 0.76)
      );

      wisp.x =CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.42, banner.mainWidth * 0.42);
      wisp.y =CriticalRubanUtils.randomBetween(-banner.height * 0.32, banner.height * 0.18);

      banner.addEffectLayer(`tempWisp${i}_${banner.elapsed}`, wisp, {
        parent: "fx",
        alpha: 1
      });

      setTimeout(() => {
        banner.removeEffectLayer(`tempWisp${i}_${banner.elapsed}`);
      },CriticalRubanUtils.randomBetween(800, 1400));
    }
  }
}
