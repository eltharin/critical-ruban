import { BaseRubanEffect } from "./base-effect.js";
import { CriticalRubanUtils } from "../critical-ruban-utils.js";


export class VecnaRunesEffect extends BaseRubanEffect {
	static effectId = "vecnaRunes";
	static effectTypes = ["critical"];
	
  static vars = {
    ink: 0x09060f,
    inkDeep: 0x04020a,
    purple: 0x3b1a78,
    purpleBright: 0x7c3aed,
    magenta: 0xa21caf,
    pale: 0xd8c4ff
  };
  
  getExitDuration(type) {
    return 1250;
  }

  setup(banner) {
		banner.addEffectLayer("vecnaRuneVeil", this.drawRuneVeil(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("vecnaRuneMarks", this.drawInnerMarkings(banner), {
			parent: "bodyGroup",
			alpha: 0
		});

		banner.addEffectLayer("vecnaRuneOrbit", this.buildRuneOrbitLayer(banner), {
			parent: "fx",
			alpha: 0
		});

		banner.addEffectLayer("vecnaAbsorbSigil", this.drawAbsorbSigil(banner), {
			parent: "bodyGroup",
			alpha: 0
		});
	}

	onHold(banner) {
		const pulse = (Math.sin((banner.elapsed / 1000) * 4.2) + 1) * 0.5;

		const veil = banner.getEffectLayer("vecnaRuneVeil");
		const marks = banner.getEffectLayer("vecnaRuneMarks");
		const orbit = banner.getEffectLayer("vecnaRuneOrbit");
		const sigil = banner.getEffectLayer("vecnaAbsorbSigil");

		if (veil) {
			veil.alpha = 0.10 + pulse * 0.06;
		}

		if (marks) {
			marks.alpha = 0.06 + pulse * 0.08;
		}

		if (orbit) {
			orbit.alpha = 0.58 + pulse * 0.18;
			orbit.rotation = Math.sin((banner.elapsed / 1000) * 0.7) * 0.03;
			this.updateRuneOrbits(orbit, banner.elapsed, "hold", 1);
		}

		if (sigil) {
			sigil.alpha = 0.06 + pulse * 0.08;
			sigil.rotation = -(banner.elapsed / 1000) * 0.42;
			const ss = 0.94 + pulse * 0.04;
			sigil.scale.set(ss);
		}

		banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, this.constructor.vars.purple, 0.06 + pulse * 0.08);
		banner.innerGlow.alpha = 0.42 + pulse * 0.08;

		if (Math.random() < 0.16) this.spawnRuneSpark(banner, 1);
		if (Math.random() < 0.12) this.spawnAbsorbSmoke(banner, 1);
	}

	onPrepareExit(banner) {
		banner.resetVisualState();
		banner.bodyGroup.visible = true;
		banner.bodyGroup.alpha = 1;

		const veil = banner.getEffectLayer("vecnaRuneVeil");
		const marks = banner.getEffectLayer("vecnaRuneMarks");
		const orbit = banner.getEffectLayer("vecnaRuneOrbit");
		const sigil = banner.getEffectLayer("vecnaAbsorbSigil");

		if (veil) veil.alpha = 0.14;
		if (marks) marks.alpha = 0.16;
		if (orbit) {
			orbit.alpha = 0.82;
			this.updateRuneOrbits(orbit, banner.elapsed, "prepare", 1);
		}
		if (sigil) sigil.alpha = 0.16;

		this.spawnRuneSpark(banner, 10);
		this.spawnAbsorbSmoke(banner, 5);
	}

	onExit(banner, t) {
		const gatherT = CriticalRubanUtils.clamp01(t / 0.45);
		const absorbT = CriticalRubanUtils.clamp01((t - 0.45) / 0.55);

		const veil = banner.getEffectLayer("vecnaRuneVeil");
		const marks = banner.getEffectLayer("vecnaRuneMarks");
		const orbit = banner.getEffectLayer("vecnaRuneOrbit");
		const sigil = banner.getEffectLayer("vecnaAbsorbSigil");

		if (t <= 0.45) {
			const e = CriticalRubanUtils.easeOutCubic(gatherT);

			banner.root.alpha = 1;
			banner.root.position.set(banner.baseX, banner.baseY);
			banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1, 1.025, e));
			banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(0, -0.012, e);
			banner.motion.tint = CriticalRubanUtils.mixHex(0xffffff, this.constructor.vars.purpleBright, 0.16 * e);
			banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.42, 0.18, e);
			banner.bodyGroup.alpha = CriticalRubanUtils.lerp(1, 0.96, e);

