(() => {
  const EFFECT_ID = "demonCrownShatter";

  function drawMistBlob(g, x, y, rx, ry, color, alpha) {
    g.beginFill(color, alpha);
    g.drawEllipse(x, y, rx, ry);
    g.endFill();
  }

  function drawBodyShape(g, banner, {
    inset = 0,
    fill = null,
    fillAlpha = 1,
    lineWidth = 0,
    lineColor = 0x000000,
    lineAlpha = 1
  } = {}) {
    const x = -banner.mainWidth / 2 + inset;
    const y = -banner.height / 2 + inset;
    const w = banner.mainWidth - inset * 2;
    const h = banner.height - inset * 2;
    const topInset = Math.max(8, 18 - inset * 0.35);
    const sideBulge = Math.max(4, 10 - inset * 0.20);
    const lowerDip = Math.max(3, 8 - inset * 0.15);

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

  function drawTailShape(g, banner, isLeft, {
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

  function createAuraLayer(banner) {
    const c = new PIXI.Container();
    c._blobs = [];

    for (let i = 0; i < 7; i++) {
      const g = new PIXI.Graphics();
      c.addChild(g);
      c._blobs.push({
        g,
        x: randomBetween(-banner.mainWidth * 0.36, banner.mainWidth * 0.36),
        y: randomBetween(-banner.height * 0.18, banner.height * 0.18),
        rx: randomBetween(34, 88),
        ry: randomBetween(14, 30),
        phase: Math.random() * Math.PI * 2,
        drift: randomBetween(3, 8)
      });
    }

    return c;
  }

  function redrawAura(layer, elapsed, alphaMul = 1) {
    if (!layer?._blobs) return;
    const t = elapsed / 1000;

    for (const blob of layer._blobs) {
      blob.g.clear();

      const ox = Math.sin(t * 0.84 + blob.phase) * blob.drift;
      const oy = Math.cos(t * 0.63 + blob.phase * 1.2) * (blob.drift * 0.42);

      drawMistBlob(blob.g, blob.x + ox, blob.y + oy, blob.rx, blob.ry, 0x281336, 0.09 * alphaMul);
      drawMistBlob(blob.g, blob.x + ox * 0.62, blob.y + oy * 0.62, blob.rx * 0.70, blob.ry * 0.70, 0x7a4ac4, 0.06 * alphaMul);
    }
  }

  function createDarkRibbonOverlay(banner) {
    const c = new PIXI.Container();

    const auraBody = new PIXI.Graphics();
    drawBodyShape(auraBody, banner, {
      inset: -10,
      fill: 0x9d6cff,
      fillAlpha: 0.14
    });

    const bodyBase = new PIXI.Graphics();
    drawBodyShape(bodyBase, banner, {
      inset: 2,
      fill: 0x2b1439,
      fillAlpha: 0.98,
      lineWidth: 3,
      lineColor: 0xa874ff,
      lineAlpha: 0.38
    });

    const bodyMid = new PIXI.Graphics();
    drawBodyShape(bodyMid, banner, {
      inset: 6,
      fill: 0x4a2572,
      fillAlpha: 0.94
    });

    const bodyGloss = new PIXI.Graphics();
    drawBodyShape(bodyGloss, banner, {
      inset: 12,
      fill: 0xd5b7ff,
      fillAlpha: 0.12
    });

    const makeTail = (isLeft) => {
      const tail = new PIXI.Container();

      const aura = new PIXI.Graphics();
      drawTailShape(aura, banner, isLeft, {
        inset: -10,
        fill: 0xa26cff,
        fillAlpha: 0.12
      });

      const base = new PIXI.Graphics();
      drawTailShape(base, banner, isLeft, {
        inset: 2,
        fill: 0x2b1439,
        fillAlpha: 0.98,
        lineWidth: 3,
        lineColor: 0xa874ff,
        lineAlpha: 0.34
      });

      const mid = new PIXI.Graphics();
      drawTailShape(mid, banner, isLeft, {
        inset: 6,
        fill: 0x4a2572,
        fillAlpha: 0.92
      });

      const gloss = new PIXI.Graphics();
      drawTailShape(gloss, banner, isLeft, {
        inset: 10,
        fill: 0xd5b7ff,
        fillAlpha: 0.10
      });

      tail.addChild(aura, base, mid, gloss);
      return tail;
    };

    const left = makeTail(true);
    const right = makeTail(false);

    left.x = -banner.mainWidth / 2 - 14;
    right.x = banner.mainWidth / 2 + 14;

    c.addChild(auraBody, bodyBase, bodyMid, bodyGloss, left, right);
    return c;
  }

  function createDarkRibbonCutMask() {
    const c = new PIXI.Container();
    c._mask = new PIXI.Graphics();
    c.addChild(c._mask);
    return c;
  }

  function redrawDarkRibbonCutMask(layer, banner, reveal = 0, flare = 0) {
    if (!layer?._mask) return;

    const g = layer._mask;
    g.clear();

    if (reveal <= 0) return;

    const fullW = banner.totalWidth + 170;
    const w = fullW * reveal;
    const h = banner.height + 90 + flare * 26;

    g.beginFill(0xffffff, 1);
    g.drawRoundedRect(-w / 2, -h / 2, w, h, Math.min(50, 12 + reveal * 32));
    g.endFill();

    g.beginFill(0xffffff, 1);
    g.drawEllipse(0, 0, 38 + flare * 36, 18 + flare * 14);
    g.endFill();

    g.beginFill(0xffffff, 1);
    g.drawEllipse(0, 0, 18 + flare * 20, 42 + flare * 18);
    g.endFill();
  }

  function createHolyFlashLayer() {
    const c = new PIXI.Container();
    c._core = new PIXI.Graphics();
    c._cross = new PIXI.Graphics();
    c._rings = new PIXI.Graphics();
    c.addChild(c._rings, c._core, c._cross);
    return c;
  }

  function redrawHolyFlash(layer, charge = 0, burst = 0, alpha = 1) {
    if (!layer?._core || !layer?._cross || !layer?._rings) return;

    const core = layer._core;
    const cross = layer._cross;
    const rings = layer._rings;

    core.clear();
    cross.clear();
    rings.clear();

    const glowW = 40 + charge * 180 + burst * 130;
    const glowH = 16 + charge * 54 + burst * 32;

    drawMistBlob(rings, 0, 0, glowW * 0.85, glowH * 1.35, 0xb986ff, (0.05 + charge * 0.10) * alpha);
    drawMistBlob(rings, 0, 0, glowW * 0.52, glowH * 0.90, 0xf0dcff, (0.08 + burst * 0.16) * alpha);

    drawMistBlob(core, 0, 0, glowW, glowH, COLORS.white, (0.06 + charge * 0.18 + burst * 0.26) * alpha);
    drawMistBlob(core, 0, 0, glowW * 0.34, glowH * 0.44, 0xffffff, (0.10 + burst * 0.34) * alpha);

    cross.beginFill(COLORS.white, (0.04 + burst * 0.34) * alpha);
    cross.drawRoundedRect(-glowW * 0.65, -8 - burst * 8, glowW * 1.30, 16 + burst * 16, 10);
    cross.endFill();

    cross.beginFill(COLORS.white, (0.03 + burst * 0.18) * alpha);
    cross.drawRoundedRect(-10 - burst * 10, -glowH * 1.45, 20 + burst * 20, glowH * 2.90, 10);
    cross.endFill();
  }

  function spawnDarkParticles(banner, count = 6) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        shape: Math.random() < 0.35 ? "star" : "circle",
        x: randomBetween(-banner.totalWidth * 0.42, banner.totalWidth * 0.42),
        y: randomBetween(-banner.height * 0.38, banner.height * 0.38),
        radius: randomBetween(1.8, 3.8),
        color: Math.random() < 0.55 ? 0x8752ce : 0xc59cff,
        alpha: randomBetween(0.26, 0.62),
        vx: randomBetween(-12, 12),
        vy: randomBetween(-18, 10),
        vr: randomBetween(-0.03, 0.03),
        life: randomBetween(900, 1500),
        scaleFrom: randomBetween(0.90, 1.18),
        scaleTo: 0.10
      });
    }
  }

  function spawnLightBurst(banner, count = 18, force = 1) {
    for (let i = 0; i < count; i++) {
      banner.spawnParticle({
        parent: "fx",
        shape: Math.random() < 0.55 ? "star" : "circle",
        x: randomBetween(-30, 30),
        y: randomBetween(-14, 14),
        radius: randomBetween(2.0, 5.0),
        color: Math.random() < 0.55 ? 0xe8d6ff : COLORS.white,
        alpha: randomBetween(0.55, 0.98),
        vx: randomBetween(-150, 150) * force,
        vy: randomBetween(-120, 70) * force,
        vr: randomBetween(-0.07, 0.07),
        life: randomBetween(650, 1100),
        scaleFrom: randomBetween(1.0, 1.35),
        scaleTo: 0.10
      });
    }
  }

  globalThis.CriticalRubanEffects.registerRubanEffect({
    id: EFFECT_ID,
    types: ["critical"],
    startDelay: 3000,
    totalDuration: 1250,

    setup(banner) {
      banner.text.alpha = 0;
      banner.badge.alpha = 0.18;

      banner.addEffectLayer("abyssAura", createAuraLayer(banner), {
        parent: "bodyGroup",
        alpha: 0
      });

      banner.addEffectLayer("darkRibbon", createDarkRibbonOverlay(banner), {
        parent: "bodyGroup",
        alpha: 1
      });

      banner.addEffectLayer("darkRibbonCutMask", createDarkRibbonCutMask(), {
        parent: "bodyGroup",
        alpha: 1
      });

      banner.addEffectLayer("holyFlash", createHolyFlashLayer(), {
        parent: "fx",
        alpha: 0
      });
    },

    onHold(banner) {
      const time = banner.elapsed / 1000;
      const pulse = (Math.sin(time * 3.0) + 1) * 0.5;

      const aura = banner.getEffectLayer("abyssAura");
      const darkRibbon = banner.getEffectLayer("darkRibbon");
      const darkRibbonCutMask = banner.getEffectLayer("darkRibbonCutMask");
      const holyFlash = banner.getEffectLayer("holyFlash");

      banner.root.alpha = 1;
      banner.root.position.set(banner.baseX, banner.baseY + Math.sin(time * 1.6) * 0.7);
      banner.motion.scale.set(banner.baseScale * (1 + pulse * 0.003));
      banner.motion.rotation = banner.baseRotation + Math.sin(time * 1.4) * 0.0025;

      banner.motion.tint = mixHex(0xffffff, 0x6c3fb1, 0.18 + pulse * 0.08);
      banner.innerGlow.alpha = 0.44 + pulse * 0.05;
      banner.text.alpha = 0;
      banner.badge.alpha = 0.15;

      if (aura) {
        aura.alpha = 0.42 + pulse * 0.08;
        redrawAura(aura, banner.elapsed, 1.0);
      }

      if (darkRibbon) {
        darkRibbon.visible = true;
        darkRibbon.alpha = 0.98;
        darkRibbon.mask = null;
      }

      if (darkRibbonCutMask) {
        redrawDarkRibbonCutMask(darkRibbonCutMask, banner, 0, 0);
      }

      if (holyFlash) {
        holyFlash.alpha = 0;
        redrawHolyFlash(holyFlash, 0, 0, 0);
      }

      if (Math.random() < 0.18) spawnDarkParticles(banner, 1);
    },

    onPrepareExit(banner) {
      banner.resetVisualState();
      banner.bodyGroup.visible = true;
      banner.bodyGroup.alpha = 1;
      banner.text.alpha = 0;
      banner.badge.alpha = 0.15;

      const aura = banner.getEffectLayer("abyssAura");
      const darkRibbon = banner.getEffectLayer("darkRibbon");
      const darkRibbonCutMask = banner.getEffectLayer("darkRibbonCutMask");
      const holyFlash = banner.getEffectLayer("holyFlash");

      if (aura) {
        aura.alpha = 0.48;
        redrawAura(aura, banner.elapsed, 1.06);
      }

      if (darkRibbon) {
        darkRibbon.visible = true;
        darkRibbon.alpha = 1;
        darkRibbon.mask = null;
      }

      if (darkRibbonCutMask) {
        redrawDarkRibbonCutMask(darkRibbonCutMask, banner, 0, 0);
      }

      if (holyFlash) {
        holyFlash.alpha = 0;
        redrawHolyFlash(holyFlash, 0.18, 0, 0);
      }

      banner._dcsBurstDone = false;
      spawnDarkParticles(banner, 10);
    },

    onExit(banner, t) {
      const chargeT = clamp01(t / 0.16);
      const breakT = clamp01((t - 0.16) / 0.28);
      const fadeT = clamp01((t - 0.44) / 0.48);

      const aura = banner.getEffectLayer("abyssAura");
      const darkRibbon = banner.getEffectLayer("darkRibbon");
      const darkRibbonCutMask = banner.getEffectLayer("darkRibbonCutMask");
      const holyFlash = banner.getEffectLayer("holyFlash");

      const time = banner.elapsed / 1000;

      if (t <= 0.24) {
        const e = easeOutCubic(chargeT);

        banner.root.alpha = 1;
        banner.root.position.set(banner.baseX, banner.baseY + Math.sin(time * 2.0) * 0.8);
        banner.motion.scale.set(banner.baseScale * lerp(1, 1.015, e));
        banner.motion.rotation = banner.baseRotation + Math.sin(time * 1.8) * 0.003;
        banner.motion.tint = mixHex(0xffffff, 0x7243ba, 0.26 + e * 0.18);
        banner.innerGlow.alpha = lerp(0.44, 0.34, e);

        banner.text.alpha = 0;
        banner.badge.alpha = lerp(0.15, 0.08, e);

        if (aura) {
          aura.alpha = lerp(0.48, 0.66, e);
          redrawAura(aura, banner.elapsed, 1.12 + e * 0.12);
        }

        if (darkRibbon) {
          darkRibbon.visible = true;
          darkRibbon.alpha = 1;
          darkRibbon.mask = null;
        }

        if (darkRibbonCutMask) {
          redrawDarkRibbonCutMask(darkRibbonCutMask, banner, 0, 0);
        }

        if (holyFlash) {
          holyFlash.alpha = lerp(0, 1, e);
          redrawHolyFlash(holyFlash, lerp(0.18, 1, e), 0, holyFlash.alpha);
        }

        if (Math.random() < 0.24) spawnDarkParticles(banner, 1);
        return;
      }

      if (t <= 0.52) {
        const e = easeOutCubic(breakT);
        const flare = Math.sin(e * Math.PI);
        const burst = clamp01((breakT - 0.12) / 0.30);

        banner.root.alpha = 1;
        banner.root.position.set(banner.baseX, banner.baseY);
        banner.motion.scale.set(
          banner.baseScale * lerp(1.015, 1.0, e),
          banner.baseScale * lerp(1.015, 1.0, e)
        );
        banner.motion.rotation = banner.baseRotation;

        banner.motion.tint = mixHex(0x7243ba, 0xffffff, e * 0.72);
        banner.innerGlow.alpha = lerp(0.34, 0.56, e);

        banner.text.alpha = lerp(0, 1, e);
        banner.badge.alpha = lerp(0.08, 1, e);

        if (aura) {
          aura.alpha = lerp(0.66, 0.26, e);
          redrawAura(aura, banner.elapsed, 0.92 - e * 0.18);
        }

        if (holyFlash) {
          holyFlash.alpha = lerp(1, 0.40, e);
          redrawHolyFlash(holyFlash, 1, flare * 1.1, holyFlash.alpha);
        }

        if (darkRibbon && darkRibbonCutMask?._mask) {
          darkRibbon.mask = darkRibbonCutMask._mask;
        }

        if (darkRibbonCutMask) {
          redrawDarkRibbonCutMask(darkRibbonCutMask, banner, e, flare);
        }

        if (darkRibbon) {
          darkRibbon.visible = e < 0.985;
          darkRibbon.alpha = 1;
        }

        if (!banner._dcsBurstDone && burst > 0.10) {
          banner._dcsBurstDone = true;
          spawnLightBurst(banner, 22, 1.0);
          spawnLightBurst(banner, 14, 1.35);
        }

        if (Math.random() < 0.34) {
          spawnLightBurst(banner, 1, randomBetween(0.55, 0.95));
        }

        return;
      }

      const e = easeInCubic(fadeT);

      banner.text.alpha = 1;
      banner.badge.alpha = 1;
      banner.updateCurrentExitBase(fadeT);
      banner.motion.tint = mixHex(0xffffff, 0xf5ebff, fadeT * 0.10);

      if (aura) {
        aura.alpha = lerp(0.26, 0, e);
        redrawAura(aura, banner.elapsed, 0.72 - e * 0.52);
      }

      if (darkRibbon) {
        darkRibbon.visible = false;
        darkRibbon.mask = null;
      }

      if (darkRibbonCutMask) {
        redrawDarkRibbonCutMask(darkRibbonCutMask, banner, 1, 0);
      }

      if (holyFlash) {
        holyFlash.alpha = lerp(0.40, 0, e);
        redrawHolyFlash(holyFlash, 0.22, 0, holyFlash.alpha);
      }
    },

    onDestroy(banner) {
      const darkRibbon = banner.getEffectLayer("darkRibbon");
      if (darkRibbon) darkRibbon.mask = null;

      banner.motion.tint = 0xffffff;
      banner.text.alpha = 1;
      banner.badge.alpha = 1;
    }
  });
})();