			if (veil) veil.alpha = CriticalRubanUtils.lerp(0.14, 0.22, e);

			if (marks) {
				marks.alpha = CriticalRubanUtils.lerp(0.16, 0.32, e);
			}

			if (orbit) {
				orbit.alpha = CriticalRubanUtils.lerp(0.82, 1.0, e);
				orbit.rotation += 0.02;
				this.updateRuneOrbits(orbit, banner.elapsed, "absorb", CriticalRubanUtils.lerp(1, 0.48, e));
			}

			if (sigil) {
				sigil.alpha = CriticalRubanUtils.lerp(0.16, 0.34, e);
				sigil.rotation = -(banner.elapsed / 1000) * 1.6;
				const ss = CriticalRubanUtils.lerp(0.94, 1.06, e);
				sigil.scale.set(ss);
			}

			if (Math.random() < 0.28) this.spawnRuneSpark(banner, 2);
			if (Math.random() < 0.14) this.spawnAbsorbSmoke(banner, 1);
			return;
		}

		const e = CriticalRubanUtils.easeInCubic(absorbT);

		banner.root.alpha = 1 - e;
		banner.root.position.set(
			banner.baseX,
			banner.baseY + CriticalRubanUtils.lerp(0, -4, e)
		);
		banner.motion.scale.set(banner.baseScale * CriticalRubanUtils.lerp(1.025, 0.92, e));
		banner.motion.rotation = banner.baseRotation + CriticalRubanUtils.lerp(-0.012, 0.02, e);
		banner.motion.tint = CriticalRubanUtils.mixHex(this.constructor.vars.purpleBright, this.constructor.vars.inkDeep, e * 0.70);
		banner.innerGlow.alpha = CriticalRubanUtils.lerp(0.18, 0, e);
		banner.bodyGroup.alpha = CriticalRubanUtils.lerp(0.96, 0.0, e * 1.2);

		if (veil) {
			veil.alpha = CriticalRubanUtils.lerp(0.22, 0.06, e);
		}

		if (marks) {
			marks.alpha = CriticalRubanUtils.lerp(0.32, 0.0, e);
		}

		if (orbit) {
			orbit.alpha = CriticalRubanUtils.lerp(1.0, 0.0, e * 1.15);
			orbit.rotation += 0.06;
			this.updateRuneOrbits(orbit, banner.elapsed, "absorb", CriticalRubanUtils.lerp(0.48, 0.04, e));
		}

		if (sigil) {
			sigil.alpha = CriticalRubanUtils.lerp(0.34, 0.0, e);
			sigil.rotation = -(banner.elapsed / 1000) * 3.2;
			const ss = CriticalRubanUtils.lerp(1.06, 0.38, e);
			sigil.scale.set(ss);
		}

		if (Math.random() < 0.38) this.spawnRuneSpark(banner, 2);
		if (Math.random() < 0.26) this.spawnAbsorbSmoke(banner, 2);
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

  runeSegmentsForKind(kind, size) {
    const s = size;
    switch (kind % 8) {
      case 0:
        return [
          [-s * 0.58, -s, 0, -s * 0.24],
          [0, -s * 0.24, -s * 0.48, s],
          [0, -s * 0.24, s * 0.56, s * 0.10],
          [-s * 0.18, s * 0.28, s * 0.58, s * 0.28]
        ];
      case 1:
        return [
          [0, -s, 0, s],
          [-s * 0.62, -s * 0.28, s * 0.24, -s * 0.28],
          [-s * 0.44, s * 0.60, s * 0.60, s * 0.08]
        ];
      case 2:
        return [
          [-s * 0.50, -s * 0.88, s * 0.56, -s * 0.88],
          [s * 0.22, -s * 0.88, -s * 0.20, s],
          [-s * 0.58, s * 0.16, s * 0.38, s * 0.16]
        ];
      case 3:
        return [
          [-s * 0.56, -s * 0.92, -s * 0.56, s * 0.90],
          [-s * 0.56, -s * 0.92, s * 0.50, -s * 0.20],
          [-s * 0.56, s * 0.10, s * 0.56, s * 0.90]
        ];
      case 4:
        return [
          [0, -s, 0, s],
          [-s * 0.60, -s * 0.64, 0, -s * 0.10],
          [s * 0.60, -s * 0.64, 0, -s * 0.10],
          [-s * 0.52, s * 0.92, s * 0.52, s * 0.92]
        ];
      case 5:
        return [
          [-s * 0.58, -s * 0.86, s * 0.18, -s * 0.86],
          [s * 0.18, -s * 0.86, -s * 0.12, s * 0.02],
          [-s * 0.12, s * 0.02, s * 0.56, s],
          [-s * 0.50, s * 0.34, s * 0.34, s * 0.34]
        ];
      case 6:
        return [
          [-s * 0.58, -s * 0.80, s * 0.06, -s * 0.08],
          [s * 0.06, -s * 0.08, -s * 0.54, s * 0.84],
          [-s * 0.06, -s * 0.10, s * 0.58, -s * 0.72],
          [-s * 0.14, s * 0.24, s * 0.56, s * 0.24]
        ];
      default:
        return [
          [-s * 0.20, -s, -s * 0.20, s],
          [s * 0.20, -s, s * 0.20, s],
          [-s * 0.56, -s * 0.46, s * 0.56, -s * 0.46],
          [-s * 0.46, s * 0.52, s * 0.46, s * 0.52]
        ];
    }
  }

  drawPartialSegments(g, segments, width, color, alpha, reveal = 1) {
    if (reveal <= 0) return g;
    const total = segments.length;
    const scaled = Math.max(0, Math.min(1, reveal)) * total;
    const fullCount = Math.floor(scaled);
    const partial = scaled - fullCount;

    CriticalRubanUtils.gLineStyle(g, width, color, alpha);

    for (let i = 0; i < fullCount; i++) {
      const seg = segments[i];
      g.moveTo(seg[0], seg[1]);
      g.lineTo(seg[2], seg[3]);
    }

    if (fullCount < total && partial > 0.001) {
      const seg = segments[fullCount];
      const x1 = seg[0];
      const y1 = seg[1];
      const x2 = seg[2];
      const y2 = seg[3];
      g.moveTo(x1, y1);
      g.lineTo(
        x1 + (x2 - x1) * partial,
        y1 + (y2 - y1) * partial
      );
    }

    return g;
  }

  redrawRuneSymbol(rune, reveal = 1, alphaMul = 1) {
    const data = rune._runeData;
    if (!data) return;

    const { glow, ring, core, size, color, alpha, segments } = data;

    glow.clear();
    ring.clear();
    core.clear();

    this.drawPartialSegments(
      glow,
      segments,
      Math.max(4, size * 0.30),
      this.constructor.vars.purpleBright,
      alpha * 0.22 * alphaMul,
      reveal
    );

    this.drawPartialSegments(
      core,
      segments,
      Math.max(2.6, size * 0.16),
      color,
      alpha * alphaMul,
      reveal
    );

    const ringReveal = Math.max(0, (reveal - 0.22) / 0.78);
    if (ringReveal > 0) {
      CriticalRubanUtils.gLineStyle(ring, 1.8, this.constructor.vars.purpleBright, alpha * 0.24 * ringReveal * alphaMul);
      ring.drawCircle(0, 0, size * data.ringScale);
    }
  }

  createRuneSymbol(size = 22, color = this.constructor.vars.pale, alpha = 0.78, progressive = false) {
    const c = new PIXI.Container();

    const glow = new PIXI.Graphics();
    const ring = new PIXI.Graphics();
    const core = new PIXI.Graphics();

    const kind = Math.floor(CriticalRubanUtils.randomBetween(0, 8));
    const segments = this.runeSegmentsForKind(kind, size);

    c._runeData = {
      glow,
      ring,
      core,
      size,
      color,
      alpha,
      segments,
      ringScale:CriticalRubanUtils.randomBetween(1.2, 1.6),
      progressive,
      reveal: progressive ?CriticalRubanUtils.randomBetween(0.0, 0.25) : 1,
      revealSpeed: progressive ?CriticalRubanUtils.randomBetween(0.45, 1.05) : 0,
      revealDelay: progressive ?CriticalRubanUtils.randomBetween(0.0, 0.9) : 0,
      revealPhase:CriticalRubanUtils.randomBetween(0, Math.PI * 2)
    };

    c.addChild(glow, ring, core);
    c.scale.set(CriticalRubanUtils.randomBetween(1.10, 1.35));

    this.redrawRuneSymbol(c, c._runeData.reveal, 1);
    return c;
  }

  buildRuneOrbitLayer(banner) {
    const c = new PIXI.Container();
    c._runes = [];

    const count = 13;
    for (let i = 0; i < count; i++) {
      const progressive = i % 3 === 0 || i % 5 === 0;

      const rune = this.createRuneSymbol(
       CriticalRubanUtils.randomBetween(16, 28),
        i % 3 === 0 ? this.constructor.vars.pale : this.constructor.vars.purpleBright,
        i % 3 === 0 ? 0.90 : 0.75,
        progressive
      );

      const angle = (i / count) * Math.PI * 2 +CriticalRubanUtils.randomBetween(-0.14, 0.14);
      const radiusX =CriticalRubanUtils.randomBetween(banner.mainWidth * 0.42, banner.mainWidth * 0.72);
      const radiusY =CriticalRubanUtils.randomBetween(banner.height * 0.90, banner.height * 1.60);

      rune._orbit = {
        angle,
        radiusX,
        radiusY,
        speed:CriticalRubanUtils.randomBetween(0.16, 0.38) * (Math.random() < 0.5 ? -1 : 1),
        wobble:CriticalRubanUtils.randomBetween(0.02, 0.08),
        wobbleSpeed:CriticalRubanUtils.randomBetween(1.2, 2.8),
        pulsePhase:CriticalRubanUtils.randomBetween(0, Math.PI * 2),
        pulseSpeed:CriticalRubanUtils.randomBetween(1.8, 3.4),
        drift:CriticalRubanUtils.randomBetween(2, 7)
      };

      c._runes.push(rune);
      c.addChild(rune);
    }

    return c;
  }

  drawRuneVeil(banner) {
    const c = new PIXI.Container();

    const bodyBack = new PIXI.Graphics();
    this.drawBodyShape(bodyBack, banner, {
      inset: -8,
      fill: this.constructor.vars.inkDeep,
      fillAlpha: 0.26
    });

    const bodyCore = new PIXI.Graphics();
    this.drawBodyShape(bodyCore, banner, {
      inset: 2,
      fill: this.constructor.vars.ink,
      fillAlpha: 0.18,
      lineWidth: 2,
      lineColor: this.constructor.vars.purpleBright,
      lineAlpha: 0.10
    });

    const left = new PIXI.Graphics();
    this.drawTailShape(left, banner, true, {
      inset: -6,
      fill: this.constructor.vars.inkDeep,
      fillAlpha: 0.20
    });

    const right = new PIXI.Graphics();
    this.drawTailShape(right, banner, false, {
      inset: -6,
      fill: this.constructor.vars.inkDeep,
      fillAlpha: 0.20
    });

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    c.addChild(bodyBack, bodyCore, left, right);
    return c;
  }

  drawAbsorbSigil(banner) {
    const c = new PIXI.Container();

    const ring1 = new PIXI.Graphics();
    const ring2 = new PIXI.Graphics();
    const star = new PIXI.Graphics();

    CriticalRubanUtils.gLineStyle(ring1, 2, this.constructor.vars.purpleBright, 0.28);
    ring1.drawCircle(0, 0, banner.height * 0.70);

    CriticalRubanUtils.gLineStyle(ring2, 1.5, this.constructor.vars.pale, 0.20);
    ring2.drawCircle(0, 0, banner.height * 1.02);

    CriticalRubanUtils.gStar(
      star,
      0,
      0,
      8,
      banner.height * 0.54,
      banner.height * 0.28,
      null,
      1,
      2,
      this.constructor.vars.magenta,
      0.14
    );

    c.addChild(ring1, ring2, star);
    return c;
  }

  drawInnerMarkings(banner) {
    const g = new PIXI.Graphics();
    CriticalRubanUtils.gLineStyle(g, 2, this.constructor.vars.pale, 0.18);

    const x0 = -banner.mainWidth / 2 + 28;
    const x1 = banner.mainWidth / 2 - 28;

    g.moveTo(x0, -6);
    g.lineTo(x0 + 34, -16);
    g.lineTo(x0 + 62, -6);

    g.moveTo(-18, -14);
    g.lineTo(0, 16);
    g.lineTo(22, -10);

    g.moveTo(x1 - 58, 12);
    g.lineTo(x1 - 28, -10);
    g.lineTo(x1, 10);

    return g;
  }

  spawnRuneSpark(banner, count = 1) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        shape: "circle",
        x:CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.54, banner.mainWidth * 0.54),
        y:CriticalRubanUtils.randomBetween(-banner.height * 0.42, banner.height * 0.34),
        radius:CriticalRubanUtils.randomBetween(1.8, 3.8),
        color: Math.random() < 0.7 ? this.constructor.vars.purpleBright : this.constructor.vars.pale,
        alpha:CriticalRubanUtils.randomBetween(0.42, 0.82),
        vx:CriticalRubanUtils.randomBetween(-34, 34),
        vy:CriticalRubanUtils.randomBetween(-54, -14),
        vr:CriticalRubanUtils.randomBetween(-0.04, 0.04),
        life:CriticalRubanUtils.randomBetween(360, 760),
        scaleFrom: 1,
        scaleTo: 0.18
      });
    }
  }

  spawnAbsorbSmoke(banner, count = 2) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        shape: "circle",
        x:CriticalRubanUtils.randomBetween(-banner.mainWidth * 0.34, banner.mainWidth * 0.34),
        y:CriticalRubanUtils.randomBetween(-banner.height * 0.28, banner.height * 0.24),
        radius:CriticalRubanUtils.randomBetween(5, 10),
        color: Math.random() < 0.8 ? this.constructor.vars.inkDeep : this.constructor.vars.purple,
        alpha:CriticalRubanUtils.randomBetween(0.10, 0.22),
        vx:CriticalRubanUtils.randomBetween(-16, 16),
        vy:CriticalRubanUtils.randomBetween(-18, 8),
        vr:CriticalRubanUtils.randomBetween(-0.03, 0.03),
        life:CriticalRubanUtils.randomBetween(540, 980),
        scaleFrom:CriticalRubanUtils.randomBetween(0.8, 1.0),
        scaleTo:CriticalRubanUtils.randomBetween(1.18, 1.54)
      });
    }
  }

  updateRuneReveal(rune, elapsedMS, phase = "hold", absorbIntensity = 1) {
    const d = rune?._runeData;
    if (!d) return;

    let reveal = d.reveal;

    if (d.progressive) {
      const t = Math.max(0, elapsedMS / 1000 - d.revealDelay);
      const base = Math.min(1, t * d.revealSpeed);
      const shimmer = (Math.sin(elapsedMS / 1000 * 2.4 + d.revealPhase) + 1) * 0.5;

      if (phase === "hold") {
        reveal = Math.max(d.reveal, Math.min(1, base + shimmer * 0.06));
      } else if (phase === "prepare") {
        reveal = Math.max(d.reveal, Math.min(1, base + 0.10 + shimmer * 0.05));
      } else {
        reveal = Math.max(d.reveal, Math.min(1, base + 0.16 + absorbIntensity * 0.08));
      }
    } else {
      reveal = 1;
    }

    d.reveal = Math.min(1, reveal);
    this.redrawRuneSymbol(rune, d.reveal, 1);
  }

  updateRuneOrbits(layer, elapsedMS, phase = "hold", intensity = 1) {
    if (!layer?._runes?.length) return;
    const t = elapsedMS / 1000;

    for (const rune of layer._runes) {
      const o = rune._orbit;
      const wave = Math.sin(t * o.wobbleSpeed + o.pulsePhase);
      const pulse = (Math.sin(t * o.pulseSpeed + o.pulsePhase) + 1) * 0.5;

      let angle = o.angle + t * o.speed;
      let rx = o.radiusX;
      let ry = o.radiusY;

      if (phase === "prepare") {
        rx *= 0.92;
        ry *= 0.92;
      } else if (phase === "absorb") {
        rx *= intensity;
        ry *= intensity;
      }

      rune.x = Math.cos(angle) * rx + Math.cos(t * 1.3 + o.pulsePhase) * o.drift;
      rune.y = Math.sin(angle) * ry + wave * o.drift;

      rune.rotation += 0.01 * Math.sign(o.speed) + wave * 0.004;
      rune.alpha = 0.58 + pulse * 0.38;

      const s = 0.92 + pulse * 0.24;
      rune.scale.set(s);

      if (phase === "absorb") {
        rune.alpha *= intensity;
        rune.scale.set(s * (0.84 + intensity * 0.34));
      }

      this.updateRuneReveal(rune, elapsedMS, phase, intensity);
    }
  }
}
